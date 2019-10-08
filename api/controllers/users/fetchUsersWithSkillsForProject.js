const Project = require('../../../db/models/Project')
const User = require('../../../db/models/User')
const getUsersWithRequiredSkillsSortedForProject = require('../utils/users/getUsersWithRequiredSkillsSorted')

module.exports = async (req, res) => {
	try {
		const projectId = parseInt(req.params.project_id)
		const user = await User.query().findById(req.user.id).eager('[has_skills, blocked_members]')
		const { blocked_members: blockedMembers } = user

		if (isNaN(projectId)) {
			return res.status(404).send('No project found')
		}

		const project = await Project.query().findById(projectId).eager('required_skills')

		if (!project) {
			return res.status(404).send('No project found')
		}

		if (req.user.id !== project.owner_id) {
			return res.status(401).json({ msg: 'You\'re not authorized for this action!' })
		}

		const { required_skills: requiredSkills } = project
		const requiredSkillsIds = requiredSkills.map(skill => skill.id)

		const blockedUsersIdsArr = blockedMembers.map(u => u.id)

		const usersWithRequiredSkillsSorted = await getUsersWithRequiredSkillsSortedForProject({
			requiredSkillsIds,
			blockedUsersIdsArr,
			userId: req.user.id,
		})

		return res.json({ users: usersWithRequiredSkillsSorted })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
