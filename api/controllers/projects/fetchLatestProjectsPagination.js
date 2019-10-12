const Project = require('../../../db/models/Project')
const User = require('../../../db/models/User')
const validatePagination = require('../utils/validatePagination')

module.exports = async (req, res) => {
	try {
		const user = await User.query().findById(req.user.id).eager('blockedMembers')
		let start = parseInt(req.query.start)
		let end = parseInt(req.query.end)

		if (!validatePagination({ start, end })) {
			start = 0
			end = 10
		}

		const { blockedMembers } = user
		const blockedUsersIdsArr = blockedMembers.map(u => u.id)

		const projects = await Project.query()
			.select('projects.id', 'projects.name', 'projects.owner_id')
			.eager('[owner, required_skills, has_tags]')
			.modifyEager('owner', builder => builder.select('id', 'name'))
			.whereNot({ archived: true })
			.whereNotIn('projects.owner_id', User.query().select('users.id').joinRelation('blockedMembers').where('target_id', req.user.id))
			.whereNot('projects.owner_id', req.user.id) // Skipping projects of user
			.whereNotIn('projects.owner_id', blockedUsersIdsArr) // Skipping projects of users who req.user blocked
			.range(start, end)
			.orderBy('created_at', 'desc')

		return res.json({ projects: projects.results })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
