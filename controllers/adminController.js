const db = require('../config/db')
const bcrypt = require('bcrypt')



const loadDashbord = (req,res)=>{
    res.render('dashboard')
}

const loadUserManagement = async(req,res)=>{
    try {
        const [users] = await db.query('SELECT name, email, phone, DATE_FORMAT(registered_date, "%b %d %Y") AS registered_date FROM users')
        
        res.render('user-management',{users})
    } catch (error) {
        console.log(error.message);
    }
    
}

const loadAddServices = (req,res)=>{
    res.render('add-services')
}

const loadAllServices = async(req,res)=>{
    try {
        const [services] = await db.query('SELECT * FROM services')
        res.render('all-services',{services})
    } catch (error) {
        console.log(error.message);
        
    }
    
}

const loadAddImages = (req,res)=>{
    res.render('add-images')
}

const loadAllImages = async(req,res)=>{
    try {
        const [images] = await db.query('SELECT * FROM gallery')
        res.render('all-images',{images})
    } catch (error) {
        console.log(error.message);
        
    }
}

const loadAddCareers = (req,res)=>{
    res.render('add-careers')
}

const loadAllCareers = async(req,res)=>{
    try {
        const [careers] = await db.query('SELECT * FROM careers')
        res.render('all-careers',{careers})
    } catch (error) {
        console.log(error.message);
        
    }
}

const addService =async (req, res) => {
    const { title, description, amount } = req.body;
    const imagePath = req.file ? req.file.filename : null; 
  
    if (!title || !description || !amount || !imagePath) {
      return res.status(400).send('All fields are required.');
    }
      
    await db.query('INSERT INTO services (title, description, amount, image) VALUES (?, ?, ?, ?)', [title, description, amount, imagePath])
      res.redirect('/admin/all-services'); 
    ;
}

const deleteServices = async(req, res) => {
    const serviceId = req.params.id;

  
    await db.query('DELETE FROM services WHERE id = ?', [serviceId])
      res.redirect('/admin/all-services'); 
}

const addImage = async (req, res) => {
    const { imageTitle } = req.body;
    const imagePath = req.file ? req.file.filename : null; 

    if (!imageTitle || !imagePath) {
        return res.status(400).send('Image title and file are required.');
    }

    try {
        await db.query('INSERT INTO gallery (title, image_path) VALUES (?, ?)', [imageTitle, imagePath]);
        res.redirect('/admin/all-images');
    } catch (error) {
        console.error('Error inserting image:', error);
        res.status(500).send('Internal Server Error');
    }
}

const deleteImage = async(req, res) => {
    const imageId = req.params.id;
    try {
        await db.query('DELETE FROM gallery WHERE id = ?', [imageId])
        res.redirect('/admin/all-images'); 
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).send('Internal Server Error');
    }   
}

const addCareers =  (req, res) => {
    const {
      'job-title': jobTitle,
      'company-name': companyName,
      'job-description': jobDescription,
      requirements,
      location,
      'salary-range': salaryRange,
      'employment-type': employmentType,
      'application-deadline': applicationDeadline,
      'contact-email': contactEmail
    } = req.body;
  
    if (
      !jobTitle ||
      !companyName ||
      !jobDescription ||
      !requirements ||
      !location ||
      !employmentType ||
      !applicationDeadline ||
      !contactEmail
    ) {
      return res.status(400).send('All required fields must be filled.');
    }
  
    const query = `
      INSERT INTO careers 
      (job_title, company_name, job_description, requirements, location, salary_range, employment_type, application_deadline, contact_email) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      jobTitle,
      companyName,
      jobDescription,
      requirements,
      location,
      salaryRange,
      employmentType,
      applicationDeadline,
      contactEmail
    ];
  
    db.query(query, values) 
      res.redirect('/admin/all-careers'); 
    
}

const deleteCareers = async(req,res)=>{
    const careersId = req.params.id;
    try {
        await db.query('DELETE FROM careers WHERE id = ?', [careersId])
        res.redirect('/admin/all-careers'); 
    } catch (error) {
        console.error('Error deleting careers:', error);
        res.status(500).send('Internal Server Error');
    } 
}

module.exports = {
    loadDashbord,
    loadUserManagement,
    loadAddServices,
    loadAllServices,
    loadAddImages,
    loadAllImages,
    loadAddCareers,
    loadAllCareers,
    addService,
    deleteServices,
    addImage,
    deleteImage,
    addCareers,
    deleteCareers,
}