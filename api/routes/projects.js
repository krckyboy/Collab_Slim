const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { createProjectValidation } = require('../validation/index')
const multer = require('multer')

const upload = multer({
	dest: 'project_images',
	limits: {
		fileSize: 1000000, // 1mb
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('Please upload an image'))
		}
		cb(null, true)
		// cb(null, false)
	}
})

// @todo Add pagination
// @route 	GET api/projects
// @desc 	Get all projects
// @access 	Public
router.get('/', require('../controllers/projects/getAllProjects'))

// @route 	POST api/projects 
// @desc 	Create a project
// @access 	Private
router.post('/', auth, createProjectValidation, require('../controllers/projects/createProject'))

// @route 	POST api/projects/:project_id/add_image
// @desc 	Add an image to project
// @access 	Private
router.post('/:project_id/add_image',
	[
		auth,
		// Add to check if premium
		require('../controllers/projects/addProjectImage'),
		upload.single('project_image'),
		(req, res) => { res.send() },
	],
	// eslint-disable-next-line no-unused-vars
	(error, req, res, next) => {
		res.status(400).json({ error: error.message })
	}
)

// @route 	PUT api/projects/:project_id
// @desc 	Edit a project
// @access 	Private
router.put('/:project_id', [auth, createProjectValidation], require('../controllers/projects/editProject'))

// @route 	PUT api/projects/:project_id/archive
// @desc 	Archive a project
// @access 	Private
router.patch('/:project_id/archive', auth, require('../controllers/projects/archiveProject'))

// @route 	PUT api/projects/:project_id/unarchive
// @desc 	Unarchive a project
// @access 	Private
router.patch('/:project_id/unarchive', auth, require('../controllers/projects/unarchiveProject'))

// @route 	GET api/projects/:project_id/potentialUsers
// @desc 	Fetch users with the required skills of the project
// @access 	Private
router.get('/:project_id/potentialUsers', auth, require('../controllers/users/fetchUsersWithSkillsForProject'))

// @todo move this to users route
// @route 	GET api/projects/potentialProjects
// @desc 	Fetch projects with the required skills that logged user has
// @access 	Private
router.get('/potentialProjects', auth, require('../controllers/projects/fetchProjectsWithMySkills'))

// @route 	GET api/projects/:project_id
// @desc 	Fetch project by id
// @access 	Private
router.get('/:project_id/', auth, require('../controllers/projects/getProjectById'))

// @route 	GET api/projects/user/:user_id
// @desc 	Fetch user's projects
// @access 	Public
router.get('/user/:user_id', require('../controllers/projects/fetchUsersProjects'))

// @route 	DELETE api/projects/:project_id
// @desc 	Delete project
// @access 	Private
router.delete('/:project_id', auth, require('../controllers/projects/deleteProject'))

module.exports = router