const { Model } = require('objection')

class Notification extends Model {
	static get tableName() {
		return 'notifications'
	}

	static get relationMappings() {
		const Event = require('./Event')

		return {
			event: {
				relation: Model.BelongsToOneRelation,
				modelClass: Event,
				join: {
					from: 'events.id',
					to: 'notifications.event_id'
				}
			}
		}
	}
}

module.exports = Notification
