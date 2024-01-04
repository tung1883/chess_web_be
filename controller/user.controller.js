const db = require('../db')
const queryExec = db.queryExec
const { errorHandler } = require('./error.controller')

exports.getUserList = (req, res) => {
    queryExec('select userID, user from user')
    .then((result) => {
        return res.send(result)
    })
    .catch((err) => errorHandler(err, res))
}

exports.getUsername = (req, res) => {
    const { userID } = req.body

    if (!userID) {
        return res.status(400).send({
            error: 'not providing userID'
        })
    }

    queryExec('select user from user where userID=?', [userID])
    .then((result) => {
        return res.send(result[0])
    })
    .catch((err) => errorHandler(err, res))
}