const request = require('supertest')
const app = require('../app')
const jwtDecode = require('jwt-decode')

const userOne = {
	name: 'userone',
	email: 'userone@gmail.com',
	password: 'password',
	token: '',
	id: ''
}

const userTwo = {
	name: 'usertwo',
	email: 'usertwo@gmail.com',
	password: 'password',
	token: '',
	id: ''
}

const userThree = {
	name: 'userthree',
	email: 'userthree@gmail.com',
	password: 'password',
	token: '',
	id: ''
}

const userFour = {
	name: 'userfour',
	email: 'userfour@gmail.com',
	password: 'password',
	token: '',
	id: ''
}

const userFive = {
	name: 'userfive',
	email: 'userfive@gmail.com',
	password: 'password',
	token: '',
	id: ''
}

const userSix = {
	name: 'usersix',
	email: 'usersix@gmail.com',
	password: 'password',
	token: '',
	id: ''
}

const userSeven = {
	name: 'userseven',
	email: 'userseven@gmail.com',
	password: 'password',
	token: '',
	id: ''
}

const userEight = {
	name: 'usereight',
	email: 'usereight@gmail.com',
	password: 'password',
	token: '',
	id: ''
}

const initialProfileValuesUserOne = {
	location: 'user_one_location',
	website: 'www.user_one.com',
	bio: 'user_one biography.',
	github: 'user_one_github',

}
const initialProfileValuesUserTwo = {
	location: 'user_two_location',
	website: 'www.user_two.com',
	bio: 'user_two biography.',
	github: 'user_two_github',
}

const initialProfileValuesUserThree = {
	location: 'user_three_location',
	website: 'www.user_three.com',
	bio: 'user_three biography.',
	github: 'user_three_github',
}

const initialProfileValuesUserFour = {
	location: 'user_four_location',
	website: 'www.user_four.com',
	bio: 'user_four biography.',
	github: 'user_four_github',
}

const projectUserOne1 = {
	name: 'user_one_project',
	description: 'user_one_project_description',
	url: 'www.user_one_project.com',
	paid: true,
	location: 'Houston, Texas',
	remote: true
}

const projectUserOne2 = {
	name: 'user_one_project_2',
	description: 'user_one_project_description_2',
	url: 'www.user_one_project_2.com'
}

const projectUserTwo1 = {
	name: 'user_two_project',
	description: 'user_two_project_description',
	url: 'www.user_two_project.com'
}

const projectUserTwo2 = {
	name: 'user_two_project_2',
	description: 'user_two_project_description_2',
	url: 'www.user_two_project_2.com'
}

const projectUserThree1 = {
	name: 'user_three_project',
	description: 'user_three_project_description',
	url: 'www.user_three_project.com'
}

const projectUserThree2 = {
	name: 'user_three_project_2',
	description: 'user_three_project_description_2',
	url: 'www.user_three_project_2.com'
}

const projectUserFour1 = {
	name: 'user_four_project',
	description: 'user_four_project_description',
	url: 'www.user_four_project.com'
}

const projectUserFour2 = {
	name: 'user_four_project_2',
	description: 'user_four_project_description_2',
	url: 'www.user_four_project_2.com'
}

const projectUserSeven1 = {
	name: 'user_seven_project',
	description: 'user_seven_project_description',
	url: 'www.user_seven_project.com'
}

function checkCount({ type, arr, length, values }) {
	// Check the length
	expect(arr.length).toBe(length)

	if (length === 0) {
		return
	}

	const valuesAsArr = Object.entries(values)
	const valueNames = Object.keys(values)
	const namesFromArr = arr.map(el => el.name)

	// Check if the specified values exist - ex: check if "react" exists
	valueNames.forEach(el => {
		expect(namesFromArr.includes(el)).toBe(true)
	})

	// Check each individual value count
	valuesAsArr.forEach(el => {
		const elFromArr = arr.find(elArr => el[0] === elArr.name)
		expect(elFromArr[type]).toBe(el[1])
	})
}

function compareValues({ obj, values }) {
	const valuesAsArr = Object.entries(values)

	// Check each individual value count
	valuesAsArr.forEach(el => {
		const valueFromObj = obj[[el[0]]]
		const valueFromValues = el[1]
		expect(valueFromObj).toBe(valueFromValues)
	})
}

async function registerNewUser(user, status = 201) {
	const res = await request(app)
		.post('/api/users')
		.send({ ...user })
		.expect(status)

	user.token = res.body.token

	// Update the referenced object passed to the function.
	if (res.body.token) {
		user.id = jwtDecode(res.body.token).user.id
	}
}

async function login(user, status = 200) {
	const res = await request(app)
		.post('/api/users/login')
		.send({ ...user })
		.expect(status)

	if (res.body.token) {
		return res.body.token
	} else {
		const errorObject = JSON.parse(res.error.text)
		return errorObject
	}
}

async function blockUser(token, userId, status = 200) {
	await request(app)
		.post(`/api/users/block/${userId}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)
}

async function unblockUser(token, userId, status = 200) {
	await request(app)
		.post(`/api/users/unblock/${userId}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)
}

