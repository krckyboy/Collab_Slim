const { check } = require('express-validator/check')

const registerUserValidation = [
	check('name', 'Name is required!').not().isEmpty(),
	check('password', 'Please enter a password with 6 or more characters!').isLength({ min: 6 }),
	check('email', 'Please include a valid email!').isEmail()
]

const loginUserValidation = [
	check('password', 'Password is required!').exists(),
	check('email', 'Please include a valid email!').isEmail()
]

const createProjectValidation = [
	check('name', 'Name is required!').exists(),
	check('description', 'Description is required!').exists(), // @todo Set the length to a paragraph for better content.
]

module.exports = {
	registerUserValidation,
	loginUserValidation,
	createProjectValidation
}