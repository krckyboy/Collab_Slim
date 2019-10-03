const Project = require('../../../db/models/Project')

// At this point image is already uploaded
module.exports = async (req, res, next) => {
	try {
		const projectId = parseInt(req.params.project_id)

		if (isNaN(projectId)) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		const project = await Project.query().findById(projectId)

		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// Check if logged user is the project owner
		if (project.owner_id !== req.user.id) {
			return res.status(401).json({ msg: 'You are not authorized to do that!' })
		}

		console.log('this runs')

		// Check if there's already an image

		// Remove image if exists

		next()
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
