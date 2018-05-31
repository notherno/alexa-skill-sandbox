import express = require('express')
import alexa = require('alexa-app')

const PORT = 5000
const HOST = '0.0.0.0'
const app = express()

// ALWAYS setup the alexa app and attach it to express before anything else.
const alexaApp = new alexa.app('')

alexaApp.express({
  expressApp: app,
  checkCert: false,

  // sets up a GET route when set to true. This is handy for testing in
  // development, but not recommended for production. disabled by default
  debug: true,
})

// from here on you can setup any other express routes or middlewares as normal
app.set('view engine', 'ejs')

alexaApp.launch((request, response) => {
  response.say('ひらいたよ')
})

alexaApp.intent('Gohan', {}, (request, response) => {
  response.say('ご飯にしましょう')
})

app.listen(PORT, HOST)

console.log('Listening on port ' + PORT)
