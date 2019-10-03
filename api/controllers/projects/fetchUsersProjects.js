const User = require('../../../db/models/User')

// @todo try to add query params for finalized, archived, etc.
module.exports = async (req, res) => {
	try {
		const userId = parseInt(req.params.user_id)
		const type = req.query.type
		let user, projects

		// Figure out query strings type
		if (type === 'finalized') {
			user = await User
				.query()
				.findById(userId)
				.eager('projects')
				.modifyEager('projects',
					builder => builder.where({ finalized: true }))
		} else if (type === 'archived') {
			user = await User
				.query()
				.findById(userId)
				.eager('projects')
				.modifyEager('projects',
					builder => builder.where({ archived: true }))
		} else if (type === 'all') {
			// Both the projects that he owns and that he's a member of
			user = await User
				.query()
				.findById(userId)
				.eager('[projects, projects_user_is_a_member_of]')
				.modifyEager('projects',
					builder => builder.where({ finalized: false, archived: false }))
		} else {
			// By default, it fetches projects that he's the owner of
			user = await User
				.query()
				.findById(userId)
				.eager('projects')
				.modifyEager('projects',
					builder => builder.where({ finalized: false, archived: false }))
		}

		if (!user) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		projects = user.projects

		if (user.projects_user_is_a_member_of && user.projects_user_is_a_member_of.length > 0) {
			projects = [...projects, user.projects_user_is_a_member_of]
		}

		return res.json(projects)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
