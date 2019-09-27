const { validationResult } = require('express-validator/check')
const generateAuthToken = require('./utils/generateAuthToken')
const User = require('../../../db/models/User')
const bcrypt = require('bcryptjs')

module.exports = async (req, res) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() })
	}
	try {
		const { email, password } = req.body

		const user = await User.query().findOne({ email }).eager('authentication')

		if (!user) {
			return res.status(404).json({ errors: [{ msg: 'Invalid credentials' }] })
		}

		const passwordsMatch = await bcrypt.compare(password, user.authentication.password)

		if (!passwordsMatch) {
			return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] })
		}

		const token = generateAuthToken(user.id)

		res.json({ token })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}