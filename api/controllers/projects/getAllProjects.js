const Project = require('../../../db/models/Project')

module.exports = async (req, res) => {
	try {
		const type = req.query.type
		let projects

		// Figure out query strings type
		if (type === 'finalized') {
			projects = await Project.query()
				.where({ finalized: true, archived: false })
				.eager('[owner, required_skills]')
				.modifyEager('owner', builder => builder.select('id', 'name'))
		} else {
			projects = await Project.query()
				.where({ finalized: false, archived: false })
				.eager('[owner, required_skills]')
				.modifyEager('owner', builder => builder.select('id', 'name'))
		}

		return res.json({ projects })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
