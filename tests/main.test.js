/* eslint-disable indent */
/* eslint-disable no-undef */
const request = require('supertest')
const app = require('../app')

const {
	userOne,
	userTwo,
	userThree,
	userFour,
	userFive,
	registerNewUser,
	login, // new
	populateProfile,
	createProject,
	createPortfolioProject,
	deleteProject,
	getNotifications,
	editProject,
	archiveProject,
	unarchiveProject,
	getAllProjects,
	fetchPotentialUsers,
	fetchPotentialProjects,
	fetchUsersProjects,
	blockUser,
	fetchProjectById,
	fetchUserById,
	unblockUser,
	fetchTags,
	fetchSkills,
	searchSkills,
	searchTags,
	getOccurrence,
	checkEventsLength,
} = require('./utils')

const User = require('../db/models/User')
const Skill = require('../db/models/Skill')
const Tag = require('../db/models/Tag')
const Project = require('../db/models/Project')
const Event = require('../db/models/Event')
const Notification = require('../db/models/Notification')

beforeEach(async () => {
	await User.query().delete()
	await Skill.query().delete()
	await Project.query().delete()
	await Event.query().delete()
	await Tag.query().delete()
	await Notification.query().delete()
	await registerNewUser(userOne, 201)
})

afterAll(async () => {
	await User.query().delete()
	await Skill.query().delete()
	await Project.query().delete()
	await Tag.query().delete()
	await Event.query().delete()
	await Notification.query().delete()
})

test('Registration [201, 400]', async () => {
	await registerNewUser({
		name: 'dusantest',
		email: 'dusantest@gmail.com',
		password: 'password'
	}, 201)

	const fetchedUser = await User.query().findOne({ email: 'dusantest@gmail.com' })

	expect(fetchedUser.name).toBe('dusantest')
	expect(fetchedUser.email).toBe('dusantest@gmail.com')
	expect(fetchedUser.password).not.toBe('password')

	await registerNewUser({
		name: 'someOtherName',
		email: 'dusantest@gmail.com',
		password: 'password'
	}, 400)

	await registerNewUser({
		name: 'dusantest',
		email: 'newemail@gmail.com',
		password: 'password'
	}, 400)
})

test('Login [200, 2x 400]', async () => {
	// User one logins
	const responseLoginSuccess = await login(userOne)

	userOne.token = responseLoginSuccess

	// Check if the new token works by hitting a private route
	const responseLoggedUserData = await request(app)
		.get('/api/users/current_user')
		.set('Authorization', `Bearer ${userOne.token}`)
		.send(userOne)
		.expect(200)

	const loggedUserData = responseLoggedUserData.body.user
	expect(loggedUserData.name).toBe(userOne.name)
	expect(loggedUserData.email).toBe(userOne.email)

	// When user doesn't exist return 400
	const responseLoginFail = await login({ email: 'nonexistentemail@gmail.com', password: userOne.password }, 400)
	expect(responseLoginFail.msg).toBe('Invalid credentials!')

	// When password doesn't match, return 400
	const responseLoginFail2 = await login({ email: userOne.email, password: 'invalidPassword' }, 400)
	expect(responseLoginFail2.msg).toBe('Invalid credentials!')
})

// @todo skills, project
test('Delete user', async () => {
	// User two registers
	await registerNewUser(userTwo, 201)

	// *** User one populates profile, adding skills
	// *** User two has no skills

	// *** User one creates project 1

	// *** User one creates project 2

	// *** User one archives project 2

	await request(app)
		.delete('/api/users')
		.set('Authorization', `Bearer ${userOne.token}`)
		.expect(200)

	// Check if only user two exists
	const users = await User.query()
	expect(users.length).toBe(1)
	expect(users[0].id).toBe(userTwo.id)

	// *** Checks skills count (has_skills)

	await request(app)
		.delete('/api/users')
		.set('Authorization', `Bearer ${userTwo.token}`)
		.expect(200)

	// *** Check skills count (has_skills) after deleting both
})

// @todo project
test('Block + unblock user + getUserById', async () => {
	// User two, three registers
	await registerNewUser(userTwo, 201)
	await registerNewUser(userThree, 201)

	// *** User one creates a project

	// *** User two creates a project

	// User one blocks user two and user three
	await blockUser(userOne.token, userTwo.id, 200)
	await blockUser(userOne.token, userThree.id, 200)

	// User one should have two blocked members
	const { blocked_members } = await User.query().findById(userOne.id).eager('blocked_members')
	expect(blocked_members.length).toBe(2)
	expect([userTwo.id, userThree.id].some(id => blocked_members.map(user => user.id).includes(id))).toBe(true)

	// User one tries to fetch user two [400]
	await fetchUserById(userOne.token, userTwo.id, 400)

	// *** User one tries to fetch user two's project [404]

	// User two tries to fetch user one [404]
	await fetchUserById(userTwo.token, userOne.id, 404)

	// *** User two tries to fetch user one's project [404]

	// User one unblocks user two
	await unblockUser(userOne.token, userTwo.id, 200)

	// User one should have one blocked member
	const { blocked_members: blocked_members2 } = await User.query().findById(userOne.id).eager('blocked_members')
	expect(blocked_members2.length).toBe(1)
	expect(blocked_members2[0].id).toBe(userThree.id)

	// *** User one fetches user two's project [200]

	// *** User two fetches user one's project [200]

	// User fetches user two [200]
	const fetchedUserTwo = await fetchUserById(userOne.token, userTwo.id, 200)
	expect(fetchedUserTwo.user.id).toBe(userTwo.id)
	expect(fetchedUserTwo.user.name).toBe(userTwo.name)
	expect(fetchedUserTwo.user.email).toBe(userTwo.email)

	// User two fetches user one [200]
	const fetchedUserOne = await fetchUserById(userTwo.token, userOne.id, 200)
	expect(fetchedUserOne.user.id).toBe(userOne.id)
	expect(fetchedUserOne.user.name).toBe(userOne.name)
	expect(fetchedUserOne.user.email).toBe(userOne.email)
})

