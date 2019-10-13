
const { Model } = require('objection')

class PotentialCandidate extends Model {
	static get tableName() {
		return 'potential_candidates'
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
					to: 'potential_candidates.user_id'
				}
			},
			project: {
				relation: Model.BelongsToOneRelation,
				modelClass: Project,
				join: {
					from: 'projects.id',
					to: 'potential_candidates.project_id'
				}
			},
		}
	}
}

module.exports = PotentialCandidate