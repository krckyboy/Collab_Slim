const { Model } = require('objection')

class User extends Model {
	static get tableName() {
		return 'users'
	}

	static get relationMappings() {
		const Authentication = require('./Authentication')
		const Project = require('./Project')
		const Skill = require('./Skill')
		const Notification = require('./Notification')

		return {
			authentication: {
				relation: Model.HasOneRelation,
				modelClass: Authentication,
				join: {
					from: 'users.id',
					to: 'authentication.user_id'
				}
			},
			projects: {
				relation: Model.HasManyRelation,
				modelClass: Project,
				join: {
					from: 'users.id',
					to: 'projects.owner_id'
				}
			},
			blockedMembers: {
				relation: Model.ManyToManyRelation,
				modelClass: User,
				join: {
					from: 'users.id',
					through: {
						from: 'blocked_members.user_id',
						to: 'blocked_members.target_id'
					},
					to: 'users.id'
				}
			},
			notifications: {
				relation: Model.HasManyRelation,
				modelClass: Notification,
				join: {
					from: 'users.id',
					to: 'notifications.user_to_notify'
				}
			},
			skills: {
				relation: Model.ManyToManyRelation,
				modelClass: Skill,
				join: {
					from: 'users.id',
					through: {
						from: 'has_skills.user_id',
						to: 'has_skills.skill_id'
					},
					to: 'skills.id'
				}
			}
		}
	}
}

module.exports = User
