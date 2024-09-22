   // backend/routes/webhookRoutes.js
   const express = require('express');
   const router = express.Router();

   router.post('/payment-webhook', (req, res) => {
     // Handle the webhook event
     console.log(req.body);
     res.status(200).end();
   });

   module.exports = router;