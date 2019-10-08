const User = require('../../../../db/models/User')

module.exports = async function getUsersWithRequiredSkillsSortedForProject({ requiredSkillsIds, blockedUsersIdsArr, userId }) {
	const usersWithRequiredSkills = await User.query()
		.select('users.id', 'users.name')
		.joinEager('[has_skills, blocked_members]')
		.modifyEager('has_skills', builder => builder.select('id', 'name'))
		.whereNot('users.id', userId) // Skipping userId (the user hitting this API)
		.whereNotIn('users.id', blockedUsersIdsArr) // Skipping users which are blocked from userId
		.whereIn('has_skills.id', requiredSkillsIds)

	const usersWithRequiredSkillsAndNumberOfMatchedSkills = usersWithRequiredSkills.map(user => {
		const matchedSkills = user.has_skills.length
		return { ...user, matchedSkills }
	})

	const usersWhoDontHaveUserIdBlocked = usersWithRequiredSkillsAndNumberOfMatchedSkills.filter(u => {
		const blockedMembersIds = u.blocked_members.map(u => u.id)
		if (!blockedMembersIds.includes(userId)) return true
	})

	const usersWithRequiredSkillsAndNumberOfMatchedSkillsSorted = usersWhoDontHaveUserIdBlocked.sort((a, b) => {
		return b.matchedSkills - a.matchedSkills
	})

	// Delete banned_members on each user for privacy issues
	usersWithRequiredSkillsAndNumberOfMatchedSkillsSorted.forEach(u => {
		delete u.blocked_members
	})

	return usersWithRequiredSkillsAndNumberOfMatchedSkillsSorted
} 