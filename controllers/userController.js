const db = require('../config/db')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const nodemailer = require('nodemailer')
const env = require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY
});

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
    res.render('services');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

const loadServicesDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const userID = req.session.user_id || (req.isAuthenticated() && req.user.id);
    const [user] = await db.query('SELECT * FROM users WHERE id = ?',[userID])
    
      const [service] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
      if (service.length === 0) {
          return res.status(404).send('Service not found');
      }
      res.render('service-detail', { service: service[0],user: user[0] });
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
  const jobTitle = req.body.jobTitle; const companyName = req.body.companyName; const location = req.body.location; const salaryRange = req.body.salaryRange; const jobDescription = req.body.jobDescription; const requirements = req.body.requirements;

  const mailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL,
    subject: `New CV Submission for ${jobTitle}`,
    html: ` <h2>New Job Application Received</h2> <p><strong>Job Title:</strong> ${jobTitle}</p> <p><strong>Company:</strong> ${companyName}</p> <p><strong>Location:</strong> ${location}</p> <p><strong>Salary Range:</strong> $${salaryRange}</p> <h3>Description</h3> <pre>${jobDescription}</pre> <h3>Requirements</h3> <pre>${requirements}</pre> <p>Please find the CV attached below.</p> `,
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
      
      res.render('career-details', { job: job[0] });
  } catch (error) {
      console.error(error.message); 
      res.status(500).send('Server Error'); 
  }
}

const loadWarrantyResgistration = async(req,res)=>{
  try {
    const [mainServices] = await db.query('SELECT * FROM services');
    
    const [subServices] = await db.query('SELECT * FROM sub_services');

    res.render('warrenty', { mainServices, subServices });
} catch (error) {
    console.error('Error loading warranty/AMC page:', error);
    res.status(500).send('Internal Server Error');
}
}

const warrantyRegister = async (req, res) => {
  const { form_name, form_phone, form_email, invoice_no, invoice_date, company_name, company_address } = req.body;

  // Mail content for admin
  const adminMailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL, // Admin email
    subject: 'New Warranty Registration',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
        <h2 style="color: #2a9d8f;">New Warranty Registration</h2>
        <p><strong>Name:</strong> ${form_name}</p>
        <p><strong>Phone:</strong> ${form_phone}</p>
        <p><strong>Email:</strong> ${form_email}</p>
        <p><strong>Invoice No:</strong> ${invoice_no}</p>
        <p><strong>Invoice Date:</strong> ${invoice_date}</p>
        <p><strong>Company Name:</strong> ${company_name}</p>
        <p><strong>Company Address:</strong></p>
        <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace;">${company_address}</pre>
      </div>
    `
  };

  // Mail content for user
  const userMailOptions = {
    from: process.env.EMAIL,
    to: form_email, // User email
    subject: 'Warranty Registration Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
        <h2 style="color: #264653;">Warranty Registration Confirmation</h2>
        <p>Dear ${form_name},</p>
        <p>Thank you for registering your warranty with us! Below are the details of your warranty registration:</p>
        <p><strong>Name:</strong> ${form_name}</p>
        <p><strong>Phone:</strong> ${form_phone}</p>
        <p><strong>Email:</strong> ${form_email}</p>
        <p><strong>Invoice No:</strong> ${invoice_no}</p>
        <p><strong>Invoice Date:</strong> ${invoice_date}</p>
        <p><strong>Company Name:</strong> ${company_name}</p>
        <p><strong>Company Address:</strong></p>
        <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace;">${company_address}</pre>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br/>Specterra</p>
      </div>
    `
  };

  try {
    // Send email to admin
    await transporter.sendMail(adminMailOptions);

    // Send email to user
    await transporter.sendMail(userMailOptions);

    res.status(200).json({ message: 'Warranty registration submitted successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending email.' });
  }
};

