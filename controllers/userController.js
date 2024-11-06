const db = require('../config/db')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const env = require('dotenv').config();
const path = require('path');
const fs = require('fs');
const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
      user: process.env.EMAIL, 
      pass: process.env.EMAIL_PASS
  }
});

const loadHome = (req, res, next) => {
  res.render('home')
}

const loadAboutUs = (req, res, next) => {
  res.render('about-us')
}

const loadContactUs = (req, res, next) => {
  res.render('contact-us')
}

const contact = async (req, res) => {
  const { form_name, form_phone, form_message } = req.body;

  const mailOptions = {
      from: process.env.EMAIL,
      to:  process.env.EMAIL,
      subject: 'New Contact Form Submission',
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${form_name}</p>
        <p><strong>Phone:</strong> ${form_phone}</p>
        <p><strong>Message:</strong></p>
        <p>${form_message}</p>
    `
  };

  try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Contact Form Sent Successfully!' });
  } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Error sending email.' });
  }
}

const loadgallery = async (req, res) => {
  try {
    const [images] = await db.query('SELECT * FROM gallery');

    res.render('gallery', { images });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const loadServices = async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services');

    res.render('services', { services });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

const loadServicesDetails = async (req, res) => {
  const { id } = req.params;
  try {
      const [service] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
      if (service.length === 0) {
          return res.status(404).send('Service not found');
      }
      res.render('service-detail', { service: service[0] });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
}

const loadCareers = async (req, res) => {
  try {
    const [jobs] = await db.query('SELECT * FROM careers');

    res.render('careers', { jobs });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

const uploadCV = (req,res)=>{
  const file = req.file ? req.file.filename : null
  const file_path = path.join(__dirname,'..','public','uploads',file)

  const mailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL,
    subject: 'New CV Submission',
    attachments: [
      {
        filename:file,
        path: file_path
      }
    ]
  }
  transporter.sendMail(mailOptions,(error,info)=>{
    if(error){
      return res.status(500).json({message:'Falied to send email:'+error.message});
    }
    fs.unlink(file_path,(err)=>{
      if(err){
        console.error('Failed to delete file'+err)
      }
    })
    res.status(200).json({ message: 'Your CV has been uploaded successfully.' });
  })
}

const loadCareerDetails = async (req, res) => {
  try {
      const jobId = req.params.id;      
      const [job] = await db.query('SELECT * FROM careers WHERE id = ?', [jobId]);
      if (!job) {
          return res.status(404).send('Job not found');
      }
      console.log(job);
      
      res.render('career-details', { job: job[0] });
  } catch (error) {
      console.error(error.message); 
      res.status(500).send('Server Error'); 
  }
}

const loadWarrantyResgistration = (req,res)=>{
  res.render('warrenty')
}

const warrantyRegister = async (req, res) => {
  const { form_name, form_phone, form_email, invoice_no, invoice_date, company_name, company_address } = req.body;

  const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL, 
      subject: 'New Warranty Registration',
      html: `
          <h2>New Warranty Registration</h2>
          <p><strong>Name:</strong> ${form_name}</p>
          <p><strong>Phone:</strong> ${form_phone}</p>
          <p><strong>Email:</strong> ${form_email}</p>
          <p><strong>Invoice No:</strong> ${invoice_no}</p>
          <p><strong>Invoice Date:</strong> ${invoice_date}</p>
          <p><strong>Company Name:</strong> ${company_name}</p>
          <p><strong>Company Address:</strong></p>
          <p>${company_address}</p>
      `
  };

  try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Warranty registration submitted successfully!' });
  } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Error sending email.' });
  }
}

const loadLogin = (req, res) => {
  res.render('login')
}

const loadSignup = (req, res) => {
  res.render('signup',)
}


const signUp = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).send('All fields are required.');
  }

  try {
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).send('Email Already Exist');
    }
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

  // Check if email and password are provided
  if (!email || !password) {
      return res.status(400).send('Email and password are required.');
  }

  try {
      // Query the database for the user by email
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

      // Check if the user exists
      if (users.length === 0) {
          return res.status(400).send('User does not exist! Create a new account.');
      }

      const user = users[0];

      // Compare the provided password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password Match:', isMatch)
      if (!isMatch) {
          return res.status(400).send('Invalid password.');
      }

      // Store user ID in session
      req.session.user_id = user.id;

      // Redirect to the original URL or home page
      const redirectUrl = req.session.originalUrl || '/';
      
      // Clear original URL from session after redirecting
      delete req.session.originalUrl;

      res.redirect(redirectUrl);
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
  contact,
  loadgallery,
  loadServices,
  loadServicesDetails,
  loadCareers,
  uploadCV,
  loadCareerDetails,
  loadWarrantyResgistration,
  warrantyRegister,
  loadLogin,
  loadSignup,
  signUp,
  login,
  logout,
}