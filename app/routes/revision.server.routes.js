var express = require('express')
var controller = require('../controller/revision.server.controller')
var router = express.Router()
router.get('/',controller.home)
router.get('/revision',controller.revision)
router.post('/signup',controller.signup)
router.post('/login',controller.login)
router.get('/logout',controller.logout)
router.get('/getAuthor',controller.findAuthor)
router.get('/articledata',controller.findArticleData)
router.get('/changeRevision',controller.changeRevision)
//router.get('/findBot',controller.findBot)

router.get('/getOverallData',controller.overalldata)
router.get('/getIndividualData/:title',controller.individualdata)



//--------------
module.exports=router


