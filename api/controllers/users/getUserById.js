const User = require('../../../db/models/User')
const checkedIfBlocked = require('../users/utils/checkIfBlocked')

module.exports = async (req, res) => {
	try {
		const { user_id } = req.params
		const user_id_number = parseInt(user_id)

		if (isNaN(user_id_number)) {
			return res.status(404).json({ errors: [{ msg: 'User does not exist.' }] })
		}

		const user = await User.query().select('id', 'name', 'bio', 'location', 'website', 'github').findById(user_id_number).eager('[has_skills, blocked_members]')

		if (!user) {
			return res.status(404).json({ errors: [{ msg: 'User does not exist.' }] })
		}

		const blockedMembers = user.blocked_members

		// Check if the user to be fetched has blocked the user trying to get data
		if (blockedMembers && blockedMembers.length > 0) {
			if (blockedMembers.map(user => user.id).includes(req.user.id)) {
				return res.status(404).json({ msg: 'No user found!' })
			}
		}

		// Check if the logged user has blocked the user he's trying to access
		if (await checkedIfBlocked(req.user.id, user_id_number)) {
			return res.status(400).json({ msg: 'You have to unblock this member first!' })
		}

		// don't include blocked members
		delete user.blocked_members

		res.status(200).json({ user })
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server error')
	}
}