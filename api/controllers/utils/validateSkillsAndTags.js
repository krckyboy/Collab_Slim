const checkIfArrayValuesAreOfSpecificType = require('./checkIfArrayValuesAreOfSpecificType')

module.exports = function validateSkillsAndTags({ skills, tags }) {
	const returningObj = {}

	// Check if skills is an array and each element string
	if (skills) {
		if (!checkIfArrayValuesAreOfSpecificType(skills, 'string')) {
			return { err: true }
		} else {
			// Return skills, but only unique values
			returningObj.skills = skills.filter((value, index, self) => self.indexOf(value) === index)
		}
	} else {
		returningObj.skills = []
	}

	// Check if tags is an array and each element string
	if (tags) {
		if (!checkIfArrayValuesAreOfSpecificType(tags, 'string')) {
			return { err: true }
		} else {
			returningObj.tags = tags.filter((value, index, self) => self.indexOf(value) === index)
		}
	} else {
		returningObj.tags = []
	}

	return returningObj
}