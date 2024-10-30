var express = require('express');
var adminRouter = express();
const auth = require('../middileware/adminAuth')
const adminController = require('../controllers/adminController')
const session = require('express-session')
const upload = require('../multer/multer')
const config = require('../config/session')
const expressLayouts = require('express-ejs-layouts')

adminRouter.use(session({
    secret : config.adminSession,
    resave: false,
    saveUninitialized: true,
    cookie : {secure:false}
}))


adminRouter.use(expressLayouts)
adminRouter.set('view engine','ejs')
adminRouter.set('views','./views/admin')
adminRouter.set('layout','../layouts/adminLayout')


adminRouter.get('/',adminController.loadDashbord)
adminRouter.get('/user-management',adminController.loadUserManagement)
adminRouter.get('/add-services',adminController.loadAddServices)
adminRouter.get('/all-services',adminController.loadAllServices)
adminRouter.get('/delete-services/:id',adminController.deleteServices)
adminRouter.get('/add-images',adminController.loadAddImages)
adminRouter.get('/all-images',adminController.loadAllImages)
adminRouter.get('/delete-images/:id',adminController.deleteImage)
adminRouter.get('/add-careers',adminController.loadAddCareers)
adminRouter.get('/all-careers',adminController.loadAllCareers)
adminRouter.get('/delete-careers/:id',adminController.deleteCareers)


adminRouter.post('/add-services',upload.single('image'),adminController.addService)
adminRouter.post('/add-images',upload.single('image'),adminController.addImage)
adminRouter.post('/add-careers',adminController.addCareers)

module.exports = adminRouter;
