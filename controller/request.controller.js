const { queryExec } = require("../db")

exports.getRequest = (req, res) => {
    const { reqID } = req.params
    let gameID = null

    queryExec('select gameID from request where reqID=?'
        , [reqID])
    .then(async (result) => {
        gameID = result[0]?.gameID

        if (gameID) {
            let startedTimeQuery = await queryExec('select started_time from active_game where gameID=?', [gameID])
            res.status(200).send({
                gameID, startedTime: startedTimeQuery[0]?.started_time
            })
        } else {
            res.status(200).send({
                gameID: null
            })
        }
    })
    .catch((err) => {
        console.log(err)
        res.status(400).send({
            error: err
        })
    })
}

exports.createRequest = (req, res) => {
    const userID = res.locals.userID
    const { wp, wu, bp, bu, timer } = req.body
    const oppID = (userID == wp) ? bp : wp

    if (!wp || !bp || !wu || !bu || !timer) return res.status(400).send({
        error: 'need to provide ID and username of both players and the time format'
    })

    if (wp == bp) return res.status(400).send({ 
        error: 'user and opponent have the same ID'
    })

    if (userID != wp && userID != bp) return res.status(400).send({
        error: 'User is not authenticated',
    })

    queryExec('insert into request(receiver, wp, wu, bp, bu, timer) values(?, ?, ?, ?, ?, ?)', 
        [oppID, wp, wu, bp, bu, timer])
    .then((result) => { 
        res.status(200).send({
            reqID: result.insertId
        })

        setTimeout(() => {
            queryExec('delete from request where reqID=?', result.insertId)
            .catch((err) => { console.log(err) })
        }, 60 * 1000)
    })
    .catch((err) => {
        console.log(err)
        res.status(400).send({
            error: err
        })
    })
}

exports.requestResponse = (req, res) => {
    const userID = res.locals.userID
    const { reqID, action } = req.body //0: decline, 1: accept
    
    if (!reqID || action === null) {
        return res.status(400).send({
            msg: 'Request ID and action data is required'
        })
    }

    queryExec('select receiver, wp, bp from request where reqID=?', reqID)
    .then((result) => {
        if (userID != result[0].wp && userID != result[0].bp) {
            throw new Error("User is not authorized to update the request")
        }
        
        if (action) {
            return acceptRequest(req, res, reqID)
        } else {
            return declineRequest(req, res, reqID)
        }
    })
    .catch((err) => {
        console.log(err)
        return res.status(400).send({
            error: err
        })
    })  
}

acceptRequest = (req, res, reqID) => { 
    const { gameID } = req.body

    if (!gameID) return res.status(400).send({
        message: "Need to provide game ID to accept the request"
    })

    queryExec('update request set gameID=? where reqID=?', [gameID, reqID])
    .then(() => {
        return res.status(200).send({
            message: 'Game request is accepted',
            gameID: gameID
        })
    })
    .catch((err) => {
        console.log(err)
        res.status(400).send({
            error: err
        })
    })  
}

declineRequest = (req, res, reqID) => {
    queryExec('delete from request where reqID=?', [reqID])
    .then(() => {
        return res.status(200).send({
            msg: 'Request is deleted'
        })
    })
    .catch((err) => {
        console.log(err)
        res.status(400).send({
            error: err
        })
    }) 
}

exports.getReceiverRequestList = (req, res) => {
    const userID = res.locals?.userID
    queryExec('select reqID, receiver, wp, wu, bp, bu, timer from request where receiver=? and gameID is null'
        , [userID])
    .then((result) => {
        const requestList = []
        result.map((request) => requestList.push(request))

        return res.send({
            requestList: requestList
        })
    })
    .catch((err) => {
        console.log(err)
        res.status(400).send({
            error: err
        })
    })
}

exports.getSenderRequestList = (req, res) => {
    const userID = res.locals?.userID
    queryExec('select reqID, receiver, wp, wu, bp, bu, timer from request where wp=? or bp=?', [userID, userID])
    .then((result) => {
        const requestList = []
        result.map((request) => requestList.push(request))

        return res.send({
            requestList: requestList
        })
    })
    .catch((err) => {
        console.log(err)
        res.status(400).send({
            error: err
        })
    })
}