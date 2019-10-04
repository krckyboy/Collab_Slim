const Project = require('../../../db/models/Project')
const fetchDataFromKeys = require('../utils/fetchDataFromKeys')
const { validationResult } = require('express-validator/check')
const insertMissingTagsToDb = require('../utils/tags/insertMissingTagsToDb')
const updateCountTag = require('../utils/tags/updateCountTag')
const insertMissingSkillsToDb = require('../utils/skills/insertMissingSkillsToDb')
const updateCountSkills = require('../utils/skills/updateCountSkills')
const validateSkillsAndTags = require('./utils/validateSkillsAndTags')

module.exports = async (req, res) => {
	const errors = validationResult(req)

	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() })
	}

	let { skills } = req.body
	let { tags } = req.body

	const projectFields = ['name', 'description', 'url']
	const projectObject = fetchDataFromKeys(projectFields, req)

	const { skills: skillsArray, tags: tagsArray } = validateSkillsAndTags({ skills, tags, res })
	try {
		const existingProjectsOfUser = await Project.query().where({ owner_id: req.user.id })
		const duplicateProject = existingProjectsOfUser.find(project => project.name === projectObject.name)

		if (duplicateProject) {
			return res.status(400).json({ msg: 'You already have a project under that name!' })
		}

		const skillsWithIds = await insertMissingSkillsToDb(skillsArray)
		const tagsWithIds = await insertMissingTagsToDb(tagsArray)

		const graphData = {
			...projectObject, // Key value pairs such as: name, description, url
			owner_id: req.user.id,
			required_skills: skillsWithIds,
			has_tags: tagsWithIds
		}

		const options = {
			relate: ['required_skills', 'has_tags'],
			unrelate: ['required_skills', 'has_tags']
		}

		const newProject = await Project.query().upsertGraphAndFetch(graphData, options)

		const skillsWithCountUpdated = await updateCountSkills({ skillsWithIds: [...skillsWithIds], type: 'required_skills' })
		const tagsWithCountUpdated = await updateCountTag({ tagsWithIds: [...tagsWithIds] })

		newProject.has_tags = tagsWithCountUpdated
		newProject.required_skills = skillsWithCountUpdated

		res.status(201).json({ newProject })
		// @todo images
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}