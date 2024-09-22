// routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const Doctor = require("../models/DoctorModel");
const multer = require("multer");
const upload = require("../utils/multerConfig");
const handleUpload = require("../utils/multerConfig");

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { check, validationResult, body } = require("express-validator");
const { v4: uuidv4 } = require("uuid");

router.post(
  "/login",
  [
    check("doctorId").isLength({ min: 1 }).withMessage("Doctor ID is required"),
    check("password").isLength({ min: 1 }).withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { doctorId, password } = req.body;

      // Find the doctor by doctorId
      const doctor = await Doctor.findOne({ doctorId });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Check if the password matches
      const isMatch = await bcrypt.compare(password, doctor.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      // console.log(doctor.name);
      // Send the token back to the client
      res.json({ token, name: doctor.name });
    } catch (err) {
      console.error("Error logging in doctor:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post(
  "/",
  [
    handleUpload,
    check("name")
      .notEmpty()
      .withMessage("Name is required")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),
    check("education").notEmpty().withMessage("Education is required"),
    check("department").notEmpty().withMessage("Department is required"),
    check("about").notEmpty().withMessage("About is required"),
    check("experience").notEmpty().withMessage("Experience is required"),
    check("fees").notEmpty().withMessage("Fees is required"),
    check("speciality").notEmpty().withMessage("Speciality is required"),
    // Custom validation for timeSlots
    body("timeSlots")
      .custom((value) => {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error("Time slots must be a non-empty array");
          }
          return true; // Indicates the validation passed
        } catch (error) {
          return false; // Indicates the validation failed
        }
      })
      .withMessage("Time slots must be a non-empty array"),
    // Custom validation for workingDays
    body("workingDays")
      .custom((value) => {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error("Working days must be a non-empty array");
          }
          return true; // Indicates the validation passed
        } catch (error) {
          return false; // Indicates the validation failed
        }
      })
      .withMessage("Working days must be a non-empty array"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Generate a random doctorId
      const doctorId = uuidv4();

      // Parse time slots from the request body
      const timeSlots = JSON.parse(req.body.timeSlots);

      // Parse working days from the request body
      const workingDays = JSON.parse(req.body.workingDays);

      const newDoctor = new Doctor({
        doctorId: doctorId,
        name: req.body.name,
        education: req.body.education,
        department: req.body.department,
        about: req.body.about,
        experience: req.body.experience,
        fees: req.body.fees,
        image: req.file.path,
        youtubeLink: req.body.youtubeLink,
        instagramLink: req.body.instagramLink,
        facebookLink: req.body.facebookLink,
        speciality: req.body.speciality,
        timeSlots: timeSlots,
        workingDays: workingDays, // Include working days in the new doctor document
      });

      const savedDoctor = await newDoctor.save();
      res.status(201).json(savedDoctor);
    } catch (err) {
      console.error("Error adding doctor:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.get("/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.params.doctorId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    // Return the doctorId instead of the database _id
    res.json({ doctorId: doctor.doctorId, ...doctor._doc });
  } catch (err) {
    console.error("Error fetching doctor:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.params.doctorId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Construct the full path to the image file
    const imagePath = `${doctor.image.replace(/\\/g, "/")}`;
    console.log(imagePath);

    // Delete the image file from the file system
    fs.unlink(imagePath, async (err) => {
      if (err) {
        console.error("Error deleting image file:", err);
        return res.status(500).json({ message: "Error deleting image file" });
      }

      // If the image file is successfully deleted, proceed to delete the doctor from the database
      try {
        await Doctor.deleteOne({ doctorId: req.params.doctorId });
        res.status(200).json({
          message: "Doctor and image deleted successfully",
          doctorId: req.params.doctorId,
        });
      } catch (err) {
        console.error("Error deleting doctor:", err);
        res.status(500).json({ message: "Server Error" });
      }
    });
  } catch (err) {
    console.error("Error deleting doctor:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// routes/doctorRoutes.js
router.patch("/:doctorId/toggle-active", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.params.doctorId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isActive = !doctor.isActive; // Toggle the isActive status
    await doctor.save();

    res.json({
      message: "Doctor's active status toggled successfully",
      doctorId: doctor.doctorId,
      isActive: doctor.isActive,
    });
  } catch (err) {
    console.error("Error toggling doctor's active status:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Route to fetch a doctor's details by profileId
router.get("/profile/:profileId", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.params.profileId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    // Return all the doctor's details
    res.json(doctor);
  } catch (err) {
    console.error("Error fetching doctor:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find({}, "name doctorId"); // Assuming 'name' and 'doctorId' are the fields you want
    res.json(doctors);
  } catch (err) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
