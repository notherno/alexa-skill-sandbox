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
  debug: true,
})

alexaApp.intent('Gohan', {}, (request, response) => {
  const kind = request.slots['KIND']

  console.log(request)

  response.say(`${kind.value}にしましょう`)
})

app.listen(PORT, HOST)

console.log('Listening on port ' + PORT)
