const db = require('../config/db')
const bcrypt = require('bcrypt')
const path = require('path');
const fs = require('fs');


const loadLogin = (req, res) => {
    res.render('login')
}

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

        // Check if the user is an admin
        if (!user.isAdmin) {
            return res.status(403).send('Access denied: You do not have admin privileges.');
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send('Invalid password.');
        }

        // Store user ID in session
        req.session.admin_id = user.id;

        res.redirect('/admin');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error');
    }
};

const loadDashbord = async (req, res) => {
    try {
        const counts = await getCounts();
        res.render('dashboard', { counts });
    } catch (error) {
        console.error('Error fetching counts:', error);
        res.status(500).send('Error fetching data');
    }
}

const loadUserManagement = async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users')

        res.render('user-management', { users, message: '' })
    } catch (error) {
        console.log(error.message);
    }

}

const loadAddServices = async (req, res) => {
    try {
        const [services] = await db.query('SELECT * FROM services');
        res.render('add-services', { services });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const MainServices =  async(req, res) => {
    try {
        const [services] = await db.query('SELECT * FROM services');
        res.json(services); // Send the services as JSON response
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const addMainServices = async (req, res) => {
    const { name } = req.body;
    try {
        const [result] = await db.query('INSERT INTO services (name) VALUES (?)', [name]);
        res.json({ id: result.insertId, name });
    } catch (error) {
        console.error('Error adding main service:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const addSubServices = async (req, res) => {
    const { name, main_service_id } = req.body;
    try {
        const [result] = await db.query('INSERT INTO sub_services (name, main_service_id) VALUES (?, ?)', [name, main_service_id]);
        res.json({ id: result.insertId, name, main_service_id });
    } catch (error) {
        console.error('Error adding sub-service:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const deleteService = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM sub_services WHERE main_service_id = ?', [id]);
        
        await db.query('DELETE FROM services WHERE id = ?', [id]);
        
        res.status(204).send(); // No content to send back
    } catch (error) {
        console.error('Error deleting main service:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const deleteSubService = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM sub_services WHERE id = ?', [id]);
        res.status(204).send(); // No content to send back
    } catch (error) {
        console.error('Error deleting sub-service:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const loadAllServices = async (req, res) => {
    try {
        const [mainServices] = await db.query('SELECT * FROM services');
        const [subServices] = await db.query('SELECT * FROM sub_services');

        res.render('all-services', { mainServices, subServices });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const loadAddImages = (req, res) => {
    res.render('add-images')
}

const loadAllImages = async (req, res) => {
    try {
        const [images] = await db.query('SELECT * FROM gallery')
        res.render('all-images', { images })
    } catch (error) {
        console.log(error.message);

    }
}

const loadAddCareers = (req, res) => {
    res.render('add-careers')
}

const loadAllCareers = async (req, res) => {
    try {
        const [careers] = await db.query('SELECT * FROM careers')
        res.render('all-careers', { careers })
    } catch (error) {
        console.log(error.message);

    }
}

const addService = async (req, res) => {
    const { title, description, amount } = req.body;
    const imagePath = req.file ? req.file.filename : null;

    if (!title || !description || !amount || !imagePath) {
        return res.status(400).send('All fields are required.');
    }

    await db.query('INSERT INTO services (title, description, amount, image) VALUES (?, ?, ?, ?)', [title, description, amount, imagePath])
    res.redirect('/admin/all-services');
    ;
}

const deleteServices = async (req, res) => {
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

const editServices = async (req, res) => {
    const serviceId = req.params.id;
    const { title, description, amount } = req.body;

    try {
        const [results] = await db.query('SELECT image FROM services WHERE id = ?', [serviceId])

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

const deleteImage = async (req, res) => {
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
            }
        })
        await db.query('DELETE FROM gallery WHERE id = ?', [imageId])
        res.redirect('/admin/all-images');
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).send('Internal Server Error');
    }
}

const addCareers = async (req, res) => {
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

const deleteCareers = async (req, res) => {
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

const uploadResult = async (req, res) => {
    const userId = req.params.id;
    const fileTitle = req.body.file_title;
    const filePath = '/uploads/' + req.file.filename;

    try {
        const [users] = await db.query('SELECT * FROM users');

        // Insert the uploaded file details into the database
        const sql = 'INSERT INTO user_files (user_id, file_name, file_path) VALUES (?, ?, ?)';
        await db.query(sql, [userId, fileTitle, filePath]);

        // Send a success message and render the page with users data
        res.render('user-management', {
            message: { type: 'success', text: 'File uploaded successfully!' },
            users: users
        });
    } catch (err) {
        // Handle any errors that occurred during the query or file upload
        console.error(err); // Log the error for debugging
        res.render('user-management', {
            message: { type: 'error', text: 'Error uploading file. Please try again!' },
            users: users
        });
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
            res.redirect('/admin/login'); // Redirect to login page or any other page after signout
        });
    } catch (error) {
        console.log(error.message);

    }
}

const userDelete = async (req,res)=>{
    const userId = req.params.id;

    try {
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

        if (user.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Delete the user from the database
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        res.status(200).json({
            message: 'User successfully deleted'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            message: 'Server error while deleting user',
            error: error.sqlMessage || error.message
        });
    }
}

module.exports = {
    loadLogin,
    login,
    logout,
    loadDashbord,
    loadUserManagement,
    loadAddServices,
    MainServices,
    addMainServices,
    addSubServices,
    deleteService,
    deleteSubService,
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
    uploadResult,
    userDelete,
}