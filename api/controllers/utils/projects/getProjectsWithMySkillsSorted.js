const Project = require('../../../../db/models/Project')

module.exports = async function getProjectsWithMySkillsSorted({ arrayOfSkills, finalized = false, archived = false, accepting_members = true }) {
	const projectsWithSkills = await Project.query()
		.select('projects.id as project_id',
			'projects.name as project_name')
		.joinEager('[required_skills, project_members]')
		.modifyEager('required_skills', builder => builder.select('id', 'name'))
		.whereIn('required_skills.id', arrayOfSkills)
		.where('projects.finalized', finalized)
		.where('projects.archived', archived)
		.where('projects.accepting_members', accepting_members)

	const projectsWithSkillsAndNumberOfMatchedSkills = projectsWithSkills.map(project => {
		const matchedSkills = project.required_skills.length
		return { ...project, matchedSkills }
	})

	const projectsWithSkillsAndNumberOfMatchedSkillsSorted = projectsWithSkillsAndNumberOfMatchedSkills.sort((a, b) => {
		return b.matchedSkills - a.matchedSkills
	})

	return projectsWithSkillsAndNumberOfMatchedSkillsSorted
}