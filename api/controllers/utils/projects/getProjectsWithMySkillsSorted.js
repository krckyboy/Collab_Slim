const Project = require('../../../../db/models/Project')
const User = require('../../../../db/models/User')

module.exports = async function getProjectsWithMySkillsSorted({ arrayOfSkills, userId, blockedUsersIdsArr, start, end }) {
	const requiredSkillsSubquery = Project.relatedQuery('skills').whereIn('required_skills.skill_id', arrayOfSkills)

	const projectsWithSkills = await Project.query()
		.select('projects.id', 'projects.name', 'projects.owner_id')
		.eager('[owner, skills, has_tags]')
		.modifyEager('skills', builder => builder.select('skills.id', 'skills.name').whereIn('skills.id', arrayOfSkills)) // Populating only the matched skills
		.modifyEager('owner', builder => builder.select('id', 'name'))
		.whereExists(requiredSkillsSubquery.clone()) // Only taking into account projects who have at least 1 matched skill
		.whereNotIn('projects.owner_id', User.query().select('users.id').joinRelation('blockedMembers').where('target_id', userId)) // Skipping projects whose owners have userId blocked 
		.whereNot('projects.owner_id', userId) // Skipping projects which userId owns
		.whereNotIn('projects.owner_id', blockedUsersIdsArr) // Skipping projects where the owner is blocked from userId
		.whereNot('projects.archived', true)
		.orderByRaw('(?) DESC', requiredSkillsSubquery.clone().count())
		.range(start, end)

	const projectsWithSkillsAndNumberOfMatchedSkills = projectsWithSkills.results.map(project => {
		const matchedSkills = project.skills.length
		return { ...project, matchedSkills }
	})

	const projects = {
		results: projectsWithSkillsAndNumberOfMatchedSkills,
		total: projectsWithSkills.total
	}

	return projects
}