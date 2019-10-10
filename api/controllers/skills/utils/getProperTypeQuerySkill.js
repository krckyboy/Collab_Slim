/* eslint-disable indent */
// For security and to prevent big loads.
module.exports = function getProperTypeQuerySkill(query) {
	switch (query) {
		case 'in_demand':
			return 'required_skills_count'
		case 'popular':
			return 'has_skills_count'
		default:
			return null
	}
}