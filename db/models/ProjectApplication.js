
const { Model } = require('objection')

class ProjectApplication extends Model {
	static get tableName() {
		return 'project_applications'
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
					to: 'project_applications.user_id'
				}
			},
			project: {
				relation: Model.BelongsToOneRelation,
				modelClass: Project,
				join: {
					from: 'projects.id',
					to: 'project_applications.project_id'
				}
			},
		}
	}
}

module.exports = ProjectApplication