const submitAMC = async (req, res) => {
  const { name, contact, email, companyName, companyAddress } = req.body;

  // Mail content for admin
  const adminMailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL, // Admin email
    subject: 'New AMC Registration',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
        <h2 style="color: #2a9d8f;">New AMC Registration</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Contact:</strong> ${contact}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company Name:</strong> ${companyName}</p>
        <p><strong>Company Address:</strong></p>
        <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace;">${companyAddress}</pre>
      </div>
    `
  };

  // Mail content for user
  const userMailOptions = {
    from: process.env.EMAIL,
    to: email, // User email
    subject: 'AMC Registration Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
        <h2 style="color: #264653;">AMC Registration Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering for our AMC service. Here are the details of your registration:</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Contact:</strong> ${contact}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company Name:</strong> ${companyName}</p>
        <p><strong>Company Address:</strong></p>
        <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace;">${companyAddress}</pre>
        <p>We will get back to you shortly with further details.</p>
        <p>Best regards,<br/>Specterra</p>
      </div>
    `
  };

  try {
    // Send email to admin
    await transporter.sendMail(adminMailOptions);

    // Send email to user
    await transporter.sendMail(userMailOptions);

    res.status(200).json({ message: 'AMC registration submitted successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending email.' });
  }
};


const verifyPayment = async (req, res) => {
  const { razorpay_payment_id, amount, name, contact, email, companyName, companyAddress } = req.body;

  try {
      const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

      if (payment.status === 'authorized') {
          // Capture the payment
          const captureResponse = await razorpayInstance.payments.capture(razorpay_payment_id, amount * 100);

          if (captureResponse.status === 'captured') {
              // Payment successfully captured
              const mailOptions = {
                from: process.env.EMAIL, // sender address
                to: process.env.EMAIL,                // send email to admin
                subject: 'AMC Registration Payment Captured', // Subject line
                text: `A new payment has been captured.\n\nDetails:\n- Payment ID: ${razorpay_payment_id}\n- Amount: ₹${amount}\n- Payer Name: ${name}\n- Contact: ${contact}\n- Email: ${email}\n- Company Name: ${companyName}\n- Company Address: ${companyAddress}\n\nThank you!`, // email body
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Admin notification email sent: ' + info.response);
                }
            });
              res.status(200).json({ success: true, message: 'Payment verified and captured successfully.' });
          } else {
              // Payment capture failed
              res.status(400).json({ success: false, message: 'Failed to capture payment.' });
          }
      } else if (payment.status === 'captured') {
          // If already captured
          res.status(200).json({ success: true, message: 'Payment already captured.' });
      } else {
          // Payment status is not authorized or captured
          res.status(400).json({ success: false, message: 'Payment verification failed.' });
      }
  } catch (error) {
      console.error(error);  // Log the error
      res.status(500).json({ success: false, message: 'An error occurred while verifying the payment.' });
  }
};

