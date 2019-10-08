const request = require('supertest')
const app = require('../app')
const jwtDecode = require('jwt-decode')
const User = require('../db/models/User')
const Event = require('../db/models/Event')

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

const initialProfileValuesUserOne = {
	location: 'user_one_location',
	website: 'www.user_one.com',
	bio: 'user_one biography.',
	github: 'user_one_github',
	youtube_link: 'user_one_youtube',
	twitter: 'user_one_twitter',
	facebook_link: 'user_one_facebook',
	linkedin: 'user_one_linkedin',
	instagram: '@user_one_github',
	discord: '#user_one',
}
const initialProfileValuesUserTwo = {
	location: 'user_two_location',
	website: 'www.user_two.com',
	bio: 'user_two biography.',
	github: 'user_two_github',
	youtube_link: 'user_two_youtube',
	twitter: 'user_two_twitter',
	facebook_link: 'user_two_facebook',
	linkedin: 'user_two_linkedin',
	instagram: '@user_two_github',
	discord: '#user_two',
}

const initialProfileValuesUserThree = {
	location: 'user_three_location',
	website: 'www.user_three.com',
	bio: 'user_three biography.',
	github: 'user_three_github',
	youtube_link: 'user_three_youtube',
	twitter: 'user_three_twitter',
	facebook_link: 'user_three_facebook',
	linkedin: 'user_three_linkedin',
	instagram: '@user_three_github',
	discord: '#user_three',
}

const projectUserOne1 = {
	name: 'user_one_project',
	description: 'user_one_project_description',
	url: 'www.user_one_project.com'
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

const projectUserFour1 = {
	name: 'user_four_project',
	description: 'user_four_project_description',
	url: 'www.user_four_project.com'
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

async function fetchUsersProjects(userId, token, status = 200, type = '') {
	const res = await request(app)
		.get(`/api/projects/user/${userId}?type=${type}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function fetchPotentialProjects(token, status = 200, finalized = undefined, archived = undefined, accepting_members = undefined) {
	const res = await request(app)
		.get(`/api/projects/potentialProjects?finalized=${finalized}&archived=${archived}&accepting_members=${accepting_members}`)
		.set('Authorization', `Bearer ${token}`)
		.expect(status)

	return res.body
}

async function fetchPotentialUsers(token, projectId, status = 200) {
	const res = await request(app)
		.get(`/api/projects/${projectId}/potentialUsers`)
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
	projectUserOne1,
	projectUserOne2,
	projectUserTwo1,
	projectUserTwo2,
	projectUserThree1,
	projectUserFour1,
	createProject,
	archiveProject,
	unarchiveProject,
	fetchProjectById,
	editProject,
	deleteProject,
	fetchUsersProjects,
	fetchPotentialProjects,
	fetchPotentialUsers,
}
