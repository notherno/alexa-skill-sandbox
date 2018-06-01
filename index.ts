import 'isomorphic-fetch'
import express = require('express')
import alexa = require('alexa-app')
import { Stream } from 'alexa-app'
import youtubeStream = require('youtube-audio-stream')
import uuid = require('uuid/v4')
import mysql = require('mysql2/promise')
import parseDbUrl = require('parse-database-url')

const PORT = 5000
const HOST = '0.0.0.0'
const app = express()

const dbConfig = parseDbUrl(process.env.DATABASE_URL) as {
  driver: 'mysql'
  user: string
  password: string
  host: string
  port: string
  database: string
}

const getConn = async () =>
  await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port,
    database: dbConfig.database,
  })

let anisons: {
  video_id: string
  user_name: string
  video_title: string
  added_at: string
}[] = []
;(async () => {
  const conn = await getConn()
  const result = await conn.execute('SELECT * FROM `anison_today`')
  anisons = result[0]
})()

app.use('/assets', express.static('assets'))

app.get('/y/:id', (request, response) => {
  youtubeStream(`https://www.youtube.com/watch?v=${request.params.id}`).pipe(
    response,
  )
})

// ALWAYS setup the alexa app and attach it to express before anything else.
const alexaApp = new alexa.app('')

alexaApp.express({
  expressApp: app,
  checkCert: false,
  debug: true,
})

const getRandomAnison = () =>
  anisons[Math.floor(Math.random() * anisons.length)]

const buildAnisonUrl = (videoId: string) =>
  `${process.env.HOST_NAME}/y/${videoId}`

const buildYoutubeThumbnailUrl = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/0.jpg`

const getAudioStream = async (): Promise<Stream> => {
  const anison = getRandomAnison()
  return {
    url: buildAnisonUrl(anison.video_id),
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
  (request, response) => {
    response.say(`今夜は${request.slots['KIND']['value']}にしましょう`)
  },
)

alexaApp.intent('PlayRadioIntent', {}, async (request, response) => {
  const anison = getRandomAnison()
  response
    .say('ランダムに再生します')
    .audioPlayerPlayStream('REPLACE_ALL', {
      url: buildAnisonUrl(anison.video_id),
      token: uuid(),
      offsetInMilliseconds: 0,
    })
    .card({
      type: 'Standard',
      title: anison.video_title,
      text: `Added by ${anison.user_name} at ${anison.added_at}`,
      image: {
        largeImageUrl: buildYoutubeThumbnailUrl(anison.video_id),
      },
    })
})

alexaApp.intent('AMAZON.PauseIntent', {}, async (request, response) => {
  response.say('わかりました').audioPlayerStop()
})

alexaApp.intent('AMAZON.ResumeIntent', {}, async (request, response) => {
  response
    .say('仕方ないですね')
    .audioPlayerPlayStream('REPLACE_ALL', await getAudioStream())
})

alexaApp.audioPlayer('PlaybackNearlyFinished', async (request, response) => {
  response.say('さらに音楽を聴きましょう').audioPlayerPlayStream('ENQUEUE', {
    ...(await getAudioStream()),
    expectedPreviousToken: request.data.request.token,
  })
})

app.listen(PORT, HOST)

console.log('Listening on port ' + PORT)
