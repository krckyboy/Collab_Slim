const Project = require('../../../db/models/Project')
const ProjectApplication = require('../../../db/models/ProjectApplication')

module.exports = async (req, res) => {
	try {

		const projectApplicationId = parseInt(req.params.project_application_id)
		const projectApplication = await ProjectApplication.query().where({ id: projectApplicationId }).first()

		// If project application doesn't exist
		if (!projectApplication) {
			return res.status(404).json({ msg: 'No project application found!' })
		}

		const project = await Project.query().findById(projectApplication.project_id)

		// If project doesn't exist
		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// Check if owner
		if (project.owner_id !== req.user.id) {
			return res.status(401).json({ msg: 'You\'re not the owner of this project!' })
		}

		if (projectApplication.status === 'sent') {
			await projectApplication.$query().update({
				status: 'read'
			})
		}

		return res.status(200).send()
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}