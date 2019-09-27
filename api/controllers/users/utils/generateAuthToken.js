const jwt = require('jsonwebtoken')

const generateAuthToken = (userId) => {
	const payload = {
		user: {
			id: userId
		}
	}

	// @todo Kick the expires in up for production
	const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }) // Embedding the user's ID in the token so we can use it for authentication later on.

	return token
}

module.exports = generateAuthToken