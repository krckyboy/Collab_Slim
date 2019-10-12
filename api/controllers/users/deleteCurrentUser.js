const User = require('../../../db/models/User')
const updateCountSkills = require('../utils/skills/updateCountSkills')
const updateCountTag = require('../utils/tags/updateCountTag')

module.exports = async (req, res) => {
	try {
		const user = await User.query().findById(req.user.id).eager('[skills, projects.[skills, has_tags]]')
		const { skills: has_skills, projects } = user

		const tagsAndSkills = {
			tags: [],
			skills: []
		}

		// Fetch unique skills and tags
		projects.forEach(p => {
			const { skills: required_skills } = p
			const { has_tags } = p

			if (required_skills && required_skills.length > 0) {
				required_skills.forEach(skillFromRequiredSkills => {
					if (!tagsAndSkills.skills.length > 0) {
						tagsAndSkills.skills.push(skillFromRequiredSkills)
					} else {
						const tagsAndSkillsIds = tagsAndSkills.skills.map(skill => skill.id)

						// Check if the skill is already added inside tagsAndSkills object
						if (!tagsAndSkillsIds.includes(skillFromRequiredSkills.id)) {
							tagsAndSkills.skills.push(skillFromRequiredSkills)
						}
					}
				})
			}

			if (has_tags && has_tags.length > 0) {
				has_tags.forEach(tagFromHasTags => {
					if (!tagsAndSkills.tags.length > 0) {
						tagsAndSkills.tags.push(tagFromHasTags)
					} else {
						const tagsAndSkillsIds = tagsAndSkills.tags.map(tag => tag.id)

						// Check if the tag is already added inside tagsAndSkills object
						if (!tagsAndSkillsIds.includes(tagFromHasTags.id)) {
							tagsAndSkills.tags.push(tagFromHasTags)
						}
					}
				})
			}
		})
		await user.$query().delete()

		if (has_skills && has_skills.length > 0) {
			await updateCountSkills({ skillsWithIds: has_skills, type: 'has_skills' })
		}

		// Also update the required_skills count for the skills of his projects
		if (tagsAndSkills.skills.length > 0) {
			await updateCountSkills({ skillsWithIds: tagsAndSkills.skills, type: 'required_skills' })
		}

		// Also update the tags count 
		if (tagsAndSkills.tags.length > 0) {
			await updateCountTag({ tagsWithIds: [...tagsAndSkills.tags] })
		}

		res.json({ user })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}