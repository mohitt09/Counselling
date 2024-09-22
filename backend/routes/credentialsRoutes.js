const express = require("express");
const router = express.Router();
const Credentials = require("../models/CredentialsModel"); // Adjust the path as necessary
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

// Middleware for validating the request body
const validateCredentials = [
 body("username").notEmpty().withMessage("Username is required"),
 body("password").notEmpty().withMessage("Password is required"),
 body("type").isInt({ gt: 0 }).withMessage("Type must be a positive integer"), // Validate type
 body("profileId").notEmpty().withMessage("Doctor ID is required"), // Validate doctorId
];

const validateLogin = [
 body("username").notEmpty().withMessage("Username is required"),
 body("password").notEmpty().withMessage("Password is required"),
];

router.post("/", validateCredentials, async (req, res) => {
 const errors = validationResult(req);
 if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
 }

 try {
    const { username, password, type, profileId } = req.body; // Extract doctorId from request body
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newCredentials = new Credentials({
      username,
      password: hashedPassword, // Store the hashed password
      type, // Use the type from the request body
      profileId // Save the doctorId in the profileId field
    });

    const savedCredentials = await newCredentials.save();
    res.status(201).json(savedCredentials);
 } catch (error) {
    console.error("Error saving credentials:", error.message);
    res.status(500).json({ error: "Internal server error" });
 }
});


// Login route
// Login route
router.post("/login", validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     return res.status(400).json({ errors: errors.array() });
  }
 
  try {
     const { username, password } = req.body;
 
     // Find the credentials by username
     const credentials = await Credentials.findOne({ username });
     console.log(credentials.profileId); // Add this line to log the credentials object
     if (!credentials) {
       return res.status(404).json({ message: "Credentials not found" });
     }
 
     // Check if the password matches
     const isMatch = await bcrypt.compare(password, credentials.password);
     if (!isMatch) {
       return res.status(400).json({ message: "Invalid password" });
     }
 
     // Check if the type is 1 before generating a token
     if (credentials.type === 1) {
       // Generate a JWT token for type 1
       const token = jwt.sign(
         { id: credentials._id, type: credentials.type },
         process.env.JWT_SECRET,
         {
           expiresIn: "1h", // Token expiration time
         }
       );
       // Return the token and type associated with the credentials
       res.json({ token, type: credentials.type, profileId: credentials.profileId });
     } else if (credentials.type === 2) {
       // Generate a different JWT token for type 2
       const docToken = jwt.sign(
         { id: credentials._id, type: credentials.type },
         process.env.JWT_SECRET, // Ensure you have a different secret or key for type 2 if needed
         {
           expiresIn: "1h", // Token expiration time
         }
       );
       // Return the docToken and type associated with the credentials
       res.json({ docToken, type: credentials.type, profileId: credentials.profileId });
     } else {
       // If type is not 1 or 2, return the type without a token
       res.json({ type: credentials.type, profileId: credentials.profileId });
     }
  } catch (error) {
     console.error("Error during login:", error.message);
     res.status(500).json({ error: "Internal server error" });
  }
 });

module.exports = router;
