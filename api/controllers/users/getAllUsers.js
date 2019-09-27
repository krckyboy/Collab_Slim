const User = require('../../../db/models/User')

module.exports = async (req, res) => {
	try {
		const users = await User.query().eager('[profile, has_skills]')
		res.json({ users })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}