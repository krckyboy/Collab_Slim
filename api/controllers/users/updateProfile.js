const User = require('../../../db/models/User')
const fetchDataFromKeys = require('../utils/fetchDataFromKeys')
const insertMissingSkillsToDb = require('../utils/skills/insertMissingSkillsToDb')
const updateCountSkills = require('../utils/skills/updateCountSkills')
const checkIfObjectValuesAreOfSpecificType = require('../utils/checkIfObjectValuesAreOfSpecificType')
const validateSkillsAndTags = require('../utils/validateSkillsAndTags')
const validateUsername = require('../utils/users/validateUsername')

module.exports = async (req, res) => {
	const profileFields = ['location', 'website', 'bio', 'github', 'name']

	// Returns an object with key value pairs related to profileFields
	const profileObject = fetchDataFromKeys(profileFields, req)
	let { skills } = req.body

	// Check if everything is a string or null in the object
	if (!checkIfObjectValuesAreOfSpecificType(profileObject, 'string')) {
		return res.status(400).json({ msg: 'Invalid data.' })
	}

	const { skills: skillsArray, err } = validateSkillsAndTags({ skills, res })

	if (err) {
		return res.status(400).json({ msg: 'Invalid data.' })
	}

	const usernameValidation = await validateUsername({ username: profileObject.name, userId: req.user.id })

	if (usernameValidation.err) {
		return res.status(400).json({ msg: usernameValidation.text })
	}
	try {
		const user = await User.query().findById(req.user.id).eager('skills')

		if (!user) {
			return res.status(404).json({ msg: 'User does not exist.' })
		}

		const newSkillsWithIds = await insertMissingSkillsToDb(skillsArray) // this inserts skills into skills table

		const graphData = {
			...user,
			...profileObject,
			skills: newSkillsWithIds
		}

		const options = {
			relate: ['skills'],
			unrelate: ['skills']
		}

		const updatedUser = await user.$query().upsertGraphAndFetch(graphData, options).eager('skills')

		const oldSkillsOnUser = user.skills

		const newSkillsWithCountUpdated = await updateCountSkills({ skillsWithIds: [...newSkillsWithIds, ...oldSkillsOnUser], type: 'has_skills' })

		// Go through the newSkillsWithCountUpdated, update updatedUser.has_skills with ones that he actually has
		const newSkillNames = newSkillsWithIds.map(s => s.name)
		updatedUser.skills = newSkillsWithCountUpdated.filter(s => newSkillNames.includes(s.name))

		return res.json({ updatedUser })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}