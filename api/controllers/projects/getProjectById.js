const Project = require('../../../db/models/Project')
const checkIfBlocked = require('../users/utils/checkIfBlocked')

module.exports = async (req, res) => {
	try {
		if (isNaN(req.params.project_id)) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		const project = await Project.query().findById(req.params.project_id).eager('[owner, required_skills, project_members]')

		// Returns true if user has blocked targetId, otherwise false
		if (await checkIfBlocked(project.owner_id, req.user.id)) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// If logged user has blocked the project owner
		if (await checkIfBlocked(req.user.id, project.owner_id)) {
			return res.status(404).json({ msg: 'You need to unblock the owner to see the project!' })
		}

		return res.json(project)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}

// how to get required skills