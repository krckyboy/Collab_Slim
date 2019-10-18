const Project = require('../../../db/models/Project')

module.exports = async (req, res) => {
	try {
		const projects = await Project.query()
			.select('projects.id', 'projects.name', 'projects.owner_id')
			.eager('[owner, skills, has_tags]')
			.modifyEager('skills', builder => builder.select('skills.id', 'skills.name'))
			.modifyEager('owner', builder => builder.select('id', 'name'))

		return res.status(200).json({ projectsWhereUserIsMarked: projects })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}