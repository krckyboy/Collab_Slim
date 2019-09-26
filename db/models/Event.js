const { Model } = require('objection')

class Event extends Model {
	static get tableName() {
		return 'events'
	}

	static get relationMappings() {
		const Notification = require('./Notification')
		const User = require('./User')
		const Project = require('./Project')

		return {
			notifications: {
				relation: Model.HasManyRelation,
				modelClass: Notification,
				join: {
					from: 'events.id',
					to: 'notifications.event_id'
				}
			},
			triggering_user: {
				relation: Model.BelongsToOneRelation,
				modelClass: User,
				join: {
					from: 'users.id',
					to: 'events.triggering_user_id'
				}
			},
			project: {
				relation: Model.BelongsToOneRelation,
				modelClass: Project,
				join: {
					from: 'projects.id',
					to: 'events.project_id'
				}
			},
		}
	}
}

module.exports = Event
