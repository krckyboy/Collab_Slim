const User = require('../../../db/models/User')
const checkedIfBlocked = require('../users/utils/checkIfBlocked')

module.exports = async (req, res) => {
	try {
		const { user_id } = req.params
		const user_id_number = parseInt(user_id)

		if (isNaN(user_id_number)) {
			return res.status(404).json({ msg: 'User does not exist.' })
		}

		const user = await User.query().select('id', 'name', 'bio', 'location', 'website', 'github').findById(user_id_number)
			.eager('[skills, blockedMembers]')

		if (!user) {
			return res.status(404).json({ msg: 'User does not exist.' })
		}

		if (await checkedIfBlocked(user_id_number, req.user.id) || await checkedIfBlocked(req.user.id, user_id_number)) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		// don't include blocked members
		delete user.blockedMembers

		res.status(200).json({ user })
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server error')
	}
}