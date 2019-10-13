/* eslint-disable indent */
const Event = require('../../../../db/models/Event')

// Creating an event inside events table for better structure by passing one of the events
// such as project_invitation, join_project_request, etc.

// Keep in mind that you should eager the event for views, especially if the project owner sent invitation, for example
// and then the user accepted. "Jimmy has accepted your project invitation."
module.exports = async function ({ type, projectId, targetUserId, triggeringUserId, specificEvent }) {
	// Type can't be just project_invitation due to different statuses
	switch (type) {
		case 'user_blocked':
		case 'user_unblocked':
			return await Event.query().insert({
				type,
				triggering_user_id: triggeringUserId,
				target_user_id: targetUserId,
			})
		case 'project_archived':
		case 'project_unarchived':
			return await Event.query().insert({
				type,
				triggering_user_id: triggeringUserId,
				project_id: projectId,
			})
		case 'project_application_sent':
		case 'potential_candidate_marked':
			return await Event.query().insert({
				specific_event_id: specificEvent.id,
				type,
				triggering_user_id: triggeringUserId,
				target_user_id: targetUserId,
				project_id: projectId,
			})
		default:
			return null
	}
}