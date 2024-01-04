const db = require('../db')
const errorHandler = require('./error.controller')

const queryExec = db.queryExec

// functions work primarily on the game table
// see active_game file if you want functions on the active_game table
exports.getUserGames = (req, res) => {
    const { gameID, p1, p2 } = req.body

    if (!gameID && !p1 && !p2) {
        return res.status(200).send({
            message: 'Invalid input!'
        })
    }

    let query = null
    if (gameID) query = `select * from game where gameID = ${gameID}`
    else query = `select * from game where p1 = ${p1} && p2 = ${p2}`

    queryExec(query)
    .then((result) => { return res.status(200).send(result) })
    .catch((err) => {
        console.log(err)
        return res.status(400).send({
            error: err
        })
    })
}

exports.createGame = (req, res) => {
    let { wp, bp, date, result, record, timer } = req.body

    if (!record) {
        return res.status(400).send({
            message: 'No game record is provided'
        })
    }

    if (!date) date = null
    else date = date.slice(0, date.lastIndexOf('T')) 
    const getDateQuery = `STR_TO_DATE(${(date) ? "'" + date + "'" : date}, '%Y-%m-%d')`

    queryExec(`insert into game(wp, bp, date, result, record, timer) values(?, ?, ?, ?, ?, ?)`, 
        [wp, bp, getDateQuery, result, record, timer])
    .then(() => { return res.sendStatus(200) })
    .catch(() => {
        console.log(err)
        return res.status(400).send({
            error: err
        })
    })
}

