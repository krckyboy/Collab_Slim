const User = require('../../../../db/models/User')

// Returns true if user has blocked targetId, otherwise false
module.exports = async (userId, targetId) => {
	const user = await User.query().findById(userId).eager('blocked_members')
	const blockedMembers = user.blocked_members

	// Check if the user has blocked targetId
	if (blockedMembers && blockedMembers.length > 0) {
		if (blockedMembers.map(user => user.id).includes(targetId)) {
			return true
		}
	} else {
		return false
	}
}
