const express = require('express')
const router = express.Router()

// @route 	GET api/skills/search_tags
// @desc 	Fetch skills that are of the similar name of the sent value
// @access 	Public
router.get('/search_tags', require('../controllers/tags/searchTags'))

// @route 	GET api/tags
// @desc 	Fetch tags with pagination
// @access 	Public
router.get('/', require('../controllers/tags/fetchTags'))

module.exports = router