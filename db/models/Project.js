const { Model } = require('objection')

class Project extends Model {
	static get tableName() {
		return 'projects'
	}

	static get relationMappings() {
		const User = require('./User')
		const Skill = require('./Skill')
		const Tag = require('./Tag')
		const ProjectApplication = require('./ProjectApplication')
		const MarkedCandidate = require('./MarkedCandidate')

		return {
			owner: {
				relation: Model.BelongsToOneRelation,
				modelClass: User,
				join: {
					from: 'projects.owner_id',
					to: 'users.id'
				}
			},
			skills: {
				relation: Model.ManyToManyRelation,
				modelClass: Skill,
				join: {
					from: 'projects.id',
					through: {
						from: 'required_skills.project_id',
						to: 'required_skills.skill_id',
					},
					to: 'skills.id'
				}
			},
			has_tags: {
				relation: Model.ManyToManyRelation,
				modelClass: Tag,
				join: {
					from: 'projects.id',
					through: {
						from: 'has_tags.project_id',
						to: 'has_tags.tag_id',
					},
					to: 'tags.id'
				}
			},
			projectApplications: {
				relation: Model.HasManyRelation,
				modelClass: ProjectApplication,
				join: {
					from: 'projects.id',
					to: 'project_applications.project_id',
					extra: ['message', 'email', 'status'],
				}
			},
			markedCandidates: {
				relation: Model.ManyToManyRelation,
				modelClass: User,
				join: {
					from: 'projects.id',
					through: {
						from: 'marked_candidates.project_id',
						to: 'marked_candidates.user_id',
						extra: ['status']
					},
					to: 'users.id',
				}
			},
		}
	}
}

module.exports = Project
