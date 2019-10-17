
const { Model } = require('objection')

class MarkedCandidate extends Model {
	static get tableName() {
		return 'marked_candidates'
	}

	static get relationMappings() {
		const User = require('./User')
		const Project = require('./Project')

		return {
			user: {
				relation: Model.BelongsToOneRelation,
				modelClass: User,
				join: {
					from: 'users.id',
					to: 'marked_candidates.user_id'
				}
			},
			project: {
				relation: Model.BelongsToOneRelation,
				modelClass: Project,
				join: {
					from: 'projects.id',
					to: 'marked_candidates.project_id'
				}
			},
		}
	}
}

module.exports = MarkedCandidate