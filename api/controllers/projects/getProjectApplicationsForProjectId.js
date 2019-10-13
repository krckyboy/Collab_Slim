const Project = require('../../../db/models/Project')
const ProjectApplication = require('../../../db/models/ProjectApplication')
const validatePagination = require('../utils/validatePagination')
const getProperQueryTypeProjectApplications = require('./utils/getProperQueryTypeProjectApplications')

module.exports = async (req, res) => {
	try {
		const type = getProperQueryTypeProjectApplications(req.query.type)
		let start = parseInt(req.query.start)
		let end = parseInt(req.query.end)

		if (!validatePagination({ start, end })) {
			start = 0
			end = 10
		}

		const projectId = parseInt(req.params.project_id)
		const project = await Project.query().findById(projectId)
		
		// If project doesn't exist
		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// Check if owner
		if (project.owner_id !== req.user.id) {
			return res.status(401).json({ msg: 'You\'re not the owner of this project!' })
		}

		let projectApplications

		if (type) {
			projectApplications = await ProjectApplication
				.query()
				.where({ project_id: projectId })
				.where({ status: type })
				.range(start, end)
				.orderBy('created_at', 'desc')
		} else {
			projectApplications = await ProjectApplication
				.query()
				.where({ project_id: projectId })
				.range(start, end)
				.orderBy('created_at', 'desc')
		}

		res.json({ projectApplications: projectApplications.results })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}