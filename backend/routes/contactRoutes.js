const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Contact = require("../models/ContactModel");

// Regular expression for validating phone number (simple format: 10 digits)
const phoneNumberRegex = /^\d{10}$/;

// POST route to save contact details
router.post(
  "/",
  [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .custom(async (value) => {
        const existingContact = await Contact.findOne({ email: value });
        if (existingContact) {
          throw new Error("Email address is already registered");
        }
      }),
    body("number")
      .notEmpty()
      .withMessage("Number is required")
      .matches(phoneNumberRegex)
      .withMessage("Invalid phone number format")
      .custom(async (value) => {
        const existingContact = await Contact.findOne({ number: value });
        if (existingContact) {
          throw new Error("Phone number is already registered");
        }
      }),
    body("subject")
      .notEmpty()
      .withMessage("Subject is required")
      .isLength({ max: 50 })
      .withMessage("Subject must be 50 characters or less"),
    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ max: 100 })
      .withMessage("Message must be 100 characters or less"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const contact = await Contact.create(req.body);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error saving contact:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// GET route to fetch all contact details
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
