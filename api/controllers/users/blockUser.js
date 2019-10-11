const User = require('../../../db/models/User')
const createEvent = require('../utils/events/createAnEvent')

module.exports = async (req, res) => {
	try {
		const userId = parseInt(req.params.user_id)

		if (isNaN(userId)) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		if (userId === req.user.id) {
			return res.status(400).json({ msg: 'You cannot block yourself!' })
		}

		// Fetch user with user id
		const targetUser = await User.query().findById(userId)

		if (!targetUser) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		const user = await User.query().findById(req.user.id).eager('blockedMembers')
		const { blockedMembers } = user

		// Check if already blocked
		if (blockedMembers && blockedMembers.length > 0) {
			if (blockedMembers.map(m => m.id).includes(targetUser.id)) {
				return res.status(400).json({ msg: 'You have already blocked that user!' })
			}
		}

		// Create an event for blocking the user
		await createEvent({
			type: 'user_blocked',
			triggeringUserId: req.user.id,
			targetUserId: userId
		})

		await user
			.$relatedQuery('blockedMembers')
			.relate({ id: targetUser.id })

		return res.json({ targetUser })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
