const Notification = require('../../../db/models/Notification')
const validatePagination = require('../utils/validatePagination')

module.exports = async (req, res) => {
	try {
		let start = parseInt(req.query.start)
		let end = parseInt(req.query.end)

		if (!validatePagination({ start, end })) {
			start = 0
			end = 10
		}

		const notifications = await Notification
			.query()
			.select('id', 'created_at', 'seen')
			.where({ user_to_notify: req.user.id })
			.eager('event')
			.range(start, end)
			.orderBy('created_at', 'desc')

		res.json({ notifications })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}