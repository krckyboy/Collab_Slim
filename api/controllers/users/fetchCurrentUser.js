const User = require('../../../db/models/User')

module.exports = async (req, res) => {
	try {
		const user = await User.query().findById(req.user.id).eager('has_skills')
		res.json({ user })
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server error')
	}
}