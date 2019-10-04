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
	initialProfileValuesUserOne,
	initialProfileValuesUserTwo,
	registerNewUser,
	login, // new
	checkCount, // new
	compareValues, // new
	projectUserOne1, // new
	projectUserOne2, // new
	projectUserTwo1, // new
	projectUserTwo2, // new
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

test('Delete user + check skills, tags, projects', async () => {
	// User two registers
	await registerNewUser(userTwo, 201)

	// User one populates profile, adding skills
	await populateProfile({ ...initialProfileValuesUserOne, skills: ['express', 'react'] }, userOne.token, 200)

	// User two has one skill
	await populateProfile({ ...initialProfileValuesUserTwo, skills: ['express'] }, userTwo.token, 200)

	// User one creates project 1
	const projectUserOne = await createProject({ ...projectUserOne1, skills: ['node', 'mongodb'], tags: ['ecommerce'] }, userOne.token, 201)

	// User one creates project 2
	await createProject({ ...projectUserOne2, skills: ['node'], tags: ['easy'] }, userOne.token, 201)

	// User two creates project 
	await createProject({ ...projectUserTwo1, skills: ['node', 'mongodb'], tags: ['ecommerce'] }, userTwo.token, 201)

	// User one archives project 1
	await archiveProject(userOne.token, projectUserOne.project.id, 200)

	await request(app)
		.delete('/api/users')
		.set('Authorization', `Bearer ${userOne.token}`)
		.expect(200)

	// Check the number of projects
	const projects = await Project.query()
	expect(projects.length).toBe(1)
	expect(projects[0].owner_id).toBe(userTwo.id)

	// Check if only user two exists
	const users = await User.query()
	expect(users.length).toBe(1)
	expect(users[0].id).toBe(userTwo.id)

	// Checks skills count before user 2 is gone (has_skills)	
	const skills1 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills1, length: 3, values: { express: 1, node: 0, mongodb: 0 } })

	// Checks skills count before user 2 is gone (required_skills)	
	checkCount({ type: 'required_skills_count', arr: skills1, length: 3, values: { express: 0, node: 1, mongodb: 1 } })

	// Checks tags count before user 2 is gone (has_skills)	
	const tags1 = await Tag.query()
	checkCount({ type: 'count', arr: tags1, length: 1, values: { ecommerce: 1 } })

	await request(app)
		.delete('/api/users')
		.set('Authorization', `Bearer ${userTwo.token}`)
		.expect(200)

	// Check skills after deleting both
	const skills2 = await Skill.query()
	expect(skills2.length).toBe(0)

	// Check skills after deleting both
	const tags2 = await Tag.query()
	expect(tags2.length).toBe(0)
})

