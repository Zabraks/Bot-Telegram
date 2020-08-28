// Declaramos el telegraf, express, el cliente de Mysql y el escuchador de eventos de MySQL
const Telegraf = require('telegraf');
const express = require('express');
const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');

// Instanciamos express
const expressApp = express();

// Le pasamos a Telegraf el token del bot y lo instanciamos
const token = '1275460104:AAEckMRPz6HNXKP9IfEdkXNm7P8q8mGtar4';
const bot = new Telegraf(token);

// Le decimos al Bot donde va a enviar los mensajes recibidos
expressApp.use(bot.webhookCallback('/bot'))
bot.telegram.setWebhook('https://59c4bf5268fe.ngrok.io/bot');

// Funcion que establece la conexion con la base de datos de MySQL, genera la instancia del escuchador de eventos y dispara las acciones del escuchador
const program = async () => {
  // Conexion MySQL
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  });

  // Instancia del mysql-events
  const instance = new MySQLEvents(connection, {
    startAtEnd: true // to record only the new binary logs, if set to false or you didn'y provide it all the events will be console.logged after you start the app
  });


  await instance.start();
  // funcion que escribe el mensaje en el canal
  const response = e => {
    console.log(e);
    bot.telegram.sendMessage('@canalrolleprueba', 'Nueva entrada en la base de datos: '+ e.affectedRows[0].after.nombre);
  }
  // Añadimos un disparador de mysql-events y qué hacer cuando se lanza el evento
  instance.addTrigger({
    name: 'monitoring all statments',
    expression: 'prueba.*', // listen to test database !!!
    statement: MySQLEvents.STATEMENTS.ALL, // you can choose only insert for example MySQLEvents.STATEMENTS.INSERT, but here we are choosing everything
    onEvent: e => {
      response(e);
    }
  });

  // Errores del mysql-events
  instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
  instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
};

// Ejecutamos la funcion
program()
  .catch(console.error);


// Cuando el bot reciba el comando test se ejecutará esta funciona. ctx es un objeto con funciones y valores como cuando ha enviado la info el usuario, el canal, etc.
bot.command('/test', ctx => {
  console.log('COMANDO TEST')
  ctx.reply('Hola Mundo Bot')
})

// La aplicación de express empieza a escuchar
expressApp.listen(3000, () => {
  console.log('El servidor esta escuchando')
})