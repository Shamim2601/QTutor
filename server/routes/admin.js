const express = require('express');
const router = express.Router();
const Tutor = require('../models/Tutor');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const regTutor = require('../models/regTutor');
const Question = require('../models/Question');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = 'qtutor';


/**
 * 
 * Check Login
*/
const authMiddleware = (req, res, next ) => {
    const token = req.cookies.token;
  
    if(!token) {
      return res.status(401).json( { message: 'Unauthorized'} );
    }
  
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.userId = decoded.userId;
      next();
    } catch(error) {
      res.status(401).json( { message: 'Unauthorized'} );
    }
  }


// Routes

/**
 * GET /
 * Admin Login Page
*/
router.get('/admin', async (req, res)=>{
    try {
        // console.log(req.url);
        const locals = {
            title : 'Admin',
            description : 'Admin section',
        }

        res.render('admin/index', {locals, layout: adminLayout})
    } catch (error) {
        console.log(error)
    }
});


/**
 * POST /
 * Admin Login Page
*/
router.post('/admin', async (req, res)=>{
    try {
        const { username, password } = req.body;

        const admin = await Admin.findOne({username});

        const hashedPassword = await bcrypt.hash(password, 10);

        if(!admin){
            res.status(401).json({ message: 'Invalid Credentials'});
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if(!isPasswordValid){
            res.status(401).json({ message: 'Invalid Credentials'});
        }

        const token = jwt.sign({userId : admin._id}, jwtSecret);
        res.cookie('token', token, {httpOnly : true});
        res.redirect('/dashboard');

    } catch (error) {
        console.log(error)
    }
});

/**
 * POST /
 * Admin Register
*/
router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
  
      try {
        const admin = await Admin.create({ username, password:hashedPassword });
        res.status(201).json({ message: 'User Created', admin });
      } catch (error) {
        if(error.code === 11000) {
          res.status(409).json({ message: 'User already in use'});
        }
        // res.status(500).json({ message: 'Internal server error'})
      }
  
    } catch (error) {
      console.log(error);
    }
  });

  
/**
 * POST /add-question
 * Create a new question with an autoincrement ID
 */
router.post('/add-question', authMiddleware, async (req, res) => {
  try {
    // Find the question with the highest ID
    const questions = await Question.find({}, { id: 1 }).sort({ id: -1 }).limit(1);
    let highestId = 1;

    if (questions.length > 0) {
      const highestIdPrev = questions[0].id;
      highestId = highestIdPrev + 1;
    }

    // Create a new question with the new ID
    const newQuestion = new Question({
      id: highestId,
      questionText: req.body.questionText,
      category: req.body.category
    });

    await newQuestion.save();
    res.redirect('/dashboard'); // Redirect to the appropriate page after adding
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

/**
 * GET /
 * Admin Dashboard
*/
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
      const locals = {
        title: 'Dashboard',
        description: 'Simple Site created with NodeJs, Express & MongoDb.'
      }
  
      const data = await Tutor.find().sort({ id: 1 });
      res.render('admin/dashboard', {
        locals,
        data,
        layout: adminLayout
      });
  
    } catch (error) {
      console.log(error);
    }
  
  });


/**
 * GET /
 * Admin - Create New Tutor
*/
router.get('/add-tutor', authMiddleware, async (req, res) => {
    try {
      const locals = {
        title: 'Add Tutor',
        description: 'Simple Site created with NodeJs, Express & MongoDb.'
      }
  
      const data = await Tutor.find();
      res.render('admin/add-tutor', {
        locals,
        layout: adminLayout
      });
  
    } catch (error) {
      console.log(error);
    }
  
  });
  
  
  /**
   * POST /
   * Admin - Create New Tutor
  */
  router.post('/add-tutor', authMiddleware, async (req, res) => {
    try {
      const tutors = await Tutor.find({}, { id: 1 }).sort({ id: -1 }).limit(1); // Find the tutor with the highest ID
      let highestId = 1;
  
      if (tutors.length > 0) {
          const highestIdprev = tutors[0].id;
          highestId = highestIdprev + 1;
      }
  
      const newId = highestId;
      try {
        const newTutor = new Tutor({
          name: req.body.name,
          id: newId,
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
          rating: req.body.rating,
        });
  
        await Tutor.create(newTutor);
        res.redirect('/dashboard');
      } catch (error) {
        console.log(error);
      }
  
    } catch (error) {
      console.log(error);
    }
  });


