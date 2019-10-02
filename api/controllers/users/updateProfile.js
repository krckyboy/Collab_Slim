const User = require('../../../db/models/User')
const fetchDataFromKeys = require('../utils/fetchDataFromKeys')
const insertMissingSkillsToDb = require('../utils/skills/insertMissingSkillsToDb')
const updateCountSkills = require('../utils/skills/updateCountSkills')

module.exports = async (req, res) => {
	const profileFields = ['location', 'website', 'bio', 'github', 'youtube_link', 'twitter', 'facebook_link', 'linkedin', 'instagram', 'discord']

	// Returns an object with key value pairs related to profileFields
	const profileObject = fetchDataFromKeys(profileFields, req)
	const skills = req.body.skills
	try {
		const user = await User.query().findById(req.user.id).eager('has_skills')

		if (!user) {
			return res.status(404).json({ msg: 'User does not exist.' })
		}

		const newSkillsWithIds = await insertMissingSkillsToDb(skills) // this inserts skills into skills table

		const graphData = {
			...user,
			...profileObject,
			has_skills: newSkillsWithIds
		}

		const options = {
			relate: ['has_skills'],
			unrelate: ['has_skills']
		}

		const updatedUser = await user.$query().upsertGraphAndFetch(graphData, options).eager('has_skills]')

		const oldSkillsOnUser = user.has_skills

		const newSkillsWithCountUpdated = await updateCountSkills({ skillsWithIds: [...newSkillsWithIds, ...oldSkillsOnUser], type: 'has_skills' })

		updatedUser.has_skills = newSkillsWithCountUpdated

		return res.json({ updatedUser })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}