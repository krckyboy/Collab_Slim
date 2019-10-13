const Notification = require('../../../db/models/Notification')

module.exports = async (req, res) => {
	try {
		const notifications = await Notification
			.query()
			.select('id', 'created_at', 'seen')
			.where({ user_to_notify: req.user.id })
			.eager('event')
			.orderBy('created_at', 'desc')

		res.json({ notifications })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}