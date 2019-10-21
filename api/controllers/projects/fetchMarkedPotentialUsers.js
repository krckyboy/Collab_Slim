const Project = require('../../../db/models/Project')
const MarkedCandidate = require('../../../db/models/MarkedCandidate')
const validatePagination = require('../utils/validatePagination')

module.exports = async (req, res) => {
	try {
		let start = parseInt(req.query.start)
		let end = parseInt(req.query.end)

		if (!validatePagination({ start, end })) {
			start = 0
			end = 10
		}

		const projectId = parseInt(req.params.project_id)

		if (isNaN(projectId)) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		const project = await Project.query()
			.select('projects.id', 'projects.owner_id')
			.findById(projectId)

		// If project doesn't exist
		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// Check if owner
		if (project.owner_id !== req.user.id) {
			return res.status(400).json({ msg: 'You are not the owner of this project!' })
		}

		const marks = await MarkedCandidate.query()
			.eager('user.[skills]')
			.modifyEager('user', builder => builder.select('id', 'name'))
			.where('project_id', project.id)
			.orderBy('created_at', 'desc')
			.range(start, end)

		const markedCandidates = {
			results: marks.results.map(m => m.user),
			total: marks.total
		}
		
		return res.status(200).json({ markedCandidates: markedCandidates })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}