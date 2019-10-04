const Project = require('../../../db/models/Project')
const checkIfBlocked = require('../users/utils/checkIfBlocked')

module.exports = async (req, res) => {
	try {
		if (isNaN(req.params.project_id)) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		const project = await Project.query().findById(req.params.project_id).eager('[owner, required_skills, has_tags]')

		// Returns true if user has blocked targetId, otherwise false
		// If logged user has blocked the project owner, also 404
		if (await checkIfBlocked(project.owner_id, req.user.id) || await checkIfBlocked(req.user.id, project.owner_id)) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		return res.json({ project })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
