var express = require('express');
var router = express.Router();

var { signup, signin, getUserList } = require('../controller/auth.controller')
var { getUserList, getUsername } = require('../controller/user.controller')

router.post('/sign_up', signup);
router.post('/sign_in', signin);
router.get('/', getUserList)
router.post('/', getUsername)

module.exports = router;
