const { queryExec } = require("../db")

// create new game in both game and active_game table
exports.createActiveGame = (req, res) => {
    let userID = res?.locals.userID
    let { gameID, wp, bp, timer, startedTime } = req.body
    
    if (userID != wp && userID != bp) return res.status(403).send({
        error: 'user is not one of the player',
        userID, wp, bp
    })
    
    //create new game
    if (!gameID) {
        if (!timer || !startedTime) {
            return res.status(400).send({
                message: 'Need to provide info about time format and started time'
            })
        } 

        queryExec(`insert into game(wp, bp, date) values(?, ?,CURRENT_DATE())`, [wp, bp])
        .then((result) => {
            gameID = result.insertId
            return queryExec(`insert into active_game(gameID, wp, bp, turn, timer, started_time) 
                values(?, ?, ?, ?, ?, ?)`, 
                [gameID, wp, bp, wp, timer, startedTime])
        })
        .then(() => {
            res.status(200).send({
                gameID: gameID,
                timer: timer
            })
        })
        .catch((err) => {
            console.log(err)
            res.sendStatus(400)
        })

        return
    } 

    // update game
    let { result: gameResult, move, time, i1, i2 } = req.body

    if ((!move || !time || !i1 || !i2) && !gameResult) {
        return res.status(400).send({
            message: 'No enough data about move or time record'
        })
    }

    let update = {
        record: null,
        timer: null,
        turn: null,
        moveNumber: null,
    }
    
    queryExec(`select record, turn, move_number, timer from active_game where gameID=?`, gameID)
    .then((result) => {
        // update new data to active_game
        if (result[0]?.turn != userID) {
            throw new Error('Not the turn of the user')
        }

        if (move) {
            update = {
                turn: (userID == wp) ? bp : wp,
                moveNumber: (result[0].move_number !== null) ? result[0].move_number + 1 : 0,
                record: (result[0].record) ? result[0].record + ' ' + move : move,
                timer: result[0].timer + ' ' + time
            }

            return queryExec(`update active_game 
                set record=?, turn=?, move_number=?, timer=?, time_spent=?, i1=?, i2=? where gameID=?`,
                [update.record, update.turn, update.moveNumber, update.timer, time, i1, i2, gameID])   
        }
    })
    .then(() => {
        // clean up when a game is finished
        if (!gameResult) return res.sendStatus(200)

        queryExec('update active_game set result=?', [gameResult])
        .then(() => { 
            return queryExec(`update game set result=?, record=?, timer=? where gameID=?`, 
            [gameResult, update.record, update.timer, gameID])})
        .then(() => { return setTimeout(() => { 
            return queryExec(`delete from active_game where gameID=?`, gameID)
        }, 30 * 1000) }) 
        .then(() => { return res.sendStatus(200) })
    })
    .catch((err) => {
        console.log(err)
        return res.status(400).send({
            error: err
        })
    })
}

exports.updateActiveGame = (req, res) => {
    let userID = res?.locals.userID
    let { gameID, wp, bp, result: gameResult, move, time, i1, i2 } = req.body

    if ((!move || !time || !i1 || !i2) && !gameResult) {
        return res.status(400).send({
            message: 'No enough data about move or time record'
        })
    }

    // store update data
    let update = { }
    
    queryExec(`select record, turn, move_number, timer from active_game where gameID=?`, gameID)
    .then((result) => { 
        // update new data to active_game
        if (result[0]?.turn != userID) {
            throw new Error('Not the turn of the user')
        }

        update = {
            turn: (userID == wp) ? bp : wp,
            moveNumber: (result[0].move_number !== null) ? result[0].move_number + 1 : 0,
            record: (result[0].record) ? result[0].record + ' ' + move : move,
            timer: result[0].timer + ' ' + time
        }

        if (move) {
            return queryExec(`update active_game 
                set record=?, turn=?, move_number=?, timer=?, time_spent=?, i1=?, i2=? where gameID=?`,
                [update.record, update.turn, update.moveNumber, update.timer, time, i1, i2, gameID])   
        }
    })
    .then(() => {
        // clean up when a game is finished
        if (!gameResult) return res.sendStatus(200)

        handleGameFinished(gameID, gameResult, update.record, update.timer)
        .then(() => { return res.sendStatus(200) })
    })
    .catch((err) => {
        console.log(err)
        return res.status(400).send({
            error: err
        })
    })
}

// delete from active_game and add to game table
exports.handleGameFinished = ({ gameID, gameResult, record, timer }) => {
    queryExec('update active_game set result=?', [gameResult])
    .then(() => { 
        queryExec(`update game set result=?, record=?, timer=? where gameID=?`, 
            [gameResult, record, timer, gameID])})
    .then(() => { 
        setTimeout(() => { 
            queryExec(`delete from active_game where gameID=?`, gameID)
        }
    , 30 * 1000) }) 
}

exports.getActiveGame = (req, res) => {
    let userID = res?.locals.userID

    queryExec('select * from active_game where wp=? or bp=?', [userID, userID])
    .then((result) => {
        if (!result[0]) {
            return res.send({
                msg: 'No game is found'
            })
        }

        return res.send({
            game: result[0]
        })
    })
    .catch((err) => {
        console.log(err)
        return res.status(400).send({
            error: err
        })
    })
}

exports.getLastMove = (req, res) => {
    let { gameID } = req.params
    queryExec('select i1, i2, move_number, time_spent, result from active_game where gameID=?', [gameID])
    .then((result) => {
        return res.send(result[0])
    })
    .catch((err) => {
        console.log(err)
        return res.status(400).send({
            error: err
        })
    })
}