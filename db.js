const mysql = require('mysql')
const env = require('dotenv').config().parsed

const db = mysql.createConnection({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PWD,
  database: 'chess_web'
})

db.queryExec = (query, values) => {
  return new Promise((res, rej) => {
    db.query(query, values, (err, result) => {
      if (err) rej(err)
      else res(result)
    })
  })
}

module.exports = db;