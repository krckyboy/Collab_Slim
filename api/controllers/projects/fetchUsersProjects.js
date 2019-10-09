const User = require('../../../db/models/User')
const checkIfBlocked = require('../users/utils/checkIfBlocked')

// @todo try to add query params for finalized, archived, etc.
module.exports = async (req, res) => {
	try {
		const userId = parseInt(req.params.user_id)
		const type = req.query.type
		let user

		if (await checkIfBlocked(userId, req.user.id) || await checkIfBlocked(req.user.id, userId)) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		// Figure out query strings type
		if (type === 'archived') {
			user = await User
				.query()
				.findById(userId)
				.eager('projects')
				.modifyEager('projects',
					builder => builder.where({ archived: true }))
		} else {
			// By default, it fetches projects that he's the owner of
			user = await User
				.query()
				.findById(userId)
				.eager('projects')
				.modifyEager('projects',
					builder => builder.where({ archived: false }))
		}

		if (!user) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		return res.json({ projects: user.projects })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
