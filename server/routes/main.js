const express = require('express');
const router = express.Router();
const axios = require('axios');
const Tutor = require('../models/Tutor');
const regTutor = require('../models/regTutor');
const Question = require('../models/Question');
const sendMail = require('../helpers/mailer');
const ocrSpaceApi = require('ocr-space-api');
const fs = require('fs');
const path = require('path');


// Routes

/**
 * GET /
 * Landing Route
 */
router.get('/', (req, res) => {
  try {
    res.redirect('/jiggasa');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
  
});

/**
 * GET /
 * JIGGASA
 */
router.get('/jiggasa', async (req, res) => {
  try {
    // Define your tags
    const tags = ['bangla', 'english', 'science', 'history', 'religion', 'math', 'IQ', 'other'];

    // Select a random tag from the tags array
    const randomCategory = tags[Math.floor(Math.random() * tags.length)];

    const category = req.query.category || randomCategory;
    const questionId = req.query.id;

    let questions;
    if (questionId) {
      // Find the question by the custom 'id' field
      const question = await Question.findOne({ id: questionId });

      // Check if the question was found
      if (!question) {
        return res.status(404).send('Question not found');
      }

      questions = [question];
    } else {
      // Find questions by category
      questions = await Question.find({ category }).sort({ id: 1 });
    }

    const locals = {
      title: "QTutor | Welcome",
      description: "কিছু জিজ্ঞাসা - যাচাই করো ভিত্তি"
    };

    // Render the index view with the question data
    res.render('index', {
      locals,
      questions,
      category
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



/**
 * GET /
 * TUTORS
 */
router.get('/tutors', async (req, res) => {
  try {
    const locals = {
      title: "QTutor | Welcome",
      description: "Simple Site created with NodeJs, Express & MongoDb."
    };

    const req_tag = req.query.tag || 'all';
    const searchQuery = req.query.query;
    const tags = ['buet', 'du', 'medical', 'cadet'];
    let data;

    if (searchQuery) {
      // If a search query is provided, search by query
      const searchRegex = new RegExp(searchQuery, 'i'); // Case-insensitive search
      data = await Tutor.find({
        $or: [
          { name: searchRegex },
          { pref: searchRegex },
          { institution: searchRegex },
          { dept: searchRegex },
          { college: searchRegex },
          { expertise: searchRegex }
        ]
      }).sort({ rating: -1, id: 1 });
    } else if (req_tag !== 'all') {
      // If a tag is provided, filter by tag
      data = await Tutor.find({ tag: req_tag }).sort({ rating: -1, id: 1 });
    } else {
      // Default case: get all tutors
      data = await Tutor.find({ tag: { $in: tags } }).sort({ tag: 1, rating: -1, id: 1 });
    }

    res.render('main/tutors', {
      locals,
      data,
      currentTag: req_tag,
      searchQuery, // Pass the search query to the template if it exists
      currentRoute: '/tutors'
    });

  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});


/**
 * ADMIN GET /
 * REG Tutors
*/
router.get('/reg-tutor', async (req, res) => {
  try {
    const locals = {
      title: "QTutor | Welcome",
      description: "Simple Site created with NodeJs, Express & MongoDb."
    }

    res.render('main/regtutor', {
      locals,
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * ADMIN POST /
 * reg tutor
*/
router.post('/reg-tutor', async (req, res) => {
  try {
    try {
      const newregTutor = new regTutor({
        name: req.body.name,
        tag: req.body.tag,
        institution: req.body.institution,
        dept: req.body.dept,
        hsc: req.body.hsc,
        background: req.body.background,
        college: req.body.college,
        expertise: req.body.expertise,
        mode: req.body.mode,
        pref: req.body.pref,
        phone: req.body.phone,
        email: req.body.email,
        fb: req.body.fb,
      });

      await regTutor.create(newregTutor);

      // Send custom email
      const subject = 'New Tutor Registration';
      const text = `A new tutor has registered:\n\nName: ${req.body.name}\nTag: ${req.body.tag}\nInstitution: ${req.body.institution}\nDepartment: ${req.body.dept}\nHSC Batch: ${req.body.hsc}\nCollege: ${req.body.college}\nGo to Admin Panel:\nhttps://qtutor.onrender.com/admin`;

      await sendMail('saimaneeti367@gmail.com', subject, text);

      res.redirect('/tutors');
    } catch (error) {
      console.log(error);
    }

  } catch (error) {
    console.log(error);
  }
});


/**
 * GET /
 * AI QA
*/
router.get('/ai-qa', async (req, res) => {
  try {
    const locals = {
      title: "Solve Problems using AI",
      description: "Simple Site created with NodeJs, Express & MongoDb."
    }

    query = null;
    output = null;
    res.render('main/ai-qa', {
      locals,
      query,
      output
    });

  } catch (error) {
    console.log(error);
  }

});


// Route to handle text query form submission
router.post('/ai-text-query', async (req, res) => {
  const textQuery = "Give answer to the question mentioning the question at first:\n" + req.body.query;

  try {
    const apiKey = process.env.GOOGLE_API_KEY;

    const response = await axios({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      method: 'post',
      data: {
        contents: [{ parts: [{ text: textQuery }] }],
      },
    });


    const outputContent = response?.data?.candidates[0]?.content?.parts[0]?.text || "Sorry, ask a human...";  //response["data"]["candidates"][0]["content"]["parts"][0]["text"];

    // console.log(outputContent);

    // Render the ai-qa view with the output from Gemini AI
    res.render('main/ai-qa', { query: textQuery, output: outputContent });
  } catch (error) {
    console.error('Error querying Gemini AI:', error);
    res.status(500).send('An error occurred while processing your request.');
  }
});



// Define a function to create the uploads directory if it doesn't exist
const createUploadsDirectory = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
};

// POST route for handling image uploads
router.post('/ai-image-query', async (req, res) => {
  try {
    // Ensure uploads directory exists
    createUploadsDirectory();

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    // Access the uploaded file
    const imageFile = req.files.image;

    // Define the path where the image will be saved
    const imagePath = path.join(__dirname, 'uploads', imageFile.name);

    // Save the image to the uploads directory
    await imageFile.mv(imagePath);

    // Respond with a success message or the saved image path
    // res.redirect('/ai-qa');
    // res.send(`Image '${imageFile.name}' uploaded successfully.`);

    // Use okrabyte to decode text from the image
    /*
    const textData = await new Promise((resolve, reject) => {
      okrabyte.decodeBuffer(fs.readFileSync(imagePath), (err, data) => {
        if (err) {
          // console.log("rejected");
          reject(err);
        } else {
          // console.log("resolving");
          resolve(data);
        }
      });
    });
    */

    const apiKey = 'K82448191288957'; // Your API key here

    const options = {
      apikey: apiKey,
      language: 'eng', // Language code for English
      imageFormat: 'image/png', // Image format (only png or jpg)
      isOverlayRequired: true // Whether overlay is required or not
    };

    // Image file path
    const imageFilePath = imagePath;

    textData = null;
    // Run OCR Space API and wait for the result
    ocrSpaceApi.parseImageFromLocalFile(imageFilePath, options)
      .then(function (parsedResult) {
        res.render('main/ai-qa', { query: parsedResult.parsedText, output: null });
      }).catch(function (err) {
        console.log('ERROR:', err);
      });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).send('An error occurred while processing the image.');
  } finally {
    // Delete all images in the uploads directory after processing or in case of error
    const uploadsDir = path.join(__dirname, 'uploads');
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        console.error('Error reading uploads directory:', err);
        return;
      }
      // Delete each file in the directory
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        fs.unlink(filePath, err => {
          if (err) {
            // console.error('Error deleting image:', err);
          } else {
            // console.log(`Image '${file}' deleted successfully.`);
          }
        });
      });
    });
  }
});



/**
 * GET /
 * Job Prep
*/
router.get('/job-prep', async (req, res) => {
  try {
    const locals = {
      title: "Your Job Preparation Assistant",
      description: "Simple Site created with NodeJs, Express & MongoDb."
    }

    res.render('main/job-prep', {
      locals,
    });

  } catch (error) {
    console.log(error);
  }

});


module.exports = router;
