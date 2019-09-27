const User = require('../../../db/models/User')
const createEvent = require('../utils/events/createAnEvent')

module.exports = async (req, res) => {
	try {
		const targetUserId = parseInt(req.params.user_id)

		if (isNaN(targetUserId)) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		// Fetch user with user id
		const targetUser = await User.query().findById(targetUserId)
		const user = await User.query().findById(req.user.id).eager('blocked_members')
		const blocked_members = user.blocked_members

		if (!targetUser) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		let notBlockedInTheFirstPlace = false
		// Check if not blocked in the first place
		if (blocked_members && blocked_members.length > 0) {
			if (!blocked_members.map(m => m.id).includes(targetUser.id)) {
				notBlockedInTheFirstPlace = true
			}
		}

		if (notBlockedInTheFirstPlace) {
			return res.status(400).json({ msg: 'You have not blocked that user!' })
		}

		await user
			.$relatedQuery('blocked_members')
			.unrelate()
			.where({ target_id: targetUser.id })

		// Create an event for blocking the user
		await createEvent({
			type: 'user_unblocked',
			userId: req.user.id, // the triggering
			targetUserId // the blocked member
		})

		return res.json(targetUser)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}