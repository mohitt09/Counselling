const express = require("express");
const router = express.Router();
const Admin = require("../models/AdminModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const { v4: uuidv4 } = require('uuid');

// GET route to retrieve all admins
router.get("/", async (req, res) => {
  try {
     // Find all admins
     const admins = await Admin.find({});
     // Return the admins
     res.status(200).json(admins);
  } catch (err) {
     console.error("Error fetching admins:", err);
     res.status(500).json({ message: "Server Error" });
  }
 });

// Admin Login Route
router.post(
  "/login",
  [
    check("username").isLength({ min: 1 }).withMessage("Username is required"),
    check("password").isLength({ min: 1 }).withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;

      // Find the admin by username
      const admin = await Admin.findOne({ username });
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Check if the password matches
      // const isMatch = await bcrypt.compare(password, admin.password);
      if (!password) {
        return res.status(400).json({ message: "Invalid password" });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Send the token back to the client
      res.json({ token, username });
    } catch (err) {
      console.error("Error logging in admin:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST route to create a new admin
router.post(
  "/",
  [
     check("username").notEmpty().withMessage("Username is required"),
     check("password")
       .isLength({ min: 6 })
       .withMessage("Password must be at least 6 characters long"),
     check("type")
       .isInt({ gt: 0 })
       .withMessage("Type must be a positive integer"),
     handleValidationErrors, // Middleware to handle validation errors
  ],
  async (req, res) => {
     try {
       const hashedPassword = await bcrypt.hash(req.body.password, 10);
       const newAdmin = new Admin({
         adminId: uuidv4(), // Generate a new adminId
         username: req.body.username,
         password: hashedPassword,
         type: req.body.type,
       });
       const savedAdmin = await newAdmin.save();
       res.status(201).json(savedAdmin);
     } catch (err) {
       console.error("Error adding admin:", err);
       res.status(500).json({ message: "Server Error" });
     }
  }
 );
// DELETE route to delete an admin
router.delete("/:adminId", async (req, res) => {
  try {
    await Admin.deleteOne({ _id: req.params.adminId });
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// PATCH route to toggle admin status
router.patch("/:adminId/toggle-active", async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    admin.isActive = !admin.isActive;
    await admin.save();
    res.json({ message: "Admin's active status toggled successfully" });
  } catch (err) {
    console.error("Error toggling admin's active status:", err);
    res.status(500).json({ message: "Server Error" });
  }
});
module.exports = router;
