// Declaramos el telegraf, express y el parseo del rss y el lector de archivos
const Telegraf = require('telegraf');
const express = require('express');
let Parser = require('rss-parser');
let parser = new Parser();
let fs = require('fs');

// Instanciamos express
const expressApp = express();

// Le pasamos a Telegraf el token del bot y lo instanciamos
const token = '1275460104:AAEckMRPz6HNXKP9IfEdkXNm7P8q8mGtar4';
const bot = new Telegraf(token);

// Le decimos al Bot donde va a enviar los mensajes recibidos
expressApp.use(bot.webhookCallback('/bot'))
bot.telegram.setWebhook('https://59c4bf5268fe.ngrok.io/bot');

// Objeto con info del feed del ejemplo
const feedRtve = {id : "NoticiasRtve", rss: "http://api2.rtve.es/rss/temas_deportes.xml"};

// Funcionalidad de envio de noticias al canal
const rssFeed = async () => {
  let feed = await parser.parseURL('http://api2.rtve.es/rss/temas_deportes.xml');
  let jsonFeed = JSON.stringify(feed);
  
  // Si existe archivo guardado
  if(fs.existsSync('rss/'+feedRtve.id+'.json')){
    // leemos el archivo guardado y comparamos diferencias
    fs.readFile('rss/'+feedRtve.id+'.json', (err, data) => {
      let json = JSON.parse(data);
      let itemDiffs = []
      // Recorremos los items del rss-parse
      feed.items.map((item) => {
        let coincidence = false;
        // Dentro, recorremos por cada item del parse, los item del json guardado, comparamos si hay algun titular que coincida.
        json.items.map(jsonItem => {
          if(item.title == jsonItem.title){
            coincidence = true;
          }
        });
        // Si coincide no hacemos nada pero si no hay coincidencia guardamos ese item nuevo en un array de items
        if(!coincidence){
          itemDiffs.push(item);
        }
      })

      // Si Hemos guardado algun item, recorremos ese array de items y publicamos en el canal con el bot el item
      itemDiffs.length && itemDiffs.map(itemDiff => {
        let msg = itemDiff.title + '\n\n' + itemDiff.link + '\n\n' + itemDiff.contentSnippet
        bot.telegram.sendMessage('@canalrolleprueba', msg);
      } )

      // Si hemos guardado algun item, sobreescribimos el archivo que tenemos guardado por el parse para tenerlo actualizado
      // Si no, no hacemos cambios
      if(itemDiffs.length){
        console.log('Nuevos items: '+itemDiffs.length);
        fs.writeFile('rss/'+feedRtve.id+'.json', jsonFeed, 'utf8', () => {
          console.log('Feed JSON '+feedRtve.id+' actualizado')
        });
      }else{
        console.log('Tarea rssFeed realizada sin cambios')
      }
    });
  }else{
    // Si no existe archivo guardado se crea por primera vez
    fs.writeFile('rss/'+feedRtve.id+'.json', jsonFeed, 'utf8', () => {
      console.log('Feed JSON '+feedRtve.id+' generado')
    });
  }
};

const interval = setInterval(() => {
  rssFeed();
}, 60000)


// Cuando el bot reciba el comando test se ejecutará esta funciona. ctx es un objeto con funciones y valores como cuando ha enviado la info el usuario, el canal, etc.
bot.command('/test', ctx => {
  console.log('COMANDO TEST')
  ctx.reply('Hola Mundo Bot')
})

// La aplicación de express empieza a escuchar
expressApp.listen(3000, () => {
  console.log('El servidor esta escuchando')
})