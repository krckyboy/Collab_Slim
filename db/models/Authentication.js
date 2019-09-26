const { Model } = require('objection')

class Authentication extends Model {
	static get tableName() {
		return 'authentication'
	}

	static get relationMappings() {
		const User = require('./User')
		
		return {
			user: {
				relation: Model.BelongsToOneRelation,
				modelClass: User,
				join: {
					from: 'users.id',
					to: 'authentication.user_id'
				}
			}
		}
	}
}

module.exports = Authentication
