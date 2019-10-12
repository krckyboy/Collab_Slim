const Project = require('../../../db/models/Project')
const fetchDataFromKeys = require('../utils/fetchDataFromKeys')
const { validationResult } = require('express-validator/check')
const insertMissingTagsToDb = require('../utils/tags/insertMissingTagsToDb')
const updateCountTag = require('../utils/tags/updateCountTag')
const insertMissingSkillsToDb = require('../utils/skills/insertMissingSkillsToDb')
const updateCountSkills = require('../utils/skills/updateCountSkills')
const validateSkillsAndTags = require('../utils/validateSkillsAndTags')

module.exports = async (req, res) => {
	const errors = validationResult(req)
	const projectId = req.params.project_id

	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() })
	}

	if (isNaN(projectId)) {
		return res.status(404).json({ msg: 'No project found!' })
	}

	const project = await Project.query().findById(projectId).eager('[skills, has_tags]')

	if (project.owner_id !== req.user.id) {
		return res.status(401).json({ msg: 'You are not authorized to do that!' })
	}

	if (!project) {
		return res.status(404).json({ msg: 'No project found!' })
	}

	let { skills } = req.body
	let { tags } = req.body

	const projectFields = ['name', 'description', 'url', 'remote', 'location', 'paid']
	const projectObject = fetchDataFromKeys(projectFields, req)

	const { skills: skillsArray, tags: tagsArray, err } = validateSkillsAndTags({ skills, tags, res })

	if (err) {
		return res.status(400).json({ msg: 'Invalid data.' })
	}
	try {
		const existingProjectsOfUser = await Project.query().where({ owner_id: req.user.id })
		const duplicateProject = existingProjectsOfUser.find(project => project.name === projectObject.name)

		if (duplicateProject && duplicateProject.id !== project.id) {
			return res.status(400).json({ msg: 'You already have a project under that name!' })
		}

		const skillsWithIds = await insertMissingSkillsToDb(skillsArray)
		const tagsWithIds = await insertMissingTagsToDb(tagsArray)

		const graphData = {
			...projectObject, // Key value pairs such as: name, description, url
			owner_id: req.user.id,
			skills: skillsWithIds,
			has_tags: tagsWithIds,
			id: project.id
		}

		const options = {
			relate: ['skills', 'has_tags'],
			unrelate: ['skills', 'has_tags']
		}

		const updatedProject = await Project.query().upsertGraphAndFetch(graphData, options)

		const oldSkillsOnProject = project.skills
		const oldTagsOnProject = project.has_tags

		await updateCountSkills({ skillsWithIds: [...oldSkillsOnProject], type: 'required_skills' })
		await updateCountTag({ tagsWithIds: [...oldTagsOnProject] })

		const skillsWithCountUpdated = await updateCountSkills({ skillsWithIds: [...skillsWithIds], type: 'required_skills' })
		const tagsWithCountUpdated = await updateCountTag({ tagsWithIds: [...tagsWithIds] })

		updatedProject.has_tags = tagsWithCountUpdated
		updatedProject.skills = skillsWithCountUpdated

		res.status(200).json({ updatedProject })
		// @todo images
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}