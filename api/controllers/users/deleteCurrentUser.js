const User = require('../../../db/models/User')
const updateCountSkills = require('../utils/skills/updateCountSkills')

module.exports = async (req, res) => {
	try {
		const user = await User.query().findById(req.user.id).eager('has_skills')
		await user.$query().delete()
		const { has_skills } = user
		await updateCountSkills({ skillsWithIds: has_skills, type: 'has_skills' })
		res.json({ user })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}