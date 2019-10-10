const Project = require('../../../db/models/Project')
const User = require('../../../db/models/User')
const validatePagination = require('../utils/validatePagination')

module.exports = async (req, res) => {
	try {
		const user = await User.query().findById(req.user.id).eager('blocked_members')
		let start = parseInt(req.query.start)
		let end = parseInt(req.query.end)

		if (!validatePagination({ start, end })) {
			start = 0
			end = 10
		}

		const { blocked_members: blockedMembers } = user
		const blockedUsersIdsArr = blockedMembers.map(u => u.id)

		const projects = await Project
			.query()
			.eager('[owner.[blocked_members], required_skills, has_tags]')
			.modifyEager('owner', builder => builder.select('id', 'name'))
			.range(start, end)
			.where({ archived: false })
			.whereNot('projects.owner_id', req.user.id) // Skipping projects of user
			.whereNotIn('projects.owner_id', blockedUsersIdsArr) // Skipping projects of users who req.user blocked
			.orderBy('created_at', 'desc')

		const projectsWhereUserIdIsntBlocked = projects.results.filter(p => {
			const blockedMembersIds = p.owner.blocked_members.map(u => u.id)
			if (!blockedMembersIds.includes(req.user.id)) return true
		})

		// Delete banned_members on each project.owner for privacy issues
		projectsWhereUserIdIsntBlocked.forEach(p => {
			delete p.owner.blocked_members
		})

		return res.json({ projects: projectsWhereUserIdIsntBlocked })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
