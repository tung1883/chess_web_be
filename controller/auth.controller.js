require('dotenv').config()

const db = require('../db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const queryExec = db.queryExec
const errorHandler = require('./error.controller')

const SESSION_TIME = 2 * 60 * 60 * 1000

exports.signin = (req, res) => {
    const user = req.body?.user
    const pwd = req.body?.pwd

    queryExec('select userID, pwd from user where user=?', [user])
    .then((result) => {
        if (result.length === 0 || !bcrypt.compareSync(pwd, result[0].pwd)) {
            return res.status(401).send("Invalid username or password")
        }

        const userID = result[0].userID

        const token = jwt.sign({
            user: user,
            userID: userID
        }, process.env.API_KEY, {
            expiresIn: 5 * 60 * 1000
        })
        const tokenPayload = token.substr(0, token.lastIndexOf('.') + 1)
        const tokenSignature = token.substr(token.lastIndexOf('.') + 1)

        res.status(200)
        res.cookie('token_signature', tokenSignature, {
            httpOnly: true, 
            secure: true, 
            sameSite: 'Strict',
            maxAge: SESSION_TIME
        })
        res.cookie('token_payload', tokenPayload, {
            secure: true, 
            sameSite: 'Strict',
            maxAge: SESSION_TIME
        })
        res.cookie('user', user, {
            secure: true, 
            sameSite: 'Strict',
            maxAge: SESSION_TIME
        })
        res.cookie('userID', userID, {
            secure: true, 
            sameSite: 'Strict',
            maxAge: SESSION_TIME
        })

        return res.send({
            message: "Login sucessfully"           
        })

    })
    .catch((err) => {
        res.status(400).send({
            error: err
        })
    })
}

exports.signup = (req, res) => {
    const user = req.body?.user
    const pwd = req.body?.pwd

    if (!user || !pwd) return res.status(400).send('user or pwd is not specified')

    const hashedPwd = bcrypt.hashSync(pwd, 8)

    return queryExec('select user from user where user=?', [user])
    .then((result) => {
        if (result.length !== 0) {
            throw Error('User is already taken')
        }

        return queryExec('insert into user(user, pwd) values(?, ?)', [user, hashedPwd])
    })
    .then(() => {
        return res.send({
            message: "Sign up sucessfully"           
        })
    })
    .catch((err) => {
        res.status(400).send(err.message)
    })
}

exports.resetPassword = (req, res) => {
    const user = req.body?.user
    const pwd = req.body?.pwd

    if (!user || !pwd) return res.status(400).send('user or pwd is not specified')

    const hashedPwd = bcrypt.hashSync(pwd, 8)
    return queryExec('select user from user where user=?', [user])
    .then((result) => {
        if (result.length === 0) {
            throw Error('User does not exist')
        }

        return queryExec('update user set pwd=? where user=?', [hashedPwd, user])
    })
    .then(() => {
        res.send({
            message: "Reset password sucessfully"           
        })
    })
    .catch((err) => { 
        res.status(400).send(err.message)
    })
}

exports.verifyToken = (req, res, next) => {
    const token = req.cookies.token_payload + req.cookies.token_signature
    
    if (!token) {
        return res.status(403).send({
            message: 'No token provided'
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.API_KEY)
        if (!decoded?.userID) return res.status(403).send({
            message: 'Can not grab username after verifying token'
        })
        res.locals.userID = decoded.userID
        next()
    } catch (e) {
        res.status(403).send({
            message: 'Error when verifying authentication token...'
        })
    }
}
