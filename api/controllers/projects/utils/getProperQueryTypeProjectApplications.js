/* eslint-disable indent */
// For security and to prevent big loads.
module.exports = function getProperTypeQuerySkill(query) {
	switch (query) {
		case 'sent':
			return 'sent'
		case 'archived':
			return 'archived'
		case 'read':
			return 'read'
		default:
			return null
	}
}