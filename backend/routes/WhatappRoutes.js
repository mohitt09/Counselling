const express = require("express");
const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = "whatsapp:+14155238886";
const toNumber = "whatsapp:+917505527485";

const client = require("twilio")(accountSid, authToken);

const sendWhatsappMessage = async (name, number, doctorName) => {
  const msg = {
    from: fromNumber, // Sender's WhatsApp number
    to: toNumber, // Receiver's WhatsApp number
    body: `Name: ${name}\nPhone Number: ${number}\nDoctor: ${doctorName}`,
  };

  try {
    // Send the message and log the message SID on success
    const message = await client.messages.create(msg);
    console.log(`Message SID: ${message.sid}`);
    return message.sid; // Return the message SID
  } catch (error) {
    // Log any errors that occur while sending the message
    console.error("An error occurred while sending the message:", error);
    throw error; // Re-throw the error to be handled by the calling function
  }
};

// Define a POST endpoint to send a WhatsApp message
router.post("/send-whatsapp", async (req, res) => {
  const { name, number, doctorName } = req.body; // Extract name, number, and doctorName from request body

  // Check if name and number are provided and provide specific error messages
  if (!name && !number) {
    return res.status(400).send("Name and phone number are required");
  }
  if (!name) {
    return res.status(400).send("Name is required");
  }
  if (!number) {
    return res.status(400).send("Phone number is required");
  }

  try {
    // Call the function to send the WhatsApp message
    const messageSid = await sendWhatsappMessage(name, number, doctorName);
    res
      .status(200)
      .json({ message: "Message sent successfully via Twilio", messageSid });
  } catch (error) {
    // Log any errors and send failure response
    console.error("Failed to send WhatsApp message:", error);
    res.status(500).send("Failed to send WhatsApp message");
  }
});

// Export the router to be used in the main app
module.exports = router;
