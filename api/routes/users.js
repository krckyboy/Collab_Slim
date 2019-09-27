const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { loginUserValidation } = require('../validation/index')
const { registerUserValidation } = require('../validation/index')

// POST /api/users/login
// Login and return token
// Public
router.post('/login', loginUserValidation, require('../controllers/users/login'))

// @route 	GET api/users/current_user
// @desc 	Get logged in user data
// @access 	Private
router.get('/current_user', auth, require('../controllers/users/fetchCurrentUser'))

// POST /api/users
// Register a new user and return token
// Public
router.post('/', registerUserValidation, require('../controllers/users/register'))

// Get /api/users/block/:user_id
// Block a user
// Private
router.post('/block/:user_id', auth, require('../controllers/users/blockUser'))

// Get /api/users/unblock/:user_id
// Unblock a user
// Private
router.post('/unblock/:user_id', auth, require('../controllers/users/unblockUser'))

// Get /api/users
// Get all users and its profiles
// Public - test route
router.get('/', require('../controllers/users/getAllUsers'))

// Delete /api/users
// Delete logged user
// Private
router.delete('/', auth, require('../controllers/users/deleteCurrentUser'))

// Get /api/users/notifications
// Get logged user's notifications
// Private
router.get('/notifications', auth, require('../controllers/users/fetchLoggedUsersNotifications'))

// Get /api/users/:user_id
// Get user by id and its profile
// Private 
router.get('/:user_id', auth, require('../controllers/users/getUserById'))

module.exports = router