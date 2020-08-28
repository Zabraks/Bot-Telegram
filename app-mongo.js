// Declaramos el telegraf, express y el cliente de Mongo
const Telegraf = require('telegraf');
const express = require('express');
const { MongoClient } = require("mongodb");

// Instanciamos express
const expressApp = express();

// Le pasamos a Telegraf el token del bot y lo instanciamos
const token = '1275460104:AAEckMRPz6HNXKP9IfEdkXNm7P8q8mGtar4';
const bot = new Telegraf(token);

// Preparamos la conexion de Mongo
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useUnifiedTopology: true });

// Le decimos al Bot donde va a enviar los mensajes recibidos
expressApp.use(bot.webhookCallback('/bot'))
bot.telegram.setWebhook('https://59c4bf5268fe.ngrok.io/bot');

// Funcion que escucha los eventos de mongo y hace que el bot escriba en el canal
async function runMongo(){
  try {
    // nos conectamos a la BBDD y elegimos la colección que queremos escuchar
    await client.connect();
    const database = client.db("test");
    const collection = database.collection("entradas");

    // Iniciamos el changeStream para que escuche la coleccion
    const changeStream = collection.watch();
    // Cuando el ChangeStream envie un evento de cambio
    changeStream.on('change', next => {
      console.log(next);
      // Comprobramos si es una insercion o modificacion y enviamos el mensaje
      if(next.operationType === 'insert'){
        console.log('NUEVO ITEM', next.operationType, next.fullDocument);
        bot.telegram.sendMessage('@canalrolleprueba', 'Nueva entrada en la base de datos!\t Nombre: ' + next.fullDocument.name);
      }
      if(next.operationType === 'replace'){
        console.log('ITEM MODIFICADO', next.operationType, next.fullDocument);
        bot.telegram.sendMessage('@canalrolleprueba', 'Entrada modificada en la base de datos!\t Nombre: ' + next.fullDocument.name);
      }
    });

  } finally {
    // await client.close();
  }
}

// Lanzamos la aplicación que escucha los eventos
runMongo().catch(console.dir);

// Cuando el bot reciba el comando test se ejecutará esta funciona. ctx es un objeto con funciones y valores como cuando ha enviado la info el usuario, el canal, etc.
bot.command('/test', ctx => {
  console.log('COMANDO TEST')
  ctx.reply('Hola Mundo Bot')
})

// La aplicación de express empieza a escuchar
expressApp.listen(3000, () => {
  console.log('El servidor esta escuchando')
})