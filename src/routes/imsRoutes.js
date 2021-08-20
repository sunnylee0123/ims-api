const express = require('express');
const router = express.Router();

const imsController = require('../controllers/imsController');

// Get all subscribers
router.get('/subscribers', imsController.getSubscribers);
// Get a single subscriber by phone number
router.get('/subscriber/:number', imsController.getSubscriberByNumber);
// Update or add a new subscriber by phone number
router.put('/subscriber/:number', imsController.updateSubscriberByNumber);
// Delete a subscriber from the database by phone number
router.delete('/subscriber/:number', imsController.deleteSubscriberByNumber);

module.exports = router;
