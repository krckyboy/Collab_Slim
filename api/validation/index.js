const { check } = require('express-validator/check')

const registerUserValidation = [
	check('name', 'Name is required').not().isEmpty(),
	check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
	check('email', 'Please include a valid email').isEmail()
]

const loginUserValidation = [
	check('password', 'Password is required').exists(),
	check('email', 'Please include a valid email').isEmail()
]

const createProjectValidation = [
	check('name', 'Name is required').exists(),
	check('description', 'Description is required').exists(),
]

const createProfileValidation = [
	check('skills', 'Skills are required').not().isEmpty()
]

const addExperienceValidation = [
	check('title', 'Title is required').not().isEmpty(),
	check('company', 'Company is required').not().isEmpty(),
	check('from', 'From date is required').not().isEmpty(),
]

const addEducationValidation = [
	check('school', 'School is required').not().isEmpty(),
	check('degree', 'Degree is required').not().isEmpty(),
	check('fieldofstudy', 'Field of study is required').not().isEmpty(),
	check('from', 'From date is required').not().isEmpty(),
]

const createPostValidation = [
	check('text', 'Text is required').not().isEmpty()
]

const createCommentValidation = [
	check('text', 'Text is required').not().isEmpty()
]

module.exports = {
	registerUserValidation,
	loginUserValidation,
	createProfileValidation,
	addExperienceValidation,
	addEducationValidation,
	createPostValidation,
	createCommentValidation,
	createProjectValidation
}