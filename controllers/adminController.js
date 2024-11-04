const db = require('../config/db')
const bcrypt = require('bcrypt')
const path = require('path');
const fs = require('fs');


const loadDashbord = async(req,res)=>{
    try {
        const counts = await getCounts();
        res.render('dashboard', { counts });
    } catch (error) {
        console.error('Error fetching counts:', error);
        res.status(500).send('Error fetching data');
    }
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

const loadEditServices = async (req, res) => {
    const serviceId = req.params.id;

    try {
        const [service] = await db.query('SELECT * FROM services WHERE id = ?', [serviceId]);

        if (!service || service.length === 0) {
            return res.status(404).send('Service not found'); 
        }

        res.render('edit-services', { service: service[0] });
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).send('Internal Server Error');
    }
};

const editServices =  async (req, res) => {
    const serviceId = req.params.id;
    const { title, description, amount } = req.body;

    try {
        const [results] =  await db.query('SELECT image FROM services WHERE id = ?', [serviceId])

            const oldImageFilename = results[0].image;
            const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', oldImageFilename);

        let sql = 'UPDATE services SET title = ?, description = ?, amount = ?';
        const params = [title, description, amount];

        if (req.file) {
            if (oldImageFilename) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error('Error deleting old image:', err);
                    }
                });
            }
            sql += ', image = ?';
            params.push(req.file.filename); // Save the new image path
        }

        sql += ' WHERE id = ?';
        params.push(serviceId);

        // Execute the SQL statement
        await db.query(sql, params)

        res.redirect('/admin/all-services'); 

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
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
        const [imageRecord] = await db.query('SELECT image_path FROM gallery WHERE id = ?', [imageId]);
        if (imageRecord.length === 0) {
            return res.status(404).send('Image not found');
        }

        const imagePath = path.join(__dirname, '..', 'public', 'uploads', imageRecord[0].image_path);

        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error deleting file from filesystem:', err);
                return res.status(500).send('Error deleting image file');
            }})
        await db.query('DELETE FROM gallery WHERE id = ?', [imageId])
        res.redirect('/admin/all-images'); 
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).send('Internal Server Error');
    }   
}

const addCareers =  async(req, res) => {
    const {
      'job-title': jobTitle,
      'company-name': companyName,
      'job-description': jobDescription,
      requirements,
      location,
      'salary-range': salaryRange,
      'employment-type': employmentType,
      'application-deadline': applicationDeadline,
      'contact-number': contactNumber
    } = req.body;
  
    if (
      !jobTitle ||
      !companyName ||
      !jobDescription ||
      !requirements ||
      !location ||
      !employmentType ||
      !applicationDeadline ||
      !contactNumber
    ) {
      return res.status(400).send('All required fields must be filled.');
    }
  
    const query = `
      INSERT INTO careers 
      (job_title, company_name, job_description, requirements, location, salary_range, employment_type, application_deadline, contact_number) 
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
      contactNumber
    ];
  
    await db.query(query, values) 
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

const getCounts = async () => {
    const users = await db.query('SELECT COUNT(*) AS total_users FROM users');
    const services = await db.query('SELECT COUNT(*) AS total_services FROM services');
    const careers = await db.query('SELECT COUNT(*) AS total_careers FROM careers');
    const gallery = await db.query('SELECT COUNT(*) AS total_gallery FROM gallery');

    return {
        totalUsers: users[0][0].total_users,
        totalServices: services[0][0].total_services,
        totalCareers: careers[0][0].total_careers,
        totalGallery: gallery[0][0].total_gallery
    };
};

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
    getCounts,
    loadEditServices,
    editServices,
}