/* eslint-disable indent */
const User = require('../../../db/models/User')
const getProjectsWithMySkillsSorted = require('../utils/projects/getProjectsWithMySkillsSorted')
const validatePagination = require('../utils/validatePagination')

module.exports = async (req, res) => {
	try {
		let start = parseInt(req.query.start)
		let end = parseInt(req.query.end)

		if (!validatePagination({ start, end })) {
			start = 0
			end = 10
		}

		const user = await User.query().findById(req.user.id).eager('[skills, blockedMembers]')
		const { skills: hasSkills, blockedMembers } = user

		if (!hasSkills.length > 0) {
			return res.status(400).json({ msg: 'You need to add skills to your profile first!' })
		}

		const blockedUsersIdsArr = blockedMembers.map(u => u.id)
		const skillsIds = hasSkills.map(skill => skill.id)

		const projectsWithRequiredSkillsSorted = await getProjectsWithMySkillsSorted({
			arrayOfSkills: skillsIds,
			userId: req.user.id,
			blockedUsersIdsArr,
			start,
			end,
		})

		return res.json({ projects: projectsWithRequiredSkillsSorted })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
