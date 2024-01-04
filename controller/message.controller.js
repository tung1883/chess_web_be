const { queryExec } = require("../db")

exports.sendMessage = (req, res) => {
    let gameID = req?.params?.gameID
    let userID = res?.locals?.userID
    let message = req.body.message

    if (!gameID || !userID || !message) {
        return res.status(400).send({
            error: 'Server did not receive game ID, user ID or message'
        })
    }

    queryExec('insert into message values(?, ?, ?)', [gameID, userID, message])
    .then(() => {
        return res.send({
            'msg': 'Message sent'
        })
    })
    .catch((err) => {
        console.log(err)
        return res.status(400).send({ error: err })
    })
}

exports.getMessages = (req, res) => {
    let gameID = req?.params?.gameID

    if (!gameID ) {
        return res.status(400).send({
            error: 'Server did not receive game ID'
        })
    }

    queryExec('select userID, message from message where gameID=?', [gameID])
    .then((result) => {
        return res.send({
            messageList: result
        })
    })
    .catch((err) => {
        console.log(err)
        return res.status(400).send({ error: err })
    })
}

exports.deleteMessages = (req, res) => {
    let gameID = req?.params?.gameID

    if (!gameID ) {
        return res.status(400).send({
            error: 'Server did not receive game ID'
        })
    }

    queryExec('delete from message where gameID=?', [gameID])
    .then(() => {
        return res.send({
            'msg': 'messages deleted'
        })
    })
    .catch((err) => {
        console.log(err)
        return res.status(400).send({ error: err })
    })
}