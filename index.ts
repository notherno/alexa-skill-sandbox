import 'isomorphic-fetch'
import express = require('express')
import alexa = require('alexa-app')
import { Stream } from 'alexa-app'
import uuid = require('uuid/v4')
import { Dropbox } from 'dropbox'

const PORT = 5000
const HOST = '0.0.0.0'
const app = express()

const dropbox = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN })

let filePaths: string[] = []
;(async () => {
  const files = await dropbox.filesListFolder({ path: '/sound/radio/' })
  filePaths = files.entries.map(file => file.path_lower)
})()

app.use('/assets', express.static('assets'))

// ALWAYS setup the alexa app and attach it to express before anything else.
const alexaApp = new alexa.app('')

alexaApp.express({
  expressApp: app,
  checkCert: false,
  debug: true,
})

const getAudioStream = async (): Promise<Stream> => {
  const data = await dropbox.filesGetTemporaryLink({
    path: filePaths[Math.floor(Math.random() * (filePaths.length - 1))],
  })

  return {
    url: data.link,
    token: uuid(),
    offsetInMilliseconds: 0,
  }
}

alexaApp.intent(
  'Gohan',
  {
    slots: {
      KIND: 'AMAZON.Food',
    },
  },
  async (request, response) => {
    const kind = request.slots['KIND']

    response
      .say('気分を変えて音楽を聴きましょう')
      .audioPlayerPlayStream('REPLACE_ALL', await getAudioStream())
  },
)

alexaApp.intent('AMAZON.PauseIntent', {}, async (request, response) => {
  response.say('わかりました').audioPlayerStop()
})

alexaApp.intent('AMAZON.ResumeIntent', {}, async (request, response) => {
  response
    .say('仕方ないですね')
    .audioPlayerPlayStream('REPLACE_ALL', await getAudioStream())
})

alexaApp.audioPlayer('PlaybackFinished', async (request, response) => {
  response
    .say('さらに音楽を聴きましょう')
    .audioPlayerPlayStream('REPLACE_ALL', await getAudioStream())
})

app.listen(PORT, HOST)

console.log('Listening on port ' + PORT)
