import express = require('express')
import alexa = require('alexa-app')
import { Stream } from 'alexa-app'
import uuid = require('uuid/v4')

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

const getAudioStream = (): Stream => ({
  url: `${process.env.HOST_NAME}/assets/audio.m4a`,
  token: uuid(),
  offsetInMilliseconds: 0,
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

    response
      .say('気分を変えて音楽を聴きましょう')
      .audioPlayerPlayStream('REPLACE_ALL', getAudioStream())
  },
)

alexaApp.intent('AMAZON.PauseIntent', {}, (request, response) => {
  response
    .say('もう一回聞きたいということでしょうか')
    .audioPlayerPlayStream('REPLACE_ALL', getAudioStream())
})

alexaApp.intent('AMAZON.ResumeIntent', {}, (request, response) => {
  response
    .say('仕方ないですね')
    .audioPlayerPlayStream('REPLACE_ALL', getAudioStream())
})

alexaApp.audioPlayer('PlaybackFinished', (request, response) => {
  response
    .say('さらに音楽を聴きましょう')
    .audioPlayerPlayStream('REPLACE_ALL', getAudioStream())
})

app.listen(PORT, HOST)

console.log('Listening on port ' + PORT)
