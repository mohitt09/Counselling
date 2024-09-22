const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Appointment = require("../models/Appointment");
const nodemailer = require("nodemailer");
const Doctor = require("../models/DoctorModel");

// Route to get all appointment times for a specific doctor
router.get("/appointments/:doctorId", async (req, res) => {
  const { doctorId } = req.params;
  console.log(doctorId);

  // Validate doctorId (example: check if it exists in the database)
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({ error: "Doctor not found" });
  }

  try {
    // Find appointments by doctorId and project only the 'time' field
    const appointments = await Appointment.find({ doctorId: doctorId }).select(
      "time"
    );

    // Extract times from appointments
    const appointmentTimes = appointments.map(
      (appointment) => appointment.time
    );

    res.status(200).json(appointmentTimes);
  } catch (error) {
    console.error("Error fetching appointment times:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST route to send appointment confirmation email
router.post("/send-email", async (req, res) => {
  const { email, appointmentDetails } = req.body;

  try {
    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Appointment Confirmation",
      html: `
        <p>Dear ${appointmentDetails.name},</p>
        <p>Your appointment has been scheduled successfully. Here are the details:</p>
        <p>Appointment Date: ${appointmentDetails.date}</p>
        <p>Appointment Time: ${appointmentDetails.time}</p>
        <p>Department: ${appointmentDetails.department}</p>
        <p>Thank you for choosing our services.</p>
      `,
    });

    res.status(200).json({ message: "Confirmation email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).json({ error: "Failed to send confirmation email" });
  }
});

// POST route to save appointment details
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
      .withMessage("Invalid email format"),
    body("gender").notEmpty().withMessage("Gender is required"),
    // Removed 'doctorName' validation since we're now using 'doctorId'
    body("doctorId").notEmpty().withMessage("Doctor ID is required"),
    body("date").notEmpty().withMessage("Date is required"),
    body("time").notEmpty().withMessage("Time is required"),
    body("phoneNo").notEmpty().withMessage("Phone number is required"),
    body("department").notEmpty().withMessage("Department name is required"),
  ],
  async (req, res) => {
    // console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const appointment = await Appointment.create(req.body);
      console.log(appointment);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error saving appointment:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET route to fetch total count of male and female from confirmed appointments for a specific doctor
router.get("/gender-distribution/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params;

    // Aggregate data to count the number of male and female appointments for the specified doctor
    const result = await Appointment.aggregate([
      { $match: { doctorId: profileId, isActive: true, isApproved: true } },
      {
        $group: {
          _id: null, // Group all documents together
          totalMale: { $sum: { $cond: [{ $eq: ["$gender", "male"] }, 1, 0] } },
          totalFemale: {
            $sum: { $cond: [{ $eq: ["$gender", "female"] }, 1, 0] },
          },
        },
      },
    ]);

    // Since we grouped all documents together, we expect only one result
    const genderDistribution = result[0] || { totalMale: 0, totalFemale: 0 };

    res.status(200).json(genderDistribution);
  } catch (error) {
    console.error("Error fetching gender distribution:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// New GET route to fetch only approved and active appointments
router.get("/approved-active", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      isApproved: true,
      isActive: true,
    });
    res.status(200).json(appointments);
  } catch (error) {
    console.error(
      "Error fetching approved and active appointments:",
      error.message
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

// New GET route to fetch only approved and active appointments for a specific profileId
router.get("/approved-active/:profileId", async (req, res) => {
  const { profileId } = req.params;
  try {
    const appointments = await Appointment.find({
      doctorId: profileId, // Assuming doctorId is used to store profileId
      isApproved: true,
      isActive: true,
    });
    res.status(200).json(appointments);
  } catch (error) {
    console.error(
      "Error fetching approved and active appointments:",
      error.message
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET route to fetch all appointment details
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Update appointment status (approve, reject, or reschedule)
// Update appointment status (approve, reject, or reschedule)
router.patch("/:id/status", async (req, res) => {
  try {
    const { action, statusMessage } = req.body;
    let update = {};

    if (action === "approve") {
      update = { isApproved: true, isRescheduled: false };
    } else if (action === "reject") {
      update = { isApproved: false, isRescheduled: false };
    } else if (action === "reschedule") {
      update = { isApproved: false, isRescheduled: true };
    } else if (action === "pending") {
      update = { isApproved: undefined, isRescheduled: false };
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    // If statusMessage is provided in the request body, include it in the update
    if (statusMessage) {
      update.statusMessage = statusMessage;
    }

    // Update the appointment with the new status and status message
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error updating appointment status:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET route to fetch appointments by doctorId
router.get("/:doctorId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctorId: req.params.doctorId,
    });
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments by doctor ID:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:doctorId/:date", async (req, res) => {
  const { doctorId, date } = req.params;
  console.log(`Fetching appointments for doctorId: ${doctorId}, date: ${date}`);

  try {
    const appointments = await Appointment.find({
      doctorId: doctorId,
      date: date,
    }).select("time");
    console.log("Appointments found:", appointments);
    const appointmentTimes = appointments.map(
      (appointment) => appointment.time
    );
    console.log(appointmentTimes);
    res.status(200).json(appointmentTimes);
  } catch (error) {
    console.error("Error fetching appointment times:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH route to update an appointment by ID
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Received appointment ID:", id);

  const { date, time, doctorId, department } = req.body;
  console.log("Received data for update:", req.body);

  try {
    // Find the appointment by ID
    const appointment = await Appointment.findById(id);
    console.log("Found appointment:", appointment);

    if (!appointment) {
      console.log("Appointment not found");
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Update appointment fields if provided
    if (date) {
      appointment.date = date;
    }
    if (time) {
      appointment.time = time;
    }
    if (doctorId) {
      appointment.doctorId = doctorId;
    }
    if (department) {
      appointment.department = department;
    }

    // Set isRescheduled to true
    appointment.isRescheduled = true;
    appointment.isApproved = false;

    // Save the updated appointment
    const updatedAppointment = await appointment.save();
    console.log("Updated appointment:", updatedAppointment);

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the appointment" });
  }
});

router.post("/send-reschedule-email", async (req, res) => {
  const { email, appointmentDetails } = req.body;

  try {
    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Appointment Rescheduled Confirmation",
      html: `
        <p>Dear ${appointmentDetails.name},</p>
        <p>Your appointment with Dr. ${appointmentDetails.doctorName} has been successfully rescheduled. Here are the updated details:</p>
        <p>Appointment Date: ${appointmentDetails.date}</p>
        <p>Appointment Time: ${appointmentDetails.time}</p>
        <p>Department: ${appointmentDetails.department}</p>
        <p>Thank you for choosing our services.</p>
      `,
    });

    res
      .status(200)
      .json({ message: "Reschedule confirmation email sent successfully" });
  } catch (error) {
    console.error("Error sending reschedule email:", error.message);
    res
      .status(500)
      .json({ error: "Failed to send reschedule confirmation email" });
  }
});

module.exports = router;
