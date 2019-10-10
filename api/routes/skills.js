const express = require('express')
const router = express.Router()

// @route 	GET api/skills/search_skills
// @desc 	Fetch skills that are of the similar name of the sent value
// @access 	Public
router.get('/search_skills', require('../controllers/skills/searchSkills'))

// @route 	GET api/skills
// @desc 	Fetch skills with pagination. Also, can be filtered by 'popular' (has_skills count ^) or 'in_demand' (required_skills count ^)
// @access 	Public
router.get('/', require('../controllers/skills/fetchSkills'))

module.exports = router
