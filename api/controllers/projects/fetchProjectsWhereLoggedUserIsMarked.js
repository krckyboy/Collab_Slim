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

		const type = req.query.type
		let marks

		if (type === 'reacted') {
			marks = await MarkedCandidate.query()
				.eager('project.[skills, owner]')
				.modifyEager('project', builder => builder.select('projects.id', 'projects.name', 'projects.owner_id'))
				.modifyEager('project.[owner]', builder => builder.select('id', 'name'))
				.where('status', 'reacted')
				.where('user_id', req.user.id)
				.orderBy('created_at', 'desc')
				.range(start, end)
		} else if (type === 'not_reacted') {
			marks = await MarkedCandidate.query()
				.eager('project.[skills, owner]')
				.modifyEager('project', builder => builder.select('projects.id', 'projects.name', 'projects.owner_id'))
				.modifyEager('project.[owner]', builder => builder.select('id', 'name'))
				.where('status', 'not_reacted')
				.where('user_id', req.user.id)
				.orderBy('created_at', 'desc')
				.range(start, end)
		} else {
			marks = await MarkedCandidate.query()
				.eager('project.[skills, owner]')
				.modifyEager('project', builder => builder.select('projects.id', 'projects.name', 'projects.owner_id'))
				.modifyEager('project.[owner]', builder => builder.select('id', 'name'))
				.where('user_id', req.user.id)
				.orderBy('created_at', 'desc')
				.range(start, end)
		}


		const projects = {
			results: marks.results.map(m => m.project),
			total: marks.total
		}

		return res.status(200).json({ projectsWhereUserIsMarked: projects })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}