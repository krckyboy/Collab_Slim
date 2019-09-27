const Skill = require('../../../../db/models/Skill')
const getUniqueArrayObjectsByProp = require('../getUniqueArrayObjectsByProp')

module.exports = async function updateCountSkills({ skillsWithIds, type }) {
	if (skillsWithIds && skillsWithIds.length > 0) {
		const uniqueSkillsWithIds = getUniqueArrayObjectsByProp(skillsWithIds, 'id')

		// Turn it into a map so each skill will be returned
		// Deal with promises
		const skillPromise = Promise.all(uniqueSkillsWithIds.map(async (skill) => {
			const countHasSkills = await Skill.query()
				.count('*')
				.join('has_skills', 'has_skills.skill_id', 'skills.id')
				.where('has_skills.skill_id', '=', skill.id)

			const countRequiredSkills = await Skill.query()
				.count('*')
				.join('required_skills', 'required_skills.skill_id', 'skills.id')
				.where('required_skills.skill_id', '=', skill.id)

			const countHasSkillsNumber = parseInt(countHasSkills[0].count)
			const countRequiredSkillsNumber = parseInt(countRequiredSkills[0].count)

			if (type === 'has_skills') {
				if (countHasSkillsNumber === 0 && countRequiredSkillsNumber === 0) {
					await skill.$query().delete()
					return false
				} else {
					return await skill.$query().updateAndFetch({ has_skills_count: countHasSkillsNumber }).where({ id: skill.id })
				}
			}

			if (type === 'required_skills') {
				if (countHasSkillsNumber === 0 && countRequiredSkillsNumber === 0) {
					await skill.$query().delete()
					return false
				} else {
					return await skill.$query().updateAndFetch({ required_skills_count: countRequiredSkillsNumber }).where({ id: skill.id })
				}
			}
			return false
		}))

		const awaited = await skillPromise
		const filtered = awaited.filter(skill => skill)
		return filtered
	}
}