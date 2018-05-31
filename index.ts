import express = require('express')
import alexa = require('alexa-app')
import { Stream } from 'alexa-app'

const PORT = 5000
const HOST = '0.0.0.0'
const app = express()

app.use('/assets', express.static('assets'))

// ALWAYS setup the alexa app and attach it to express before anything else.
const alexaApp = new alexa.app('')

alexaApp.express({
  expressApp: app,
  checkCert: false,
  debug: true,
})

alexaApp.intent(
  'Gohan',
  {
    slots: {
      KIND: 'AMAZON.Food',
    },
  },
  (request, response) => {
    const kind = request.slots['KIND']

    const stream = {
      url: `${process.env.HOST_NAME}/assets/audio.m4a`,
      token: 'someexampletokenhere',
    } as Stream

    response
      .say('気分を変えて音楽を聴きましょう')
      .audioPlayerPlayStream('ENQUEUE', stream)
  },
)

app.listen(PORT, HOST)

console.log('Listening on port ' + PORT)
