const User = require('../../../db/models/User')
const createEvent = require('../utils/events/createAnEvent')

module.exports = async (req, res) => {
	try {
		const userId = parseInt(req.params.user_id)

		if (isNaN(userId)) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		// Fetch user with user id
		const targetUser = await User.query().findById(userId).eager('projects.[project_members]')
		const user = await User.query().findById(req.user.id).eager('[blocked_members, projects.[project_members], projects_user_is_a_member_of.[project_members]]')
		const blocked_members = user.blocked_members

		if (!targetUser) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		// Check if already blocked
		if (blocked_members && blocked_members.length > 0) {
			if (blocked_members.map(m => m.id).includes(targetUser.id)) {
				return res.status(400).json({ msg: 'You have already blocked that user!' })
			}
		}

		// Create an event for blocking the user
		await createEvent({
			type: 'user_blocked',
			userId: req.user.id, // the triggering
			targetUserId: userId // the blocked member
		})

		await user
			.$relatedQuery('blocked_members')
			.relate({ id: targetUser.id })

		delete targetUser.project_members

		return res.json(targetUser)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
