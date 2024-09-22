const express = require('express');
const router = express.Router();
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN; 

const client = require('twilio')(accountSid, authToken);

const SMS = async (body) => {
    let msg = {
        from: process.env.TWILIO_FROM_NUMBER,
        to: process.env.TWILIO_TO_NUMBER,
        body
    };
    try {
        const message = await client.messages.create(msg);
        console.log(`Message from: ${message.from}`);
        console.log(`Message to: ${message.to}`);
        console.log(`Message body: ${message.body}`);
        console.log(`Message status: ${message.status}`);
    } catch (error) {
        console.error('An error occurred while sending the message:', error);
    }
}

router.post('/send-sms', async (req, res) => {
    const { body } = req.body;
    try {
        await SMS(body);
        res.status(200).send('First trial msg form twilio');
    } catch (error) {
        console.error('Failed to send SMS:', error);
        res.status(500).send('Failed to send SMS');
    }
});

module.exports = router;