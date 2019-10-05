const Project = require('../../../db/models/Project')
const createEvent = require('../utils/events/createAnEvent')
const updateCountTag = require('../utils/tags/updateCountTag')
const updateCountSkills = require('../utils/skills/updateCountSkills')

module.exports = async (req, res) => {
	try {
		const projectId = parseInt(req.params.project_id)

		if (isNaN(projectId)) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		const project = await Project.query().findById(projectId).eager('[required_skills, has_tags]')

		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// Check if logged user is the project owner
		if (project.owner_id !== req.user.id) {
			return res.status(401).json({ msg: 'You are not authorized to do that!' })
		}

		// Check if not archived
		if (!project.archived) {
			return res.status(400).json({ msg: 'Project is not archived in the first place!' })
		}

		await project.$query().update({
			archived: false
		})

		// Update skill count
		await updateCountSkills({ skillsWithIds: [...project.required_skills], type: 'required_skills' })

		// Update tag count
		await updateCountTag({ tagsWithIds: [...project.has_tags] })

		// Create an event for archiving
		await createEvent({ type: 'project_unarchived', userId: req.user.id, projectId: project.id })

		project.archived = false

		return res.json({ project })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
