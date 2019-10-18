const Project = require('../../../db/models/Project')
const User = require('../../../db/models/User')

module.exports = async (req, res) => {
	try {
		const projectId = parseInt(req.params.project_id)

		if (isNaN(projectId)) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		const project = await Project.query().findById(projectId).joinEager('[markedCandidates]')
		const { markedCandidates, owner_id: ownerId } = project

		// If project doesn't exist
		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// Check if owner
		if (ownerId !== req.user.id) {
			return res.status(400).json({ msg: 'You are not the owner of this project!' })
		}

		// Get user IDs
		const userIds = markedCandidates.map(user => user.id)

		const users = await User.query()
			.select('users.id', 'users.name')
			.whereIn('users.id', userIds)

		return res.status(200).json({ markedCandidates: users })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}