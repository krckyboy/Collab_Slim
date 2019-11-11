const bcrypt = require('bcryptjs')
const generateAuthToken = require('./utils/generateAuthToken')
const User = require('../../../db/models/User')

module.exports = async (req, res) => {
	try {
		const { email, password } = req.body
		const existingUsers = await User.query().where({ email })

		if (existingUsers.length > 0) {
			for (let user of existingUsers) {
				if (user.email === email) {
					return res.status(400).json({ msg: 'User already exists with that email!' })
				}
			}

		}

		const hashedPassword = await bcrypt.hash(password, 8)

		const newUser = await User.query().insert({
			email,
		})

		await newUser.$relatedQuery('authentication').insert({ password: hashedPassword, user_id: newUser.id })

		const token = generateAuthToken(newUser.id)

		res.status(201).json({ token })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}