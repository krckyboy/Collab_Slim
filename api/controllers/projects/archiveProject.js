const Project = require('../../../db/models/Project')
const createEvent = require('../utils/events/createAnEvent')
const createNotificationForProjectMembers = require('./utils/createNotificationForProjectMembers')

module.exports = async (req, res) => {
	try {
		const projectId = parseInt(req.params.project_id)

		if (isNaN(projectId)) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		const project = await Project.query().findById(projectId).eager('project_members')

		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// Check if logged user is the project owner
		if (project.owner_id !== req.user.id) {
			return res.status(401).json({ msg: 'You are not authorized to do that!' })
		}

		// Check if already archived
		if (project.archived) {
			return res.status(400).json({ msg: 'Project already archived!' })
		}

		await project.$query().update({
			archived: true
		})

		// Create an event for finalizing
		const event = await createEvent({ type: 'project_archived', userId: req.user.id, projectId: project.id })

		// Also notify all members
		await createNotificationForProjectMembers({
			event,
			projectOwnerId: project.owner_id,
			projectMembers: project.project_members,
			skipNotificationForUserId: req.user.id
		})

		project.archived = true

		return res.json(project)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}
