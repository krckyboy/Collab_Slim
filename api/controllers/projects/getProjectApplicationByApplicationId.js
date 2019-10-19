const ProjectApplication = require('../../../db/models/ProjectApplication')
const checkIfBlocked = require('../users/utils/checkIfBlocked')

module.exports = async (req, res) => {
	try {
		const projectApplicationId = parseInt(req.params.project_application_id)

		if (isNaN(projectApplicationId)) {
			return res.status(404).json({ msg: 'No project application found!' })
		}

		const projectApplication = await ProjectApplication
			.query()
			.findById(projectApplicationId)
			.eager('project')

		if (!projectApplication) {
			return res.status(404).json({ msg: 'No project application found!' })
		}

		// Check if owner
		if (projectApplication.project.owner_id !== req.user.id) {
			return res.status(401).json({ msg: 'You\'re not the owner of this project!' })
		}

		// Check if blocked in both ways
		if (await checkIfBlocked(req.user.id, projectApplication.user_id) || await checkIfBlocked(projectApplication.user_id, req.user.id)) {
			return res.status(403).send()
		}

		res.json({ projectApplication })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}