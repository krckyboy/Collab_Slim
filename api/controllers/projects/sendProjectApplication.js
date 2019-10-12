const Project = require('../../../db/models/Project')
const ProjectApplication = require('../../../db/models/ProjectApplication')
const createEvent = require('../utils/events/createAnEvent')
const checkIfBlocked = require('../users/utils/checkIfBlocked')

module.exports = async (req, res) => {
	try {
		const projectId = parseInt(req.params.project_id)
		const userId = parseInt(req.user.id)
		const message = String(req.body.message)
		const email = String(req.body.email)

		const project = await Project.query().findById(projectId).joinEager('[projectApplications, owner.[blocked_members]]')
		const { projectApplications } = project

		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		if (await checkIfBlocked(userId, req.user.id) || await checkIfBlocked(req.user.id, userId)) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		// Check if owner
		if (project.owner_id === userId) {
			return res.status(400).json({ msg: 'You\'re the owner of this project!' })
		}

		// Check if already sent project application
		const existingJoinRequest = await ProjectApplication.query()
			.where({
				user_id: userId,
				project_id: projectId
			}).first()

		if (existingJoinRequest) {
			return res.status(400).json({ msg: 'You\'ve already sent request to join!' })
		}

		// Check if archived
		if (project.archived) {
			return res.status(400).json({ msg: 'The project is archived!' })
		}

		// Create a project application
		const projectApplication = await project.$relatedQuery('projectApplications').insert({
			user_id: userId,
			message,
			email,
		})

		// Add event 
		const event = await createEvent({ specificEvent: projectApplication, type: 'project_application_sent', userId, projectId: project.id })

		// Create a notification with event for project owner

		return res.json({ projectApplication }) // Maybe the number of members and projectId?
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}