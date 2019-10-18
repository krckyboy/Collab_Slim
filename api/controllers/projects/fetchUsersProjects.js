const User = require('../../../db/models/User')
const Project = require('../../../db/models/Project')
const checkIfBlocked = require('../users/utils/checkIfBlocked')
const validatePagination = require('../utils/validatePagination')

// @todo try to add query params for finalized, archived, etc.
module.exports = async (req, res) => {
	try {
		const userId = parseInt(req.params.user_id)
		const type = req.query.type

		let start = parseInt(req.query.start)
		let end = parseInt(req.query.end)

		let projects

		if (!validatePagination({ start, end })) {
			start = 0
			end = 10
		}

		if (await checkIfBlocked(userId, req.user.id) || await checkIfBlocked(req.user.id, userId)) {
			return res.status(403).send()
		}

		const user = await User.query().select('id').findById(userId)

		if (!user) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		if (type === 'archived') {
			projects = await Project.query()
				.eager('skills')
				.where('owner_id', userId)
				.where({ archived: true })
				.range(start, end)
				.orderBy('created_at', 'desc')
		} else {
			// By default, it fetches projects that he's the owner of
			projects = await Project.query()
				.eager('skills')
				.where('owner_id', userId)
				.whereNot({ archived: true })
				.orderBy('created_at', 'desc')
				.range(start, end)
		}

		return res.json({ projects: projects.results })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
