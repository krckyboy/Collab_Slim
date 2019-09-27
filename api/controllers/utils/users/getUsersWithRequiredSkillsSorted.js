const User = require('../../../../db/models/User')

module.exports = async function getUsersWithRequiredSkillsSortedForProject(arrayOfRequiredSkillsIds) {
	const usersWithRequiredSkills = await User.query()
		.select('users.id as user_id',
			'users.name as user_name',
		)
		.joinEager('has_skills')
		.modifyEager('has_skills', builder => builder.select('id as skill_id', 'name as skill_name'))
		.whereIn('has_skills.id', arrayOfRequiredSkillsIds)

	const usersWithRequiredSkillsAndNumberOfMatchedSkills = usersWithRequiredSkills.map(user => {
		const matchedSkills = user.has_skills.length
		return { ...user, matchedSkills }
	})

	const usersWithRequiredSkillsAndNumberOfMatchedSkillsSorted = usersWithRequiredSkillsAndNumberOfMatchedSkills.sort((a, b) => {
		return b.matchedSkills - a.matchedSkills
	})

	return usersWithRequiredSkillsAndNumberOfMatchedSkillsSorted
}