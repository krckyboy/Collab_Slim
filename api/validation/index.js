const { check } = require('express-validator/check')

const registerUserValidation = [
	check('name', 'Name is required!').not().isEmpty(), // @todo Set the limit
	check('password', 'Please enter a password with 6 or more characters!').isLength({ min: 6 }),
	check('email', 'Please include a valid email!').isEmail()
]

const loginUserValidation = [
	check('password', 'Password is required!').exists(),
	check('email', 'Please include a valid email!').isEmail()
]

const createProjectValidation = [
	check('name', 'Name is required!').exists(), // @todo Set the limit for name
	check('description', 'Description is required!').exists(), // @todo Set the length to a paragraph for better content and also minimum amount of chars.
	// @todo Add skills as required, length to be > 0
]

const projectApplicationValidation = [
	check('email', 'Please include a valid email!').isEmail(),
	check('message', 'Message is required!').exists(),
]

module.exports = {
	registerUserValidation,
	loginUserValidation,
	createProjectValidation,
	projectApplicationValidation,
}