const paymentSuccess = (req, res) => {
  const { service, userEmail } = req.body;

  // Admin email
  const adminEmail = process.env.EMAIL;

  // Create email content
  const emailSubject = `Payment Received for Service: ${service.title}`;

  // HTML email content for user
  const userEmailHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { width: 100%; padding: 20px; background-color: #fff; }
            .header { background-color: #28a745; padding: 20px; text-align: center; color: white; font-size: 1.5rem; }
            .content { padding: 20px; font-size: 1rem; color: #333; line-height: 1.5; }
            .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 0.9rem; color: #777; }
            .button { background-color: #28a745; color: white; padding: 12px 25px; text-align: center; border-radius: 5px; text-decoration: none; display: inline-block; }
            .button:hover { background-color: #218838; }
            .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .details-table th, .details-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            .details-table th { background-color: #f1f1f1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              Payment Successful for <strong>${service.title}</strong>
            </div>
            <div class="content">
              <p>Dear <strong>Customer</strong>,</p>
              <p>Your payment has been successfully processed for the service: <strong>${service.title}</strong>.</p>
              <p>Here are the details:</p>
              <table class="details-table">
                <tr>
                  <th>Amount</th>
                  <td>₹${service.amount}</td>
                </tr>
                <tr>
                  <th>Description</th>
                  <td>${service.description}</td>
                </tr>
              </table>
              <p>Thank you for your purchase!</p>
              <p>If you have any questions or need assistance, feel free to <a href="mailto:${adminEmail}" class="button">Contact Us</a>.</p>
            </div>
            <div class="footer">
              <p>Best regards, <br>Specterra</p>
            </div>
          </div>
        </body>
      </html>
  `;
  
  // HTML email content for admin
  const adminEmailHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { width: 100%; padding: 20px; background-color: #fff; }
            .header { background-color: #28a745; padding: 20px; text-align: center; color: white; font-size: 1.5rem; }
            .content { padding: 20px; font-size: 1rem; color: #333; line-height: 1.5; }
            .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 0.9rem; color: #777; }
            .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .details-table th, .details-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            .details-table th { background-color: #f1f1f1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              New Payment Received for <strong>${service.title}</strong>
            </div>
            <div class="content">
              <p>A new payment has been successfully processed for the service: <strong>${service.title}</strong>.</p>
              <p>Here are the details:</p>
              <table class="details-table">
                <tr>
                  <th>Amount</th>
                  <td>₹${service.amount}</td>
                </tr>
                <tr>
                  <th>Description</th>
                  <td>${service.description}</td>
                </tr>
                <tr>
                  <th>User Email</th>
                  <td>${userEmail}</td>
                </tr>
              </table>
            </div>
            <div class="footer">
              <p>Best regards, <br>Specterra</p>
            </div>
          </div>
        </body>
      </html>
  `;

  // Email options for user
  const userMailOptions = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: emailSubject,
      html: userEmailHtml  // Use HTML content for the email body
  };

  // Email options for admin
  const adminMailOptions = {
      from: process.env.EMAIL,
      to: adminEmail,
      subject: `New Payment Received: ${service.title}`,
      html: adminEmailHtml  // Use HTML content for the email body
  };

  // Send email to user
  transporter.sendMail(userMailOptions, (err, info) => {
      if (err) {
          console.log('Error sending user email:', err);
          return;  // Avoid calling res.status() here to prevent premature termination
      }
      console.log('Email sent to user:', info.response);

      // Send email to admin only after user email is successfully sent
      transporter.sendMail(adminMailOptions, (err, info) => {
          if (err) {
              console.log('Error sending admin email:', err);
              return;  // Avoid calling res.status() here to prevent premature termination
          }
          console.log('Email sent to admin:', info.response);
          
          // Send response to client after both emails are successfully sent
          res.status(200).json({
              message: 'Payment details sent successfully',
              
          });
      });
  });
}

const servicePayment = async (req, res) => {
  const { name, email, whatsapp_number, address_with_pin, main_service, sub_service, remarks, amount } = req.body;
  const documents = req.files || [];

  try {
    // Fetch the main service name
    const [mainResult] = await db.query('SELECT name FROM services WHERE id = ?', [main_service]);
    const mainServiceName = mainResult.length > 0 ? mainResult[0].name : 'Unknown Main Service';

    // Fetch the sub service name
    const [subResult] = await db.query('SELECT name FROM sub_services WHERE id = ?', [sub_service]);
    const subServiceName = subResult.length > 0 ? subResult[0].name : 'Unknown Sub Service';

    // Prepare attachments
    const attachments = documents.map(file => ({
      filename: file.originalname,
      content: file.buffer
    }));

    // HTML Email Template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4CAF50;">Booking Confirmation</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #f2f2f2;">
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Field</th>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Details</th>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">WhatsApp Number</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${whatsapp_number}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Address</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${address_with_pin}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Main Service</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${mainServiceName}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Sub Service</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${subServiceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Remarks</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${remarks || 'None'}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Amount</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${amount}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">Thank you for choosing our services!</p>
      </div>
    `;

    const userMailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Booking Confirmation',
      html: emailHtml,  // Use HTML content
      attachments: attachments
    };

    const adminMailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: 'New Booking Received',
      html: emailHtml,  // Use HTML content
      attachments: attachments
    };

    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(adminMailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Error sending email" });
  }
}

const createOrder =  async (req, res) => {
  const { amount } = req.body;

  try {
    const order = await razorpayInstance.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_order_74394"
    });
    res.json({ orderId: order.id });
  } catch (error) {
    res.status(500).send("Error creating order");
  }
}

const getSubServices =  async (req, res) => {
  const mainServiceId = req.params.id;

  try {
      const [subServices] = await db.query('SELECT * FROM sub_services WHERE main_service_id = ?', [mainServiceId]);
      res.json(subServices); // Send back the list of sub-services as JSON
  } catch (error) {
      console.error('Error fetching sub-services:', error);
      res.status(500).json({ message: 'Server error while fetching sub-services', error: error.message });
  }
}

const loadLogin = (req, res) => {
  res.render('login', { messages: req.flash() })
}

const loadSignup = (req, res) => {
  res.render('signup', { messages: req.flash() })
}


const signUp = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).send('All fields are required.');
  }

  try {
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      req.flash('error', 'This email is already registered. If you have an account, please log in.');
      return res.redirect('/signup'); 
    }
    const hashedPassword = await bcrypt.hash(password, 10);


    await db.query('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)', [name, email, phone, hashedPassword])
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    req.session.user_id = user.id;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Welcome to Our Specterra!',
      text: `Hello ${name},\n\nThank you for signing up! We are excited to have you with us.\n\nBest regards,\nYour Company Name`
    };

    await transporter.sendMail(mailOptions);

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
      req.flash('error', 'Email and password are required.');
      return res.redirect('/login'); // Redirect back to login with an error message
  }

  try {
      // Query the database for the user by email
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

      // Check if the user exists
      if (users.length === 0) {
          req.flash('error', 'User does not exist. Please create a new account.');
          return res.redirect('/login'); // Redirect back to login with a message
      }

      const user = users[0];

      // Compare the provided password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
          req.flash('error', 'Invalid password. Please try again.');
          return res.redirect('/login'); // Redirect back to login with an error message
      }

      // Store user ID in session
      req.session.user_id = user.id;

      // Redirect to the original URL or home page
      const redirectUrl = req.session.originalUrl || '/';
      
      // Clear original URL from session after redirecting
      delete req.session.originalUrl;

      // Redirect the user
      res.redirect(redirectUrl);

  } catch (error) {
      console.error('Error during login:', error);
      req.flash('error', 'Server error. Please try again later.');
      res.redirect('/login'); // Redirect to login page with error message
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

const loadPrivacyPolicy = (req,res)=>{
  res.render('privacy')
}

const loadTC = (req,res)=>{
  res.render('TC')
}

const loadShippingPolicy = (req,res)=>{
  res.render('shipping')
}

const loadRefundPolicy = (req,res)=>{
  res.render('refund')
}

const loadProfile = async(req,res)=>{
  try {
    const userID = req.session.user_id || (req.isAuthenticated() && req.user.id);
    const [files] = await db.query('SELECT file_name, file_path FROM user_files WHERE user_id = ?',[userID])

    res.render('profile',{files:files|| []})
  } catch (error) {
    console.log(error.message);
    
  }
}

const loadForgotPassword = (req,res)=>{
  res.render('forgot-password')
}

const forgotPassword =  async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user.length) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Generate a token
    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date(Date.now() + 3600000); // 1 hour from now

    // Save the token and expiration in the database
    await db.query(
        'UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE email = ?',
        [token, expiration, email]
    );

    // Email content
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <h1>Password Reset</h1>
            <p>Hi ${user[0].name},</p>
            <p>You requested to reset your password. Click the link below to proceed:</p>
            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block;">Reset Password</a>
            <p>If you did not request this, you can safely ignore this email.</p>
            <p>Thanks,</p>
            <p>Specterra</p>
        `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Password reset link has been sent to your email.' });
} catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error processing request.' });
}
}

const resetPassword = async (req, res) => {
  try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
          console.error("Missing token or new password");
          return res.status(400).json({ message: 'Invalid input.' });
      }

      // Fetch user using the reset token and check expiration
      const [user] = await db.query(
          'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiration > ?',
          [token, new Date()]
      );

      if (!user.length) {
          console.error("Invalid or expired token");
          return res.status(400).json({ message: 'Invalid or expired token.' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password and clear reset token
      await db.query(
          'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE id = ?',
          [hashedPassword, user[0].id]
      );

      console.log("Password reset successful for user:", user[0].email);
      res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};

const loadResetPassword =  (req, res) => {
  const { token } = req.query; // Extract token from query parameters

  if (!token) {
      return res.status(400).send('Invalid or missing token.');
  }

  // Serve the reset password form HTML (adjust the path to your file)
  res.render('reset-password')
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
  submitAMC,
  verifyPayment,
  paymentSuccess,
  servicePayment,
  createOrder,
  getSubServices,
  loadLogin,
  loadSignup,
  signUp,
  login,
  logout,
  loadPrivacyPolicy,
  loadTC,
  loadShippingPolicy,
  loadRefundPolicy,
  loadProfile,
  loadForgotPassword,
  forgotPassword,
  resetPassword,
  loadResetPassword,
}