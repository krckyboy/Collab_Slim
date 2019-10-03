const Project = require('../../../db/models/Project')
const updateCountTag = require('../utils/tags/updateCountTag')
const updateCountSkills = require('../utils/skills/updateCountSkills')

module.exports = async (req, res) => {
	try {
		const projectId = parseInt(req.params.project_id)

		if (isNaN(projectId)) {
			return res.status(404).json({msg: 'No project found!'})
		}

		const project = await Project.query().findById(projectId).eager('[required_skills, has_tags]')

		if (!project) {
			return res.status(404).json({msg: 'No project found!'})
		}

		if (req.user.id !== project.owner_id) {
			return res.status(401).json({ msg: 'You\'re not authorized for this action!' })
		}

		await project.$query().delete()

		const skillsWithIds = project.required_skills
		const tagsWithIds = project.has_tags

		const skillsWithCountUpdated = await updateCountSkills({ skillsWithIds: [...skillsWithIds], type: 'required_skills' })
		const tagsWithCountUpdated = await updateCountTag({ tagsWithIds: [...tagsWithIds] })

		project.has_tags = tagsWithCountUpdated
		project.required_skills = skillsWithCountUpdated

		return res.json({ project })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
