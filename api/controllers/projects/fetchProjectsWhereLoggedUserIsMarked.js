const Project = require('../../../db/models/Project')
const User = require('../../../db/models/User')

module.exports = async (req, res) => {
	try {
		// Fetch blocked members of project owner
		const { blockedMembers: blockedFromProjectOwner } = await User.query().findById(req.user.id).eager('blockedMembers')
		const blockedMembersFromProjectOwnerIds = blockedFromProjectOwner.map(u => u.id)

		const projects = await Project.query()
			.select('projects.id', 'projects.name', 'projects.owner_id')
			.eager('[owner, skills, has_tags]')
			.modifyEager('skills', builder => builder.select('skills.id', 'skills.name'))
			.modifyEager('owner', builder => builder.select('id', 'name'))
			.whereNotIn('projects.owner_id', User.query().select('users.id').joinRelation('blockedMembers').where('target_id', req.user.id)) // Skipping projects whose owners have userId blocked 
			.whereNotIn('projects.owner_id', blockedMembersFromProjectOwnerIds)

		return res.status(200).json({ projectsWhereUserIsMarked: projects })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}