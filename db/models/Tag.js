const { Model } = require('objection')

class Tag extends Model {
	static get tableName() {
		return 'tags'
	}

	static get relationMappings() {
		const Project = require('./Project')
		
		return {
			has_tags: {
				relation: Model.ManyToManyRelation,
				modelClass: Project,
				join: {
					from: 'tags.id',
					through: {
						from: 'has_tags.tag_id',
						to: 'has_tags.project_id',
					},
					to: 'projects.id'
				}
			}
		}
	}
}

module.exports = Tag
