const Skill = require('../../../../db/models/Skill')

module.exports = async function insertMissingSkillsToDb(skills) {
	if (skills && skills.length > 0) {
		const existingSkills = await Skill.query().whereIn('name', skills)
		const missingSkills = skills.filter(skill => !existingSkills.find(it => it.name === skill))
		const insertedSkills = await Skill.query().insert(missingSkills.map(name => ({ name })))
		return [...existingSkills, ...insertedSkills]
	} else {
		return []
	}
} 