async function fetchUserById(token, userId, status = 200) {
	const res = await request(app)
		.get(`/api/users/${userId}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function populateProfile(profile, token, status = 200) {
	const res = await request(app)
		.put('/api/users/profile')
		.set('Authorization', `Bearer ${token}`)
		.send({ ...profile })
		.expect(status)

	return res.body
}

async function createProject(project, token, status = 201) {
	const res = await request(app)
		.post('/api/projects')
		.set('Authorization', `Bearer ${token}`)
		.send({ ...project })
		.expect(status)

	return res.body
}

async function archiveProject(token, projectId, status = 201) {
	const res = await request(app)
		.patch(`/api/projects/${projectId}/archive`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function unarchiveProject(token, projectId, status = 200) {
	const res = await request(app)
		.patch(`/api/projects/${projectId}/unarchive`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function fetchProjectById(token, projectId, status = 200) {
	const res = await request(app)
		.get(`/api/projects/${projectId}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function editProject(projectId, projectData, token, status = 200) {
	const res = await request(app)
		.put(`/api/projects/${projectId}`)
		.set('Authorization', `Bearer ${token}`)
		.send({ ...projectData })
		.expect(status)

	return res.body
}

async function deleteProject(projectId, token, status = 200) {
	const res = await request(app)
		.delete(`/api/projects/${projectId}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function fetchUsersProjects(userId, token, status = 200, type = '', start, end) {
	const res = await request(app)
		.get(`/api/projects/user/${userId}?type=${type}&start=${start}&end=${end}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function fetchPotentialProjects(token, status = 200, start, end) {
	const res = await request(app)
		.get(`/api/projects/potentialProjects?start=${start}&end=${end}}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function fetchPotentialUsers({ token, projectId, start, end, status = 200 }) {
	const res = await request(app)
		.get(`/api/projects/${projectId}/potentialUsers?start=${start}&end=${end}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function fetchTags({ status = 200, start, end }) {
	const res = await request(app)
		.get(`/api/tags?start=${start}&end=${end}`)
		.expect(status)

	return res.body
}

async function fetchSkills({ status = 200, start, end, type }) {
	const res = await request(app)
		.get(`/api/skills?start=${start}&end=${end}&type=${type}`)
		.expect(status)

	return res.body
}

async function fetchLatestProjectsPagination({ token, start, end, status = 200 }) {
	const res = await request(app)
		.get(`/api/projects?start=${start}&end=${end}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function sendProjectApplication({ token, projectId, status = 201, application }) {
	const res = await request(app)
		.post(`/api/projects/project_application/${projectId}`)
		.set('Authorization', `Bearer ${token}`)
		.send({ ...application })
		.expect(status)

	return res.body
}

async function getNotifications(token, status = 200) {
	const res = await request(app)
		.get('/api/users/notifications')
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function getProjectApplications({ token, projectId, status = 200, start, end, type = '' }) {
	const res = await request(app)
		.get(`/api/projects/project_applications/${projectId}?start=${start}&end=${end}&type=${type}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function markProjectApplicationRead({ token, projectApplicationId, status = 200 }) {
	const res = await request(app)
		.patch(`/api/projects/project_application_read/${projectApplicationId}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function markProjectApplicationArchived({ token, projectApplicationId, status = 200 }) {
	const res = await request(app)
		.patch(`/api/projects/project_application_archived/${projectApplicationId}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function markPotentialCandidate({ token, projectId, userId, status = 200 }) {
	const res = await request(app)
		.post(`/api/projects/marked_users/${projectId}/${userId}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function fetchedMarkedPotentialCandidates({ token, projectId, status = 200 }) {
	const res = await request(app)
		.get(`/api/projects/marked_users/${projectId}/`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function fetchProjectsWhereLoggedUserIsMarked({ token, status = 200 }) {
	const res = await request(app)
		.get('/api/projects/projects_where_user_is_marked')
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function getSingleProjectApplication({ token, projectApplicationId, status = 200, }) {
	const res = await request(app)
		.get(`/api/projects/project_application/${projectApplicationId}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

module.exports = {
	registerNewUser,
	userOne,
	userTwo,
	userThree,
	userFour,
	userFive,
	userSix,
	userSeven,
	userEight,
	login,
	blockUser,
	unblockUser,
	fetchUserById,
	populateProfile,
	checkCount,
	compareValues,
	initialProfileValuesUserOne,
	initialProfileValuesUserTwo,
	initialProfileValuesUserThree,
	initialProfileValuesUserFour,
	projectUserOne1,
	projectUserOne2,
	projectUserTwo1,
	projectUserTwo2,
	projectUserThree1,
	projectUserThree2,
	projectUserFour1,
	projectUserFour2,
	projectUserSeven1,
	createProject,
	archiveProject,
	unarchiveProject,
	fetchProjectById,
	editProject,
	deleteProject,
	fetchUsersProjects,
	fetchPotentialProjects,
	fetchPotentialUsers,
	fetchTags,
	fetchSkills,
	fetchLatestProjectsPagination,
	sendProjectApplication,
	getNotifications,
	getProjectApplications,
	markProjectApplicationRead,
	markProjectApplicationArchived,
	markPotentialCandidate,
	fetchedMarkedPotentialCandidates,
	fetchProjectsWhereLoggedUserIsMarked,
	getSingleProjectApplication,
}
