/* eslint-disable indent */
const User = require('../../../db/models/User')
const getProjectsWithMySkillsSorted = require('../utils/projects/getProjectsWithMySkillsSorted')

function getProperQueryParamsFinalizedArchivedAcceptingMembers({ query, defaultValue }) {
	switch (query) {
		case 'true':
			return true
		case 'false':
			return false
		default:
			return defaultValue
	}
}

module.exports = async (req, res) => {
	try {
		const user = await User.query().findById(req.user.id).eager('has_skills')
		const has_skills = user.has_skills

		let finalized = getProperQueryParamsFinalizedArchivedAcceptingMembers({ query: req.query.finalized, defaultValue: false })
		let archived = getProperQueryParamsFinalizedArchivedAcceptingMembers({ query: req.query.archived, defaultValue: false })
		let accepting_members = getProperQueryParamsFinalizedArchivedAcceptingMembers({ query: req.query.accepting_members, defaultValue: true })

		if (!has_skills.length > 0) {
			return res.status(400).json({ msg: 'You need to add skills to your profile first!' })
		}

		const skillsIds = has_skills.map(skill => skill.id)
		// @todo Add query params for what kind of skills to fetch, since getProjectsWithMySkillsSorted supports that
		const projectsWithRequiredSkillsSorted = await getProjectsWithMySkillsSorted({ arrayOfSkills: skillsIds, finalized, archived, accepting_members })

		// Filter out the projects that user is already a member of
		const filteredProjectsWithRequiredSkillsSorted = projectsWithRequiredSkillsSorted.map(project => {
			const projectMembers = project.project_members
			const projectMembersIds = projectMembers.map(user => user.id)
			if (projectMembersIds.length > 0) {
				if (!projectMembersIds.includes(user.id)) {
					return project
				}
			} else {
				return project
			}
		})

		return res.json(filteredProjectsWithRequiredSkillsSorted.filter(project => project))
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
