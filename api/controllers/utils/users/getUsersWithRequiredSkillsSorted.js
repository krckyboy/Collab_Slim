const User = require('../../../../db/models/User')

// So for has_skills, it returns only skills that are matched for the project, not other skills that he has.
module.exports = async function getUsersWithRequiredSkillsSortedForProject({ skillIds, blockedUsersIdsArr, userId, start, end }) {
	// Note that the query here isn't `await`ed. We don't execute this query. It will
	// be compiled as a part of the parent query.
	const hasSkillsSubquery = User.relatedQuery('skills').whereIn('has_skills.skill_id', skillIds)
	const blockedUserIdSubquery = User.relatedQuery('blockedMembers').where('blocked_members.target_id', userId)

	const users = await User.query()
		.select('users.id', 'users.name')
		.eager('skills')
		.modifyEager('skills', builder => builder.select('skills.id', 'skills.name').whereIn('skills.id', skillIds)) // Populating the matched skills
		.whereExists(hasSkillsSubquery.clone()) // Only taking into account users who have passed skills
		.whereNotExists(blockedUserIdSubquery.clone()) // Skipping users who blocked userId
		.whereNot('users.id', userId) // Skipping userId (the user hitting this API)
		.whereNotIn('users.id', blockedUsersIdsArr) // Skipping users which are blocked from userId
		.orderByRaw('(?) DESC', hasSkillsSubquery.clone().count())
		.range(start, end)

	// Manually adding the number of matched skills
	const usersWithCount = users.results.map(user => {
		const matchedSkills = user.skills.length
		return { ...user, matchedSkills }
	})

	return usersWithCount
}
