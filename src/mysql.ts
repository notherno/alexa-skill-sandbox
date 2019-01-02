import mysql = require('mysql2/promise')
import parseDbUrl = require('parse-database-url')

const dbConfig = parseDbUrl(process.env.DATABASE_URL) as {
  driver: 'mysql'
  user: string
  password: string
  host: string
  port: string
  database: string
}

const dbPool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  port: dbConfig.port,
  database: dbConfig.database,
})

export { dbPool as default }
