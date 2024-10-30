const isLogin = async (req,res,next)=>{
    try{
        if(req.session.admin_id){
            next()
        }else{
            res.render('adminLogin',{message:''})
        }
    }
    catch (error){
        console.log(error.message);
    }
}

const isLogout = async (req,res,next)=>{
    try{
        if(req.session.admin_id){
            res.redirect('/admin')
        }
        next()
    }
    catch (error){
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}