const db = require('../config/db')
const bcrypt = require('bcrypt')

const loadHome = (req,res,next)=>{
    res.render('home')
}

const loadAboutUs = (req,res,next)=>{
    res.render('about-us')
}

const loadContactUs = (req,res,next)=>{
    res.render('contact-us')
}

const loadLogin = (req,res)=>{
    res.render('login')
}

const loadSignup = (req,res)=>{
    res.render('signup',)
}


const signUp = async (req, res) => {
    const { name, email, phone, password } = req.body;
  
    if (!name || !email || !phone || !password) {
      return res.status(400).send('All fields are required.');
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
  
      
      await db.query('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)', [name, email, phone, hashedPassword])
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      const user = users[0];

      req.session.user_id = user.id; 

      const redirectUrl = req.session?.originalUrl || '/';
        if (req.session) delete req.session.originalUrl;
        res.redirect(redirectUrl);;
    } catch (error) {
      console.error('Error during sign-up:', error);
      res.status(500).send('Server error');
    }
  };


const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  try {
   
    const [users]= await db.query('SELECT * FROM users WHERE email = ?', [email]);

      if (users.length === 0) {
        return res.status(400).send('Invalid email or password');
      }

      const user = users[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send('Invalid email or password');
      }

      req.session.user_id = user.id; 

      const redirectUrl = req.session?.originalUrl || '/';
        if (req.session) delete req.session.originalUrl;
        res.redirect(redirectUrl);;
    ;
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Server error');
  }
};

const logout = (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error while signing out:', err);
        return res.status(500).send('Error occurred during signout.');
      }
      res.clearCookie('connect.sid'); // This clears the session ID cookie
      res.redirect('/login'); // Redirect to login page or any other page after signout
    });
  } catch (error) {
    console.log(error.message);

  }
}


module.exports = {
    loadHome,
    loadAboutUs,
    loadContactUs,
    loadLogin,
    loadSignup,
    signUp,
    login,
    logout,
}