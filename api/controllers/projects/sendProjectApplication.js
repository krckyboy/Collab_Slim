const Project = require('../../../db/models/Project')
const createEvent = require('../utils/events/createAnEvent')
const checkIfBlocked = require('../users/utils/checkIfBlocked')
const { validationResult } = require('express-validator/check')

module.exports = async (req, res) => {
	try {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const projectId = parseInt(req.params.project_id)
		const userId = req.user.id
		const message = String(req.body.message)
		const email = String(req.body.email)

		const project = await Project.query().findById(projectId).joinEager('[projectApplications]')
		const { projectApplications, owner_id: ownerId } = project

		// If project doesn't exist
		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// Check if archived
		if (project.archived) {
			return res.status(400).json({ msg: 'The project is archived!' })
		}

		// Check if blocked in both ways
		if (await checkIfBlocked(userId, ownerId) || await checkIfBlocked(ownerId, userId)) {
			return res.status(403).send()
		}

		// Check if owner
		if (ownerId === userId) {
			return res.status(400).json({ msg: 'You\'re the owner of this project!' })
		}

		// Check if already sent project application
		const existingApplication = projectApplications.find(application => application.user_id === userId)

		if (existingApplication) {
			return res.status(400).json({ msg: 'You\'ve already sent request to join!' })
		}

		// Create a project application
		const projectApplication = await project.$relatedQuery('projectApplications').insert({
			user_id: userId,
			message,
			email,
			status: 'sent'
		})

		// Create an event
		const event = await createEvent({
			specificEvent: projectApplication,
			type: 'project_application_sent',
			targetUserId: ownerId,
			triggeringUserId: userId,
			projectId: project.id
		})

		// Create a notification with event for project owner
		await event.$relatedQuery('notifications').insert({
			user_to_notify: ownerId
		})

		return res.status(201).json({ projectApplication })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}