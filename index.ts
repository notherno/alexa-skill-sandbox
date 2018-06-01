import 'isomorphic-fetch'
import express = require('express')
import alexa = require('alexa-app')
import _ from 'lodash'
import { AudioItem, Stream } from 'alexa-app'
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

interface Anison {
  video_id: string
  user_name: string
  video_title: string
  added_at: string
  token: string
}

const getConn = async () =>
  await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port,
    database: dbConfig.database,
  })

let anisonMap: {
  [token: string]: Anison
} = {}

let anisonList: string[] = []
;(async () => {
  const conn = await getConn()
  const result = await conn.execute(
    'SELECT * FROM `anison_today` WHERE `is_active` = 1',
  )
  const anisons: Anison[] = result[0].map(anison => ({
    ...anison,
    token: uuid(),
  }))

  anisonMap = _.keyBy(anisons, 'token')
  anisonList = _.shuffle(anisons).map(anison => anison.token)
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

const buildAnisonUrl = (videoId: string) =>
  `${process.env.HOST_NAME}/y/${videoId}`

const buildYoutubeThumbnailUrl = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/0.jpg`

const getPreviousToken = (token: string) => {
  const index = anisonList.indexOf(token)
  if (index === -1) {
    return token
  }
  const prevToken = anisonList[index === 0 ? anisonList.length - 1 : index - 1]
  return anisonMap[prevToken].token
}

const getNextAnison = (token: string) => {
  const index = anisonList.indexOf(token)
  if (index === -1) {
    return anisonMap[anisonList[0]]
  }
  const nextToken = anisonList[index === anisonList.length ? 0 : index + 1]
  return anisonMap[nextToken]
}

const mapAnisonToStream = (anison: Anison, getPrevious: boolean): Stream => {
  const stream: Stream = {
    url: buildAnisonUrl(anison.video_id),
    token: anison.token,
    offsetInMilliseconds: 0,
  }
  return getPrevious
    ? { ...stream, expectedPreviousToken: getPreviousToken(anison.token) }
    : stream
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
  const anison = anisonMap[anisonList[0]]
  response.say('ランダムに再生します').audioPlayerPlay('REPLACE_ALL', {
    stream: mapAnisonToStream(anison, false),
    metadata: {
      title: anison.video_title,
      subtitle: `@${anison.user_name}`,
      art: { sources: [{ url: buildYoutubeThumbnailUrl(anison.video_id) }] },
    },
  } as AudioItem)
})

alexaApp.intent('AMAZON.PauseIntent', {}, async (request, response) => {
  response.say('わかりました').audioPlayerStop()
})

alexaApp.intent('AMAZON.ResumeIntent', {}, async (request, response) => {
  console.log(request.data)
  response.say('仕方ないですね').audioPlayerStop()
})

alexaApp.audioPlayer('PlaybackStarted', async (request, response) => {
  let token
  try {
    token = request.data.request.token
  } catch (e) {
    console.log(e)
    return
  }

  if (token == null) {
    return
  }
  const anison = anisonMap[token]
  response.card({
    type: 'Standard',
    title: anison.video_title,
    text: `Added by @${anison.user_name} at ${anison.added_at}`,
    image: {
      largeImageUrl: buildYoutubeThumbnailUrl(anison.video_id),
    },
  })
})

alexaApp.audioPlayer('PlaybackNearlyFinished', async (request, response) => {
  const token = request.data.request.token
  const anison = getNextAnison(token)
  response.audioPlayerPlay('ENQUEUE', {
    stream: mapAnisonToStream(anison, true),
    metadata: {
      title: anison.video_title,
      subtitle: `@${anison.user_name}`,
      art: { sources: [{ url: buildYoutubeThumbnailUrl(anison.video_id) }] },
    },
  } as AudioItem)
})

app.listen(PORT, HOST)

console.log('Listening on port ' + PORT)
