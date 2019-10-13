const Project = require('../../../db/models/Project')
const User = require('../../../db/models/User')
const createEvent = require('../utils/events/createAnEvent')
const checkIfBlocked = require('../users/utils/checkIfBlocked')

module.exports = async (req, res) => {
	try {
		const projectId = parseInt(req.params.project_id)
		const userId = parseInt(req.params.user_id)

		const project = await Project.query().findById(projectId).joinEager('[potentialCandidates, projectApplications]')
		const { potentialCandidates, owner_id: ownerId, projectApplications } = project

		// If project doesn't exist
		if (!project) {
			return res.status(404).json({ msg: 'No project found!' })
		}

		// Check if archived
		if (project.archived) {
			return res.status(400).json({ msg: 'The project is archived!' })
		}

		// Check if owner
		if (ownerId !== req.user.id) {
			return res.status(400).json({ msg: 'You are not the owner of this project!' })
		}

		// Check if user has sent the application
		const existingApplication = projectApplications.find(application => application.user_id === userId)

		if (existingApplication) {
			return res.status(400).json({ msg: 'User has already sent his project application!', existingApplicationId: existingApplication.id })
		}

		const user = await User.query().findById(userId)

		// If user doesn't exist
		if (!user) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		// Check if blocked in both ways
		if (await checkIfBlocked(req.user.id, userId) || await checkIfBlocked(userId, req.user.id)) {
			return res.status(404).json({ msg: 'No user found!' })
		}

		// Check if already marked as potential candidate
		const existingPotentialCandidate = potentialCandidates.find(potentialCandidate => potentialCandidate.user_id === userId)

		if (existingPotentialCandidate) {
			return res.status(400).json({ msg: 'You\'ve already sent request to join!' })
		}

		// Create a project application
		const potentialCandidate = await project.$relatedQuery('potentialCandidates').insert({
			user_id: req.user.id,
		})

		// Create an event
		const event = await createEvent({
			specificEvent: potentialCandidate,
			type: 'potential_candidate_marked',
			targetUserId: userId,
			triggeringUserId: req.user.id,
			projectId: project.id
		})

		// Create a notification with event for project owner
		await event.$relatedQuery('notifications').insert({
			user_to_notify: ownerId
		})

		return res.status(201).json({ potentialCandidate })
	} catch (err) {
		console.error(err)
		res.status(500).send('Server error')
	}
}