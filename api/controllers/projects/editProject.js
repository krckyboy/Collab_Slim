const Project = require('../../../db/models/Project')
const fetchDataFromKeys = require('../utils/fetchDataFromKeys')
const { validationResult } = require('express-validator/check')
const insertMissingTagsToDb = require('../utils/tags/insertMissingTagsToDb')
const updateCountTag = require('../utils/tags/updateCountTag')
const insertMissingSkillsToDb = require('../utils/skills/insertMissingSkillsToDb')
const updateCountSkills = require('../utils/skills/updateCountSkills')

module.exports = async (req, res) => {
	const errors = validationResult(req)
	const projectId = req.params.project_id

	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() })
	}

	if (isNaN(projectId)) {
		return res.status(404).json({ msg: 'No project found!' })
	}

	const project = await Project.query().findById(projectId).eager('[required_skills, has_tags]')

	if (project.owner_id !== req.user.id) {
		return res.status(401).json({ msg: 'You are not authorized to do that!' })
	}

	if (!project) {
		return res.status(404).json({ msg: 'No project found!' })
	}

	const projectFields = ['name', 'description', 'accepting_members']
	const { skills } = req.body
	const { tags } = req.body
	
	const projectObject = fetchDataFromKeys(projectFields, req)

	const skillsArray = filterArrayStrings(skills)
	const tagsArray = filterArrayStrings(tags)
	try {
		const skillsWithIds = await insertMissingSkillsToDb(skillsArray)
		const tagsWithIds = await insertMissingTagsToDb(tagsArray)

		const graphData = {
			...projectObject, // Key value pairs such as: bio, location, website, etc.
			owner_id: req.user.id,
			required_skills: skillsWithIds,
			has_tags: tagsWithIds,
			id: project.id
		}

		const options = {
			relate: ['required_skills', 'has_tags'],
			unrelate: ['required_skills', 'has_tags']
		}

		const newProject = await Project.query().upsertGraphAndFetch(graphData, options)

		const oldSkillsOnProject = project.required_skills
		const oldTags = project.has_tags

		await updateCountSkills({ skillsWithIds: [...oldSkillsOnProject], type: 'required_skills' })
		await updateCountTag({ tagsWithIds: [...oldTags] })
		const newSkillsWithCountUpdated = await updateCountSkills({ skillsWithIds: [...skillsWithIds], type: 'required_skills' })
		const newTagsWithCountUpdated = await updateCountTag({ tagsWithIds: [...tagsWithIds] })

		newProject.has_tags = newTagsWithCountUpdated
		newProject.required_skills = newSkillsWithCountUpdated

		res.status(200).json(newProject)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}