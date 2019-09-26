const { Model } = require('objection')

class Skill extends Model {
	static get tableName() {
		return 'skills'
	}

	static get relationMappings() {
		const User = require('./User')
		const Project = require('./Project')
		
		return {
			has_skills: {
				relation: Model.ManyToManyRelation,
				modelClass: User,
				join: {
					from: 'skills.id',
					through: {
						from: 'has_skills.skill_id',
						to: 'has_skills.user_id',
					},
					to: 'users.id'
				}
			},
			required_skills: {
				relation: Model.ManyToManyRelation,
				modelClass: Project,
				join: {
					from: 'skills.id',
					through: {
						from: 'required_skills.skill_id',
						to: 'required_skills.project_id',
					},
					to: 'projects.id'
				}
			}
		}
	}
}

module.exports = Skill
