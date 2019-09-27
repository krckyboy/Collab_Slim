const Notification = require('../../../db/models/Notification')

module.exports = async (req, res) => {
	try {
		const notifications = await Notification
			.query()
			.select('id', 'created_at', 'seen')
			.where({ user_to_notify: req.user.id })
			.eager('event')
			.modifyEager('event',
				builder => builder.select('type', 'id as event_id', 'project_id', 'triggering_user_id', 'project_event', 'specific_event_id', 'target_user_id' ))
			.orderBy('created_at', 'desc')

		// @todo Transform user_blocked notifications into user_removed / user_left from project for easier handling on front-end

		// Fetch the exact stuff depending on type, write a function

		const sortedNotifications = notifications.map(el => {
			const type = el.event.type
			const objEvent = {}

			for (let key in el.event) {
				if (el.event[key]) {
					if (key === type) {
						objEvent[key] = {
							...el.event[key]
						}
					}
					objEvent[key] = el.event[key]
				}
			}

			const obj = {
				id: el.id,
				created_at: el.created_at,
				seen: el.seen,
				type: el.event.type,
				...objEvent
			}

			return obj
		})

		res.json(sortedNotifications)
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}