var express = require('express');
var userRouter = express();
const auth = require('../middileware/userAuth')
const userController = require('../controllers/userController')
const session = require('express-session')
const upload = require('../multer/multer')
const passport = require('passport');
require('../config/passport-setup');
const config = require('../config/session')
const expressLayouts = require('express-ejs-layouts')



userRouter.use(session({
    secret : config.userSession,
    resave: false,
    saveUninitialized: true,
    cookie : {secure:false}
}))

userRouter.use(passport.initialize());
userRouter.use(passport.session());

userRouter.use((req, res, next) => {
  res.locals.userId = req.session.user_id; 
  next();
});

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



userRouter.get('/',userController.loadHome)
userRouter.get('/login',auth.isLogout,userController.loadLogin)
userRouter.get('/signup',auth.isLogout,userController.loadSignup)
userRouter.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'] 
}));
userRouter.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login', 
}), (req, res) => {
  req.session.user_id = req.user.id;
    res.redirect(req.session.originalUrl || '/');
});
userRouter.get('/logout',userController.logout)
userRouter.get('/about-us',userController.loadAboutUs)
userRouter.get('/contact-us',userController.loadContactUs)
userRouter.get('/gallery',userController.loadgallery)
userRouter.get('/services',userController.loadServices)
userRouter.get('/services/:id',userController.loadServicesDetails)
userRouter.get('/careers',userController.loadCareers)
userRouter.get('/career-details/:id',userController.loadCareerDetails)
userRouter.get('/warrenty-registration',userController.loadWarrantyResgistration)



userRouter.post('/signup',userController.signUp)
userRouter.post('/login',userController.login)
userRouter.post('/contact-us',userController.contact)
userRouter.post('/register-warranty',userController.warrantyRegister)
userRouter.post('/submit-cv',upload.single('cvFile'),userController.uploadCV)
userRouter.post('/verify-payment',userController.verifyPayment)

module.exports = userRouter;
