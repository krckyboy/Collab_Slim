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

		// Fetch only candidates that haven't blocked req.user.id
		const blockedUserIdSubquery = User.relatedQuery('blockedMembers').where('blocked_members.target_id', req.user.id)
		
		// Fetch blocked members of project owner
		const { blockedMembers: blockedFromProjectOwner } = await User.query().findById(req.user.id).eager('blockedMembers')
		const blockedMembersFromProjectOwnerIds = blockedFromProjectOwner.map(u => u.id)

		// Get user IDs
		const userIds = markedCandidates.map(user => user.id)

		// User IDs after filtering out users that req.user.id blocked
		const filteredUserIds = userIds.filter(id => !blockedMembersFromProjectOwnerIds.includes(id))

		const users = await User.query()
			.select('users.id', 'users.name')
			.whereNotExists(blockedUserIdSubquery.clone())
			.whereIn('users.id', filteredUserIds)

		return res.status(200).json({ markedCandidates: users })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}