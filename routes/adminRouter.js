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


adminRouter.get('/',auth.isLogin,adminController.loadDashbord)
adminRouter.get('/login',auth.isLogout,adminController.loadLogin)
adminRouter.get('/logout',auth.isLogin,adminController.logout)
adminRouter.get('/user-management',auth.isLogin,adminController.loadUserManagement)
adminRouter.get('/add-services',auth.isLogin,adminController.loadAddServices)
adminRouter.get('/services',auth.isLogin,adminController.MainServices)
adminRouter.get('/all-services',auth.isLogin,adminController.loadAllServices)
adminRouter.get('/delete-services/:id',auth.isLogin,adminController.deleteServices)
adminRouter.get('/edit-services/:id',auth.isLogin,adminController.loadEditServices)
adminRouter.get('/add-images',auth.isLogin,adminController.loadAddImages)
adminRouter.get('/all-images',auth.isLogin,adminController.loadAllImages)
adminRouter.get('/delete-images/:id',auth.isLogin,adminController.deleteImage)
adminRouter.get('/add-careers',auth.isLogin,adminController.loadAddCareers)
adminRouter.get('/all-careers',auth.isLogin,adminController.loadAllCareers)
adminRouter.get('/delete-careers/:id',auth.isLogin,adminController.deleteCareers)


adminRouter.delete('/user-delete/:id',auth.isLogin,adminController.userDelete)
adminRouter.delete('/services/:id',auth.isLogin,adminController.deleteService)
adminRouter.delete('/subservices/:id',auth.isLogin,adminController.deleteSubService)

adminRouter.post('/login',auth.isLogout,adminController.login)
adminRouter.post('/services',auth.isLogin,adminController.addMainServices)
adminRouter.post('/subservices',auth.isLogin,adminController.addSubServices)
adminRouter.post('/edit-services/:id',auth.isLogin,upload.single('image'),adminController.editServices)
adminRouter.post('/add-images',auth.isLogin,upload.single('image'),adminController.addImage)
adminRouter.post('/add-careers',auth.isLogin,adminController.addCareers)
adminRouter.post('/upload-file/:id',auth.isLogin,upload.single('file'),adminController.uploadResult)

module.exports = adminRouter;
