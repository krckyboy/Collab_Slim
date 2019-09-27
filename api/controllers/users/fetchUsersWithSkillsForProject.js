const Project = require('../../../db/models/Project')
const getUsersWithRequiredSkillsSortedForProject = require('../utils/users/getUsersWithRequiredSkillsSorted')

module.exports = async (req, res) => {
	try {
		const projectId = parseInt(req.params.project_id)

		if (isNaN(projectId)) {
			return res.status(404).send('No project found')
		}

		const project = await Project.query().findById(projectId).eager('required_skills')

		if (req.user.id !== project.owner_id) {
			return res.status(401).json({ msg: 'You\'re not authorized for this action!' })
		}

		const requiredSkills = project.required_skills
		const requiredSkillsIds = requiredSkills.map(skill => skill.id)

		const usersWithRequiredSkillsSorted = await getUsersWithRequiredSkillsSortedForProject(requiredSkillsIds)

		return res.json(usersWithRequiredSkillsSorted)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
