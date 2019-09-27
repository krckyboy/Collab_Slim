const Tag = require('../../../../db/models/Tag')

module.exports = async function insertMissingTagsToDb(tags) {
	if (tags && tags.length > 0) {
		const existingTags = await Tag.query().whereIn('name', tags)
		const missingTags = tags.filter(skill => !existingTags.find(it => it.name === skill))
		const insertedTags = await Tag.query().insert(missingTags.map(name => ({ name })))
		return [...existingTags, ...insertedTags]
	} else {
		return []
	}
} 