test('Block + unblock user + getUserById + fetchProjectById', async () => {
	// User two, three registers
	await registerNewUser(userTwo, 201)
	await registerNewUser(userThree, 201)

	// User one creates a project
	const projectUserOne = await createProject({ ...projectUserOne1, skills: ['node', 'mongodb'], tags: ['ecommerce'] }, userOne.token, 201)

	// User two creates a project
	const projectUserTwo = await createProject({ ...projectUserTwo1, skills: ['node', 'mongodb'], tags: ['ecommerce'] }, userTwo.token, 201)

	// User one blocks user two and user three
	await blockUser(userOne.token, userTwo.id, 200)
	await blockUser(userOne.token, userThree.id, 200)

	// User one should have two blocked members
	const { blocked_members } = await User.query().findById(userOne.id).eager('blocked_members')
	expect(blocked_members.length).toBe(2)
	expect([userTwo.id, userThree.id].some(id => blocked_members.map(user => user.id).includes(id))).toBe(true)

	// User one tries to fetch user two [400]
	await fetchUserById(userOne.token, userTwo.id, 400)

	// User one tries to fetch user three [400]
	await fetchUserById(userOne.token, userThree.id, 400)

	// User one tries to fetch user two's project [404]
	await fetchProjectById(userOne.token, projectUserTwo.project.id, 404)

	// User two tries to fetch user one [404]
	await fetchUserById(userTwo.token, userOne.id, 404)

	// User two tries to fetch user one's project [404]
	await fetchProjectById(userTwo.token, projectUserOne.project.id, 404)

	// User one unblocks user two
	await unblockUser(userOne.token, userTwo.id, 200)

	// User one should have one blocked member
	const { blocked_members: blocked_members2 } = await User.query().findById(userOne.id).eager('blocked_members')
	expect(blocked_members2.length).toBe(1)
	expect(blocked_members2[0].id).toBe(userThree.id)

	// User one fetches user two's project [200]
	const projectUserTwoThatUserOneFetched = await fetchProjectById(userOne.token, projectUserTwo.project.id, 200)
	compareValues({
		obj: projectUserTwoThatUserOneFetched.project,
		values: { ...projectUserTwo1 }
	})

	// User two fetches user one's project [200]
	const projectUserOneThatUserTwoFetched = await fetchProjectById(userTwo.token, projectUserOne.project.id, 200)
	compareValues({
		obj: projectUserOneThatUserTwoFetched.project,
		values: { ...projectUserOne1 }
	})

	// User one fetches user two [200]
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

test('User profile update + skills with has_skills check', async () => {
	// User one populates profile 
	await populateProfile({ ...initialProfileValuesUserOne, skills: ['express', 'react'] }, userOne.token, 200)

	// Check skills' count
	const skills1 = await Skill.query()

	checkCount({ type: 'has_skills_count', arr: skills1, length: 2, values: { react: 1, express: 1 } })

	// Fetch userOne's skills 
	const { has_skills: skilluserOneSkills1 } = await User.query().findById(userOne.id).eager('has_skills')
	checkCount({ type: 'has_skills_count', arr: skilluserOneSkills1, length: 2, values: { react: 1, express: 1 } })

	// User two registers
	await registerNewUser(userTwo, 201)

	// User two populates profile 
	await populateProfile({ ...initialProfileValuesUserTwo, skills: ['express', 'react'] }, userTwo.token, 200)

	// Check user one and user two data
	const userOneFetched = await fetchUserById(userOne.token, userOne.id, 200)
	const userTwoFetched = await fetchUserById(userOne.token, userTwo.id, 200)

	compareValues({
		obj: userOneFetched.user,
		values: initialProfileValuesUserOne
	})

	compareValues({
		obj: userTwoFetched.user,
		values: initialProfileValuesUserTwo
	})

	// Check skills' count again
	const skills2 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills2, length: 2, values: { react: 2, express: 2 } })

	// User one edits profile
	await populateProfile({
		...initialProfileValuesUserOne,
		location: 'user_one_location_edited',
		website: '',
		skills: ['node', 'react'] // removing express, adding node
	}, userOne.token,
		200)

	// Check userOne data after editing
	const userOneFetched2 = await fetchUserById(userOne.token, userOne.id, 200)

	const newValuesUserOne = {
		...initialProfileValuesUserOne,
		location: 'user_one_location_edited',
		website: null,
	}

	compareValues({
		obj: userOneFetched2.user,
		values: newValuesUserOne
	})

	// Check userOne's skills and count
	const { has_skills: skilluserOneSkills2 } = await User.query().findById(userOne.id).eager('has_skills')
	checkCount({ type: 'has_skills_count', arr: skilluserOneSkills2, length: 2, values: { node: 1, react: 2 } })

	// Check skills' count once again
	const skills3 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills3, length: 3, values: { react: 2, express: 1, node: 1 } })

	// User sends only website key value pair to populate profile
	await populateProfile({
		website: 'website_edited'
	}, userOne.token,
		200)

	// Check if profile data that weren't sent are null
	const valuesWhenSentNoneForSkillsAndSomeData = {
		location: null,
		website: 'website_edited',
		bio: null,
		github: null,
		youtube_link: null,
		twitter: null,
		facebook_link: null,
		linkedin: null,
		instagram: null,
		discord: null,
	}

	const userOneFetched3 = await fetchUserById(userOne.token, userOne.id, 200)

	compareValues({
		obj: userOneFetched3.user,
		values: valuesWhenSentNoneForSkillsAndSomeData
	})

	// Check skills, should only be user two's
	const skills4 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills4, length: 2, values: { react: 1, express: 1 } })

	// User one adds skills again
	await populateProfile({
		skills: ['react', 'express']
	}, userOne.token,
		200)

	// Check if updated for userOne
	const { has_skills: skilluserOneSkills3 } = await User.query().findById(userOne.id).eager('has_skills')
	checkCount({ type: 'has_skills_count', arr: skilluserOneSkills3, length: 2, values: { react: 2, express: 2 } })

	// Check skills 
	const skills5 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills5, length: 2, values: { react: 2, express: 2 } })

	// User one deletes his skills and adds old values for location and website
	await populateProfile({
		...initialProfileValuesUserOne,
		skills: [] // removing both node and react
	}, userOne.token,
		200)

	// Check userOne data
	const userOneFetched4 = await fetchUserById(userOne.token, userOne.id, 200)
	compareValues({
		obj: userOneFetched4.user,
		values: initialProfileValuesUserOne
	})

	// Check userOne's skills, should be 0
	expect(userOneFetched4.user.has_skills.length).toBe(0)

	// Check skills generally
	const skills6 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills6, length: 2, values: { react: 1, express: 1 } })

	// User one tries to update profile with invalid data
	await populateProfile({
		skills: true
	}, userOne.token,
		400)

	await populateProfile({
		website: 12321
	}, userOne.token,
		400)
})

test('/createP, /archiveP, /editP, /unarchiveP', async () => {
	// User one creates project 1
	const projectUserOne = await createProject({ ...projectUserOne1, skills: ['node', 'mongodb'], tags: ['e-commerce'] }, userOne.token, 201)
})


