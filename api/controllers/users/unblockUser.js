const User = require('../../../db/models/User')
const createEvent = require('../utils/events/createAnEvent')

module.exports = async (req, res) => {
	try {
		const targetUserId = parseInt(req.params.user_id)

		if (isNaN(targetUserId)) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		if (targetUserId === req.user.id) {
			return res.status(400).json({ msg: 'You cannot block yourself in the first place!' })
		}

		// Fetch user with user id
		const targetUser = await User.query().findById(targetUserId)

		if (!targetUser) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		const user = await User.query().findById(req.user.id).eager('blockedMembers')
		const { blockedMembers} = user

		// Check if not blocked in the first place
		let notBlockedInTheFirstPlace = false
		if (blockedMembers && blockedMembers.length > 0) {
			if (!blockedMembers.map(m => m.id).includes(targetUser.id)) {
				notBlockedInTheFirstPlace = true
			}
		}

		if (notBlockedInTheFirstPlace) {
			return res.status(400).json({ msg: 'You have not blocked that user!' })
		}

		await user
			.$relatedQuery('blockedMembers')
			.unrelate()
			.where({ target_id: targetUser.id })

		// Create an event for blocking the user
		await createEvent({
			type: 'user_unblocked',
			triggeringUserId: req.user.id, // the triggering
			targetUserId // the blocked member
		})

		return res.json(targetUser)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
