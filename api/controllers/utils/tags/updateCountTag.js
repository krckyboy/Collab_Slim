const Tag = require('../../../../db/models/Tag')
const getUniqueArrayObjectsByProp = require('../getUniqueArrayObjectsByProp')

async function promiseReturnItem(item) {
	return new Promise((resolve) => {
		resolve(item)
	})
}

module.exports = async function updateCountTag({ tagsWithIds }) {
	if (tagsWithIds && tagsWithIds.length > 0) {
		const uniqueTagsWithIds = getUniqueArrayObjectsByProp(tagsWithIds, 'id')

		const tagPromise = Promise.all(
			uniqueTagsWithIds.map(async (tag) => {
				const count = await Tag.query()
					.count('*')
					.join('has_tags', 'has_tags.tag_id', 'tags.id')
					.join('projects', 'projects.id', 'has_tags.project_id')
					.where('projects.archived', '=', false)
					.where('has_tags.tag_id', '=', tag.id)

				return await tag.$query().updateAndFetch({ count: count[0].count }).where({ id: tag.id })
			})
		)

		const awaited = await tagPromise
		const filtered = awaited.filter(tag => tag)
		return filtered
	} else {
		return []
	}
}