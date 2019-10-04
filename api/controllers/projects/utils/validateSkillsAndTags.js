const checkIfArrayValuesAreOfSpecificType = require('../../utils/checkIfArrayValuesAreOfSpecificType')

module.exports = function validateSkillsAndTags({ skills, tags, res }) {
	const returningObj = {}

	// Check if skills is an array and each element string
	if (skills) {
		if (!checkIfArrayValuesAreOfSpecificType(skills, 'string')) {
			return res.status(400).json({ msg: 'Invalid data.' })
		} else {
			returningObj.skills = skills
		}
	} else {
		returningObj.skills = []
	}

	// Check if tags is an array and each element string
	if (tags) {
		if (!checkIfArrayValuesAreOfSpecificType(tags, 'string')) {
			return res.status(400).json({ msg: 'Invalid data.' })
		} else {
			returningObj.tags = tags
		}
	} else {
		returningObj.tags = []
	}

	return returningObj
}