/**
 * GET /
 * Admin - Increment Tutor Rating
 */
router.get('/inc_rating/:id', authMiddleware, async (req, res) => {
  try {
    await Tutor.findByIdAndUpdate(req.params.id, { $inc: { rating: 1 } });
    res.redirect('/dashboard'); // redirect to the appropriate page after incrementing
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});

/**
 * GET /
 * Admin - Decrement Tutor Rating
 */
router.get('/dec_rating/:id', authMiddleware, async (req, res) => {
  try {
    await Tutor.findByIdAndUpdate(req.params.id, { $inc: { rating: -1 } });
    res.redirect('/dashboard'); // redirect to the appropriate page after decrementing
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});

/**
 * DELETE /
 * Admin - Delete Tutor
*/
router.delete('/delete-tutor/:id', authMiddleware, async (req, res) => {

  try {
    await Tutor.deleteOne( { _id: req.params.id } );
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }

});


/*
 * GET /
 * Admin Reg List
*/
router.get('/reg-list', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Reg List',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const data = await regTutor.find().sort({tag:1});
    res.render('admin/reg-list', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * Admin - Approve regTutor
 */
router.get('/approve-reg/:id', authMiddleware, async (req, res) => {
  try {
    // Find the registration tutor by ID
    const regtutor = await regTutor.findById(req.params.id);

    const tutors = await Tutor.find({}, { id: 1 }).sort({ id: -1 }).limit(1); // Find the tutor with the highest ID
    let highestId = 1;

    if (tutors.length > 0) {
      const highestIdprev = tutors[0].id;
      highestId = highestIdprev + 1;
    }


    const newId = highestId;
    
    // Create a new Tutor using the properties of the registration tutor
    const newTutor = new Tutor({
      name: regtutor.name,
      id: newId,
      tag: regtutor.tag,
      institution: regtutor.institution,
      dept: regtutor.dept,
      hsc: regtutor.hsc,
      background: regtutor.background,
      college: regtutor.college,
      expertise: regtutor.expertise,
      mode: regtutor.mode,
      pref: regtutor.pref,
      phone: regtutor.phone,
      email: regtutor.email,
      fb: regtutor.fb,
      rating: 5
    });

    // Save the new tutor to the database
    await newTutor.save();

    await regtutor.deleteOne();

    // Redirect to the registration list
    res.redirect('/reg-list');
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});



/**
 * DELETE /
 * Admin - Delete regTutor
*/
router.delete('/delete-regtutor/:id', authMiddleware, async (req, res) => {

  try {
    await regTutor.deleteOne( { _id: req.params.id } );
    res.redirect('/reg-list');
  } catch (error) {
    console.log(error);
  }

});


/*
 * GET /
 * Admin Student List
*/
router.get('/student-list', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Student List',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const data = await Student.find().sort({class:-1});
    res.render('admin/student-list', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * Admin - Add New Student
*/
router.get('/add-student', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Student',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const data = await Student.find();
    res.render('admin/add-student', {
      locals,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * POST /
 * Admin - Add New Student
*/
router.post('/add-student', authMiddleware, async (req, res) => {
    try {
      const newStudent = new Student({
        name: req.body.name,
        institution: req.body.institution,
        class: req.body.class,
        phone: req.body.phone,
        tutor: req.body.tutor
      });

      await Student.create(newStudent);
      res.redirect('/student-list');
    } catch (error) {
      console.log(error);
    }
});


/**
 * DELETE /
 * Admin - Delete Student
*/
router.delete('/delete-student/:id', authMiddleware, async (req, res) => {

  try {
    await Student.deleteOne( { _id: req.params.id } );
    res.redirect('/student-list');
  } catch (error) {
    console.log(error);
  }

});



/**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    //res.json({ message: 'Logout successful.'});
    res.redirect('/');
  });


/*

 * GET /update
 * Admin - Update tutor IDs to sequential numbers

router.get('/update', async (req, res) => {
  try {
    // Fetch all tutors
    const tutors = await Tutor.find();

    // Update each tutor's id to a sequential number starting from 1
    for (let i = 0; i < tutors.length; i++) {
      tutors[i].id = i + 1;
      await tutors[i].save();
    }

    // Redirect or send a response after update
    res.redirect('/'); // or send a success message
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});

*/

module.exports = router;