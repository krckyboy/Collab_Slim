const Project = require('../../../../db/models/Project')

module.exports = async function getProjectsWithMySkillsSorted({ arrayOfSkills, userId, blockedUsersIdsArr }) {
	const projectsWithSkills = await Project.query()
		.joinEager('[required_skills, owner.[blocked_members]]')
		.modifyEager('required_skills', builder => builder.select('id', 'name'))
		.modifyEager('owner', builder => builder.select('id', 'name'))
		// .whereNot('owner:blocked_members_join.target_id', userId)
		.whereNot('projects.owner_id', userId) // Skipping projects which userId owns
		.whereNotIn('projects.owner_id', blockedUsersIdsArr) // Skipping projects where the owner is blocked from userId
		.whereIn('required_skills.id', arrayOfSkills)
		.whereNot('projects.archived', true)

	const projectsWithSkillsAndNumberOfMatchedSkills = projectsWithSkills.map(project => {
		const matchedSkills = project.required_skills.length
		return { ...project, matchedSkills }
	})

	const projectsWhereUserIdIsntBlocked = projectsWithSkillsAndNumberOfMatchedSkills.filter(p => {
		const blockedMembersIds = p.owner.blocked_members.map(u => u.id)
		if (!blockedMembersIds.includes(userId)) return true
	})

	const projectsWithSkillsAndNumberOfMatchedSkillsSorted = projectsWhereUserIdIsntBlocked.sort((a, b) => {
		return b.matchedSkills - a.matchedSkills
	})

	// Delete banned_members on each project.owner for privacy issues
	projectsWithSkillsAndNumberOfMatchedSkillsSorted.forEach(p => {
		delete p.owner.blocked_members
	})

	return projectsWithSkillsAndNumberOfMatchedSkillsSorted
}