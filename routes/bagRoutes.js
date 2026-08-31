const express = require('express');
const router = express.Router();
const { createBag, trackBag, getMyBags, addScan } = require('../controllers/bagController');
const auth = require('../middleware/auth');

router.post('/create', auth, createBag);
router.get('/track/:tag_number', auth, trackBag);
router.get('/my-bags', auth, getMyBags);
router.post('/scan', auth, addScan);

module.exports = router;