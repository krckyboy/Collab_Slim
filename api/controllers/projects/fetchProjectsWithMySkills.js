/* eslint-disable indent */
const User = require('../../../db/models/User')
const getProjectsWithMySkillsSorted = require('../utils/projects/getProjectsWithMySkillsSorted')


module.exports = async (req, res) => {
	try {
		const user = await User.query().findById(req.user.id).eager('[has_skills, blocked_members]')
		const { has_skills: hasSkills, blocked_members: blockedMembers } = user

		if (!hasSkills.length > 0) {
			return res.status(400).json({ msg: 'You need to add skills to your profile first!' })
		}

		const blockedUsersIdsArr = blockedMembers.map(u => u.id)
		const skillsIds = hasSkills.map(skill => skill.id)
		const projectsWithRequiredSkillsSorted = await getProjectsWithMySkillsSorted({
			arrayOfSkills: skillsIds,
			userId: req.user.id,
			blockedUsersIdsArr
		})

		return res.json({ projects: projectsWithRequiredSkillsSorted })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
