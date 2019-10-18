const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { createProjectValidation, projectApplicationValidation } = require('../validation/index')
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

// @route 	GET api/projects
// @desc 	Get latest projects with pagination
// @access 	Private
router.get('/', auth, require('../controllers/projects/fetchLatestProjectsPagination'))

// @route 	POST api/projects 
// @desc 	Create a project
// @access 	Private
router.post('/', [auth, createProjectValidation], require('../controllers/projects/createProject'))

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

// @route 	POST api/projects/project_application/:project_id
// @desc 	Apply for project with message and email for contact
// @access 	Private
router.post('/project_application/:project_id', [auth, projectApplicationValidation], require('../controllers/projects/sendProjectApplication.js'))

// @route 	POST api/projects/marked_users/:project_id/:user_id
// @desc 	Mark a user as a potential candidate
// @access 	Private
router.post('/marked_users/:project_id/:user_id', [auth], require('../controllers/projects/markUserAsPotentialCandidate.js'))

// @route 	GET api/projects/marked_users/:project_id
// @desc 	Get all marked potential users for project by project ID
// @access 	Private
router.get('/marked_users/:project_id/', [auth], require('../controllers/projects/fetchMarkedPotentialUsers.js'))

// @route 	GET api/projects/projects_where_user_is_marked/
// @desc 	Get all projects where logged user is marked as a potential candidate
// @access 	Private
router.get('/projects_where_user_is_marked/', [auth], require('../controllers/projects/fetchProjectsWhereLoggedUserIsMarked.js'))

// @route 	GET api/projects/project_application/:project_id
// @desc 	Get project applications for projectId
// @access 	Private
router.get('/project_applications/:project_id', [auth], require('../controllers/projects/getProjectApplicationsForProjectId.js'))

// @route 	PATCH api/projects/project_application_read/:project_application_id
// @desc 	Set project application read
// @access 	Private
router.patch('/project_application_read/:project_application_id', [auth], require('../controllers/projects/markProjectApplicationRead.js'))

// @route 	PATCH api/projects/project_application_read/:project_application_id
// @desc 	Set project application archived
// @access 	Private
router.patch('/project_application_archived/:project_application_id', [auth], require('../controllers/projects/markProjectApplicationArchived.js'))

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
// @access 	Private
router.get('/user/:user_id', auth, require('../controllers/projects/fetchUsersProjects'))

// @route 	DELETE api/projects/:project_id
// @desc 	Delete project
// @access 	Private
router.delete('/:project_id', auth, require('../controllers/projects/deleteProject'))

module.exports = router