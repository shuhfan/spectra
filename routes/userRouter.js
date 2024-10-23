var express = require('express');
var userRouter = express();
const auth = require('../middileware/userAuth')
const userController = require('../controllers/userController')
const session = require('express-session')
const config = require('../config/session')
const expressLayouts = require('express-ejs-layouts')

userRouter.use(session({
    secret : config.userSession,
    resave: false,
    saveUninitialized: true,
    cookie : {secure:false}
}))

userRouter.use((req, res, next)=> {
    const currentUrl = req.originalUrl;
    res.locals.pathname = req.path;
    if (!req.session.user_id && req.method === 'GET' &&  !['/login', '/signup'].includes(currentUrl)) {
      req.session.originalUrl = req.originalUrl; 
      
    }
    next();
  })
userRouter.use(expressLayouts)
userRouter.set('view engine','ejs')
userRouter.set('views','./views/user')
userRouter.set('layout','../layouts/layout')

userRouter.get('/',auth.isLogout,userController.loadHome)


module.exports = userRouter;
