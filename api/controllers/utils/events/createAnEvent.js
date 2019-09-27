/* eslint-disable indent */
const Event = require('../../../../db/models/Event')

// Creating an event inside events table for better structure by passing one of the events
// such as project_invitation, join_project_request, etc.

// Keep in mind that you should eager the event for views, especially if the project owner sent invitation, for example
// and then the user accepted. "Jimmy has accepted your project invitation."
module.exports = async function ({ specificEvent, type, userId, projectId, targetUserId }) {
	// Type can't be just project_invitation due to different statuses
	switch (type) {
		case 'project_invitation_sent':
		case 'project_owner_invitation_sent':
			return await Event.query().insert({
				specific_event_id: specificEvent.id,
				type,
				triggering_user_id: userId,
				project_id: projectId,
				target_user_id: targetUserId,
			})
		case 'user_blocked':
		case 'user_unblocked':
			return await Event.query().insert({
				type,
				triggering_user_id: userId,
				target_user_id: targetUserId,
			})
		case 'project_owner_invitation_accepted':
		case 'join_request_approved':
		case 'project_invitation_accepted':
		case 'project_member_removed':
			return await Event.query().insert({
				project_event: true,
				type,
				triggering_user_id: userId,
				project_id: projectId,
				target_user_id: targetUserId,
			})
		case 'project_invitation_removed':
		case 'project_invitation_declined':
		case 'project_owner_invitation_removed':
		case 'project_owner_invitation_declined':
			return await Event.query().insert({
				type,
				triggering_user_id: userId,
				project_id: projectId,
				target_user_id: targetUserId,
			})
		case 'join_project_request_sent':
			return await Event.query().insert({
				specific_event_id: specificEvent.id,
				type,
				triggering_user_id: userId,
				project_id: projectId,
			})
		case 'all_project_invitations_removed':
		case 'all_project_owner_invitations_removed':
			return await Event.query().insert({
				type,
				triggering_user_id: userId,
				project_id: projectId,
			})
		case 'project_finalized':
		case 'project_archived':
		case 'project_unarchived':
		case 'project_member_left':
			return await Event.query().insert({
				project_event: true,
				type,
				triggering_user_id: userId,
				project_id: projectId,
			})
		default:
			return null
	}
}