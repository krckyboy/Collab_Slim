const User = require('../../../../db/models/User')

module.exports = async function validateUsername({ username, userId }) {
	const returningObj = { err: false }

	// Check if name string exists
	if (username === null) {
		returningObj.err = true
		returningObj.text = 'You need to pick a username!'
		return returningObj
	}

	// Check if another user exists with the new name
	const existingUser = await User.query().where({ name: username }).first()

	if (existingUser && existingUser.id !== userId) {
		returningObj.err = true
		returningObj.text = 'User already exists with that username!'
		return returningObj
	}

	// Return object with err boolean and text (username empty or username exists)
	return returningObj
}