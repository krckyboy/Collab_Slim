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
	userSix,
	userSeven,
	userEight,
	initialProfileValuesUserOne,
	initialProfileValuesUserTwo,
	initialProfileValuesUserThree,
	initialProfileValuesUserFour,
	registerNewUser,
	login, // new
	checkCount, // new
	compareValues, // new
	projectUserOne1, // new
	projectUserOne2, // new
	projectUserOne3,
	projectUserOne4,
	projectUserOne5,
	projectUserTwo1, // new
	projectUserTwo2, // new
	projectUserThree1,
	projectUserThree2,
	projectUserFour1,
	projectUserFour2,
	projectUserSeven1,
	populateProfile,
	createProject,
	deleteProject,
	getNotifications,
	editProject,
	archiveProject,
	unarchiveProject,
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
	fetchLatestProjectsPagination,
	sendProjectApplication,
	getProjectApplications,
	markProjectApplicationRead,
	markProjectApplicationArchived,
	markPotentialCandidate,
	fetchedMarkedPotentialCandidates,
	fetchProjectsWhereLoggedUserIsMarked,
	getSingleProjectApplication,
	deleteLoggedUser,
	initialProfileValuesUserFive,
	initialProfileValuesUserSix,
	initialProfileValuesUserSeven,
	initialProfileValuesUserEight,
} = require('./utils')

const User = require('../db/models/User')
const Skill = require('../db/models/Skill')
const Tag = require('../db/models/Tag')
const Project = require('../db/models/Project')
const Event = require('../db/models/Event')
const Notification = require('../db/models/Notification')
const ProjectApplication = require('../db/models/ProjectApplication')
const MarkedCandidate = require('../db/models/MarkedCandidate')

beforeEach(async () => {
	await User.query().delete()
	await Skill.query().delete()
	await Project.query().delete()
	await Event.query().delete()
	await Tag.query().delete()
	await Notification.query().delete()
	await ProjectApplication.query().delete()
	await registerNewUser(userOne, 201)
})

afterAll(async () => {
	await User.query().delete()
	await Skill.query().delete()
	await Project.query().delete()
	await Tag.query().delete()
	await Event.query().delete()
	await Notification.query().delete()
	await ProjectApplication.query().delete()
})

test('Registration [201, 400]', async () => {
	await registerNewUser(
		{
			email: 'dusantest@gmail.com',
			password: 'password',
		},
		201
	)

	const fetchedUser = await User.query().findOne({
		email: 'dusantest@gmail.com',
	})

	expect(fetchedUser.name).toBe(null)
	expect(fetchedUser.email).toBe('dusantest@gmail.com')
	expect(fetchedUser.password).not.toBe('password')

	await registerNewUser(
		{
			email: 'dusantest@gmail.com',
			password: 'password',
		},
		400
	)
})

test('Login [200, 2x 400]', async () => {
	// User one logins
	const responseLoginSuccess = await login(userOne)

	// eslint-disable-next-line require-atomic-updates
	userOne.token = responseLoginSuccess

	// Check if the new token works by hitting a private route
	const responseLoggedUserData = await request(app)
		.get('/api/users/current_user')
		.set('Authorization', `Bearer ${userOne.token}`)
		.send(userOne)
		.expect(200)

	const loggedUserData = responseLoggedUserData.body.user
	expect(loggedUserData.name).toBe(null)
	expect(loggedUserData.email).toBe(userOne.email)

	// When user doesn't exist return 400
	const responseLoginFail = await login(
		{ email: 'nonexistentemail@gmail.com', password: userOne.password },
		400
	)
	expect(responseLoginFail.msg).toBe('Invalid credentials!')

	// When password doesn't match, return 400
	const responseLoginFail2 = await login(
		{ email: userOne.email, password: 'invalidPassword' },
		400
	)
	expect(responseLoginFail2.msg).toBe('Invalid credentials!')
})

test('Delete user + check skills, tags, projects', async () => {
	// User two registers
	await registerNewUser(userTwo, 201)

	// User one populates profile, adding skills
	await populateProfile(
		{ ...initialProfileValuesUserOne, skills: ['express', 'react', 'react'] },
		userOne.token,
		200
	)

	// User two has one skill
	await populateProfile(
		{ ...initialProfileValuesUserTwo, skills: ['express'] },
		userTwo.token,
		200
	)

	// User one creates project 1
	const { project: projectUserOne } = await createProject(
		{ ...projectUserOne1, skills: ['node', 'mongodb'], tags: ['ecommerce'] },
		userOne.token,
		201
	)

	// User one creates project 2
	await createProject(
		{ ...projectUserOne2, skills: ['node'], tags: ['easy'] },
		userOne.token,
		201
	)

	// User two creates project
	await createProject(
		{ ...projectUserTwo1, skills: ['node', 'mongodb'], tags: ['ecommerce'] },
		userTwo.token,
		201
	)

	// User one archives project 1
	await archiveProject(userOne.token, projectUserOne.id, 200)

	await request(app)
		.delete('/api/users')
		.set('Authorization', `Bearer ${userOne.token}`)
		.expect(200)

	// Check the number of projects
	const projects = await Project.query().eager('[skills, has_tags]')
	expect(projects.length).toBe(1)
	expect(projects[0].owner_id).toBe(userTwo.id)
	expect(projects[0].skills.length).toBe(2)
	expect(projects[0].has_tags.length).toBe(1)
	expect(projects[0].has_tags[0].name).toBe('ecommerce')

	// Check if only user two exists
	const users = await User.query()
	expect(users.length).toBe(1)
	expect(users[0].id).toBe(userTwo.id)

	// Checks skills count before user 2 is gone (has_skills)
	const skills1 = await Skill.query()
	checkCount({
		type: 'has_skills_count',
		arr: skills1,
		length: 4,
		values: { express: 1, node: 0, mongodb: 0, react: 0 },
	})

	// Checks skills count before user 2 is gone (required_skills)
	checkCount({
		type: 'required_skills_count',
		arr: skills1,
		length: 4,
		values: { express: 0, node: 1, mongodb: 1, react: 0 },
	})

	// Checks tags count before user 2 is gone (has_skills)
	const tags1 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags1,
		length: 2,
		values: { ecommerce: 1, easy: 0 },
	})

	await request(app)
		.delete('/api/users')
		.set('Authorization', `Bearer ${userTwo.token}`)
		.expect(200)

	// Check skills after deleting both
	const skills2 = await Skill.query()
	checkCount({
		type: 'has_skills_count',
		arr: skills2,
		length: 4,
		values: { express: 0, node: 0, mongodb: 0, react: 0 },
	})
	checkCount({
		type: 'required_skills_count',
		arr: skills2,
		length: 4,
		values: { express: 0, node: 0, mongodb: 0, react: 0 },
	})

	// Check skills after deleting both
	const tags2 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags2,
		length: 2,
		values: { ecommerce: 0, easy: 0 },
	})
})

test('Block + unblock user + getUserById + fetchProjectById', async () => {
	// User two, three registers
	await registerNewUser(userTwo, 201)
	await registerNewUser(userThree, 201)

	// User one creates a project
	const { project: projectUserOne } = await createProject(
		{ ...projectUserOne1, skills: ['node', 'mongodb'], tags: ['ecommerce'] },
		userOne.token,
		201
	)

	// User two creates a project
	const { project: projectUserTwo } = await createProject(
		{ ...projectUserTwo1, skills: ['node', 'mongodb'], tags: ['ecommerce'] },
		userTwo.token,
		201
	)

	// User one blocks user two and user three
	await blockUser(userOne.token, userTwo.id, 200)
	await blockUser(userOne.token, userThree.id, 200)

	// User one should have two blocked members
	const { blockedMembers } = await User.query()
		.findById(userOne.id)
		.eager('blockedMembers')
	expect(blockedMembers.length).toBe(2)
	expect(
		[userTwo.id, userThree.id].some((id) =>
			blockedMembers.map((user) => user.id).includes(id)
		)
	).toBe(true)

	// User one tries to fetch user two [403]
	await fetchUserById(userOne.token, userTwo.id, 403)

	// User one tries to fetch user three [403]
	await fetchUserById(userOne.token, userThree.id, 403)

	// User one tries to fetch user two's project [403]
	await fetchProjectById(userOne.token, projectUserTwo.id, 403)

	// User two tries to fetch user one [403]
	await fetchUserById(userTwo.token, userOne.id, 403)

	// User two tries to fetch user one's project [403]
	await fetchProjectById(userTwo.token, projectUserOne.id, 403)

	// User one unblocks user two
	await unblockUser(userOne.token, userTwo.id, 200)

	// User one should have one blocked member
	const { blockedMembers: blockedMembers2 } = await User.query()
		.findById(userOne.id)
		.eager('blockedMembers')
	expect(blockedMembers2.length).toBe(1)
	expect(blockedMembers2[0].id).toBe(userThree.id)

	// User one fetches user two's project [200]
	const projectUserTwoThatUserOneFetched = await fetchProjectById(
		userOne.token,
		projectUserTwo.id,
		200
	)
	compareValues({
		obj: projectUserTwoThatUserOneFetched.project,
		values: { ...projectUserTwo1 },
	})

	// User two fetches user one's project [200]
	const projectUserOneThatUserTwoFetched = await fetchProjectById(
		userTwo.token,
		projectUserOne.id,
		200
	)
	compareValues({
		obj: projectUserOneThatUserTwoFetched.project,
		values: { ...projectUserOne1 },
	})

	// User one fetches user two [200]
	const { user: fetchedUserTwo } = await fetchUserById(
		userOne.token,
		userTwo.id,
		200
	)
	expect(fetchedUserTwo.id).toBe(userTwo.id)
	expect(fetchedUserTwo.email).toBe(undefined)

	// User two fetches user one [200]
	const { user: fetchedUserOne } = await fetchUserById(
		userTwo.token,
		userOne.id,
		200
	)
	expect(fetchedUserOne.id).toBe(userOne.id)
	expect(fetchedUserOne.email).toBe(undefined)
})

test('User profile update + skills with has_skills check', async () => {
	// User one populates profile
	await populateProfile(
		{ ...initialProfileValuesUserOne, skills: ['express', 'react'] },
		userOne.token,
		200
	)

	// Check skills' count
	const skills1 = await Skill.query()

	checkCount({
		type: 'has_skills_count',
		arr: skills1,
		length: 2,
		values: { react: 1, express: 1 },
	})

	// Fetch userOne's skills
	const { skills: skilluserOneSkills1 } = await User.query()
		.findById(userOne.id)
		.eager('skills')
	checkCount({
		type: 'has_skills_count',
		arr: skilluserOneSkills1,
		length: 2,
		values: { react: 1, express: 1 },
	})

	// User two registers
	await registerNewUser(userTwo, 201)

	// User two populates profile
	await populateProfile(
		{ ...initialProfileValuesUserTwo, skills: ['express', 'react'] },
		userTwo.token,
		200
	)

	// Check user one and user two data
	const userOneFetched = await fetchUserById(userOne.token, userOne.id, 200)
	const userTwoFetched = await fetchUserById(userOne.token, userTwo.id, 200)

	compareValues({
		obj: userOneFetched.user,
		values: initialProfileValuesUserOne,
	})

	compareValues({
		obj: userTwoFetched.user,
		values: initialProfileValuesUserTwo,
	})

	// Check skills' count again
	const skills2 = await Skill.query()
	checkCount({
		type: 'has_skills_count',
		arr: skills2,
		length: 2,
		values: { react: 2, express: 2 },
	})

	// User one edits profile, but fails due to name not being unique
	await populateProfile(
		{
			...initialProfileValuesUserOne,
			location: 'user_one_location_edited',
			website: '',
			name: 'usertwo',
			skills: ['node', 'react'], // removing express, adding node
		},
		userOne.token,
		400
	)

	// Check userOne data after editing
	const userOneFetched2Fail = await fetchUserById(
		userOne.token,
		userOne.id,
		200
	)

	compareValues({
		obj: userOneFetched2Fail.user,
		values: initialProfileValuesUserOne,
	})

	// User one edits profile successfully
	await populateProfile(
		{
			...initialProfileValuesUserOne,
			location: 'user_one_location_edited',
			website: '',
			name: 'userOneNew',
			skills: ['node', 'react'], // removing express, adding node
		},
		userOne.token,
		200
	)

	const newValuesUserOne = {
		...initialProfileValuesUserOne,
		location: 'user_one_location_edited',
		website: null,
		name: 'userOneNew',
	}

	// Check userOne data after editing
	const userOneFetched2 = await fetchUserById(userOne.token, userOne.id, 200)

	compareValues({
		obj: userOneFetched2.user,
		values: newValuesUserOne,
	})

	// Check userOne's skills and count
	const { skills: skilluserOneSkills2 } = await User.query()
		.findById(userOne.id)
		.eager('skills')
	checkCount({
		type: 'has_skills_count',
		arr: skilluserOneSkills2,
		length: 2,
		values: { node: 1, react: 2 },
	})

	// Check skills' count once again
	const skills3 = await Skill.query()
	checkCount({
		type: 'has_skills_count',
		arr: skills3,
		length: 3,
		values: { react: 2, express: 1, node: 1 },
	})

	// User sends only website key value pair to populate profile, but without name
	await populateProfile(
		{
			website: 'website_edited',
		},
		userOne.token,
		400
	)

	// User sends only website key value pair to populate profile
	await populateProfile(
		{
			website: 'website_edited',
			name: 'userOneNew',
		},
		userOne.token,
		200
	)

	// Check if profile data that weren't sent are null
	const valuesWhenSentNoneForSkillsAndSomeData = {
		location: null,
		website: 'website_edited',
		bio: null,
		github: null,
	}

	const userOneFetched3 = await fetchUserById(userOne.token, userOne.id, 200)

	compareValues({
		obj: userOneFetched3.user,
		values: valuesWhenSentNoneForSkillsAndSomeData,
	})

	// Check skills, should only be user two's
	const skills4 = await Skill.query()
	checkCount({
		type: 'has_skills_count',
		arr: skills4,
		length: 3,
		values: { react: 1, express: 1, node: 0 },
	})

	// User one adds skills again
	await populateProfile(
		{
			skills: ['react', 'express'],
			name: 'userOneNew',
		},
		userOne.token,
		200
	)

	// Check if updated for userOne
	const { skills: skilluserOneSkills3 } = await User.query()
		.findById(userOne.id)
		.eager('skills')
	checkCount({
		type: 'has_skills_count',
		arr: skilluserOneSkills3,
		length: 2,
		values: { react: 2, express: 2 },
	})

	// Check skills
	const skills5 = await Skill.query()
	checkCount({
		type: 'has_skills_count',
		arr: skills5,
		length: 3,
		values: { react: 2, express: 2, node: 0 },
	})

	// User one deletes his skills and adds old values for location and website
	await populateProfile(
		{
			...initialProfileValuesUserOne,
			skills: [], // removing both node and react
		},
		userOne.token,
		200
	)

	// Check userOne data
	const userOneFetched4 = await fetchUserById(userOne.token, userOne.id, 200)
	compareValues({
		obj: userOneFetched4.user,
		values: initialProfileValuesUserOne,
	})

	// Check userOne's skills, should be 0
	expect(userOneFetched4.user.skills.length).toBe(0)

	// Check skills generally
	const skills6 = await Skill.query()
	checkCount({
		type: 'has_skills_count',
		arr: skills6,
		length: 3,
		values: { react: 1, express: 1, node: 0 },
	})

	// User one tries to update profile with invalid data
	await populateProfile(
		{
			skills: true,
			name: 'userOneNew',
		},
		userOne.token,
		400
	)

	await populateProfile(
		{
			website: 12321,
		},
		userOne.token,
		400
	)

	// User two populates with no skills
	await populateProfile(
		{
			...initialProfileValuesUserTwo,
			skills: [], // removing both node and react
		},
		userTwo.token,
		200
	)

	const skills7 = await Skill.query()
	checkCount({
		type: 'has_skills_count',
		arr: skills7,
		length: 3,
		values: { react: 0, express: 0, node: 0 },
	})
})

test('/createP, /archiveP, /editP, /unarchiveP /deleteP', async () => {
	// User one creates project 1
	const { project: projectUserOne } = await createProject(
		{ ...projectUserOne1, skills: ['node', 'mongodb'], tags: ['ecommerce'] },
		userOne.token,
		201
	)

	// Check if skills exist properly with count
	const skills1 = await Skill.query()
	checkCount({
		type: 'required_skills_count',
		arr: skills1,
		length: 2,
		values: { node: 1, mongodb: 1 },
	})

	// Check if tags exist properly with count
	const tags1 = await Tag.query()
	checkCount({ type: 'count', arr: tags1, length: 1, values: { ecommerce: 1 } })

	// User one edits project 1, removing mongodb, adding express and replacing tag
	const projectUserOneEdited = {
		name: 'user_one_project_edited',
		description: 'user_one_project_description_edited',
		url: 'www.user_one_project.com_edited',
	}
	await editProject(
		projectUserOne.id,
		{
			...projectUserOneEdited,
			skills: ['node', 'express', 'express'],
			tags: ['wordpress', 'wordpress'],
		},
		userOne.token,
		200
	)

	// Checking if it's successfully edited
	const { project: projectUserOneFetched1 } = await fetchProjectById(
		userOne.token,
		projectUserOne.id,
		200
	)
	compareValues({
		obj: projectUserOneFetched1,
		values: { ...projectUserOneEdited },
	})

	// Check if skills are updated properly
	const skills2 = await Skill.query()
	checkCount({
		type: 'required_skills_count',
		arr: skills2,
		length: 3,
		values: { node: 1, express: 1, mongodb: 0 },
	})

	// Check if tags are updated properly
	const tags2 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags2,
		length: 2,
		values: { wordpress: 1, ecommerce: 0 },
	})

	// User one edits project once again, sending empty array for skills and array
	await editProject(
		projectUserOne.id,
		{ ...projectUserOne1, skills: [], tags: [] },
		userOne.token,
		200
	)

	// Check if skills are updated properly
	const skills3 = await Skill.query()
	expect(skills3.length).toBe(3) // node mongodb express

	// Check if tags are updated properly
	const tags3 = await Tag.query()
	expect(tags3.length).toBe(2) // wordpress ecommerce

	// Check if project updated
	const projectUserOneFetched2 = await fetchProjectById(
		userOne.token,
		projectUserOne.id,
		200
	)
	compareValues({
		obj: projectUserOneFetched2.project,
		values: { ...projectUserOne1 },
	})

	// User one edits project just to get back the skills and tags
	await editProject(
		projectUserOne.id,
		{ ...projectUserOneEdited, skills: ['sql', 'express'], tags: ['easy'] },
		userOne.token,
		200
	)

	// Check if skills are updated properly
	const skills4 = await Skill.query()
	checkCount({
		type: 'required_skills_count',
		arr: skills4,
		length: 4,
		values: { sql: 1, express: 1, node: 0, mongodb: 0 },
	})

	// Check if tags are updated properly
	const tags4 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags4,
		length: 3,
		values: { easy: 1, wordpress: 0, ecommerce: 0 },
	})

	// User one edits project once again, sending no values for skills and array
	await editProject(
		projectUserOne.id,
		{ ...projectUserOne1 },
		userOne.token,
		200
	)

	// Check if skills are updated properly
	const skills5 = await Skill.query()
	checkCount({
		type: 'required_skills_count',
		arr: skills5,
		length: 4,
		values: { sql: 0, express: 0, node: 0, mongodb: 0 },
	})

	// Check if tags are updated properly
	const tags5 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags5,
		length: 3,
		values: { easy: 0, wordpress: 0, ecommerce: 0 },
	})

	// User one edits project just to get back the skills and tags
	await editProject(
		projectUserOne.id,
		{ ...projectUserOneEdited, skills: ['sql', 'express'], tags: ['easy'] },
		userOne.token,
		200
	)

	// Check if project updated
	const projectUserOneFetched3 = await fetchProjectById(
		userOne.token,
		projectUserOne.id,
		200
	)
	compareValues({
		obj: projectUserOneFetched3.project,
		values: { ...projectUserOneEdited },
	})

	expect(projectUserOneFetched3.project.skills.length).toBe(2)
	expect(projectUserOneFetched3.project.has_tags.length).toBe(1)

	// Check if skills are updated properly
	const skills6 = await Skill.query()
	checkCount({
		type: 'required_skills_count',
		arr: skills6,
		length: 4,
		values: { sql: 1, express: 1, node: 0, mongodb: 0 },
	})

	// Check if tags are updated properly
	const tags6 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags6,
		length: 3,
		values: { easy: 1, wordpress: 0, ecommerce: 0 },
	})

	// User archives project
	await archiveProject(userOne.token, projectUserOne.id, 200)

	const projectUserOneFetched4 = await fetchProjectById(
		userOne.token,
		projectUserOne.id,
		200
	)

	expect(projectUserOneFetched4.project.archived).toBe(true)
	expect(projectUserOneFetched4.project.skills.length).toBe(2)
	expect(projectUserOneFetched4.project.has_tags.length).toBe(1)

	// Check if skills are updated properly
	const skills7 = await Skill.query()
	checkCount({
		type: 'required_skills_count',
		arr: skills7,
		length: 4,
		values: { sql: 0, express: 0, node: 0, mongodb: 0 },
	})

	// Check if tags are updated properly
	const tags7 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags7,
		length: 3,
		values: { easy: 0, wordpress: 0, ecommerce: 0 },
	})

	// User two unarchives project
	await unarchiveProject(userOne.token, projectUserOne.id, 200)

	// Check skills
	const skills8 = await Skill.query()
	checkCount({
		type: 'required_skills_count',
		arr: skills8,
		length: 4,
		values: { sql: 1, express: 1, node: 0, mongodb: 0 },
	})

	// Check tags
	const tags8 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags8,
		length: 3,
		values: { easy: 1, wordpress: 0, ecommerce: 0 },
	})

	// Check project data along with skills and tags
	const projectUserOneFetched5 = await fetchProjectById(
		userOne.token,
		projectUserOne.id,
		200
	)

	expect(projectUserOneFetched5.project.archived).toBe(false)
	expect(projectUserOneFetched5.project.skills.length).toBe(2)
	expect(projectUserOneFetched5.project.has_tags.length).toBe(1)

	compareValues({
		obj: projectUserOneFetched5.project,
		values: { ...projectUserOneEdited },
	})

	// User one edits project again with different skills and tags
	await editProject(
		projectUserOne.id,
		{
			...projectUserOne1,
			skills: ['mongodb', 'python'],
			tags: ['easy', 'advanced'],
		},
		userOne.token,
		200
	)

	// Check skills
	const skills9 = await Skill.query()
	checkCount({
		type: 'required_skills_count',
		arr: skills9,
		length: 5,
		values: { sql: 0, express: 0, node: 0, mongodb: 1, python: 1 },
	})

	// Check tags
	const tags9 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags9,
		length: 4,
		values: { easy: 1, wordpress: 0, ecommerce: 0, advanced: 1 },
	})

	// Check project data along with skills and tags
	const projectUserOneFetched6 = await fetchProjectById(
		userOne.token,
		projectUserOne.id,
		200
	)
	expect(projectUserOneFetched6.project.archived).toBe(false)
	expect(projectUserOneFetched6.project.skills.length).toBe(2)
	expect(projectUserOneFetched6.project.has_tags.length).toBe(2)

	compareValues({
		obj: projectUserOneFetched6.project,
		values: { ...projectUserOne1 },
	})

	// User one deletes project
	await deleteProject(projectUserOne.id, userOne.token, 200)

	// Check what happens with skills
	const skills10 = await Skill.query()
	checkCount({
		type: 'required_skills_count',
		arr: skills10,
		length: 5,
		values: { sql: 0, express: 0, node: 0, mongodb: 0, python: 0 },
	})

	// Check what happens with tags
	const tags10 = await Tag.query()
	checkCount({
		type: 'count',
		arr: tags10,
		length: 4,
		values: { easy: 0, wordpress: 0, ecommerce: 0, advanced: 0 },
	})

	// Check if project is actually deleted for real
	const projects = await Project.query()
	expect(projects.length).toBe(0)
})

test('/fetchUsersProjects, /fetchUsersWithSkillsForProject, /fetchProjectsWithMySkills', async () => {
	// User two registers
	// User three registers
	// User four registers
	await registerNewUser(userTwo, 201)
	await registerNewUser(userThree, 201)
	await registerNewUser(userFour, 201)

	// User one updates profile - node, express, react, sql, mongodb
	// User two updates profile -  node, express, sql
	// User three updates profile - node, express
	// User four does not update his profile - no skills
	await populateProfile(
		{
			...initialProfileValuesUserOne,
			skills: ['node', 'express', 'react', 'sql', 'mongodb'],
		},
		userOne.token,
		200
	)
	await populateProfile(
		{ ...initialProfileValuesUserTwo, skills: ['node', 'express', 'sql'] },
		userTwo.token,
		200
	)
	await populateProfile(
		{ ...initialProfileValuesUserThree, skills: ['node', 'express'] },
		userThree.token,
		200
	)

	// User one creates a project
	// SKILLS node, express, react, sql, mongodb
	//
	// User one creates a project
	// SKILLS node, express, sql
	//
	// User two creates a project
	// SKILLS node, mongodb
	//
	// User three creates a project
	// SKILLS python mariadb
	//
	// User four creates a project
	// SKILLS n/a
	const { project: projectUserOne } = await createProject(
		{
			...projectUserOne1,
			skills: ['node', 'express', 'react', 'sql', 'mongodb'],
		},
		userOne.token,
		201
	)
	const { project: projectUserOneSecond } = await createProject(
		{ ...projectUserOne2, skills: ['node', 'express', 'sql'] },
		userOne.token,
		201
	)
	const { project: projectUserTwo } = await createProject(
		{ ...projectUserTwo1, skills: ['node', 'mongodb'] },
		userTwo.token,
		201
	)
	const { project: projectUserThree } = await createProject(
		{ ...projectUserThree1, skills: ['node', 'express', 'sql'] },
		userThree.token,
		201
	)
	const { project: projectUserFour } = await createProject(
		{ ...projectUserFour1, skills: ['python', 'mariadb'] },
		userFour.token,
		201
	)

	// User two blocks user one
	// User two can't fetch user one's projects
	// User two unblocks user one
	await blockUser(userTwo.token, userOne.id, 200)
	await fetchUsersProjects(userOne.id, userTwo.token, 403)
	await unblockUser(userTwo.token, userOne.id, 200)

	// User 1 blocks user 2
	// User 2 cannot fetch user 1's projects
	// User 1 unblocks user 2
	await blockUser(userOne.token, userTwo.id, 200)
	await fetchUsersProjects(userTwo.id, userOne.token, 403)
	await unblockUser(userOne.token, userTwo.id, 200)

	// User two fetches user one's projects successfully
	const { projects: userOneProjects1 } = await fetchUsersProjects(
		userOne.id,
		userTwo.token,
		200
	)
	expect(userOneProjects1.results.length).toBe(2)
	expect(userOneProjects1.results[0].id).toBe(projectUserOneSecond.id)
	expect(userOneProjects1.results[1].id).toBe(projectUserOne.id)

	// Check if pagination and sorting works
	const { projects: userOneProjects2 } = await fetchUsersProjects(
		userOne.id,
		userTwo.token,
		200,
		null,
		0,
		0
	)
	expect(userOneProjects2.results.length).toBe(1)
	expect(userOneProjects2.results[0].id).toBe(projectUserOneSecond.id)

	const { projects: userOneProjects3 } = await fetchUsersProjects(
		userOne.id,
		userTwo.token,
		200,
		null,
		0,
		1
	)
	expect(userOneProjects3.results.length).toBe(2)
	expect(userOneProjects3.results[0].id).toBe(projectUserOneSecond.id)
	expect(userOneProjects3.results[1].id).toBe(projectUserOne.id)

	// User one fetches projects with his skills
	// Check if the number is correct and the order is good, make sure he doesn't fetch his own projects
	const { projects: projectsWithUserOneSkills1 } = await fetchPotentialProjects(
		userOne.token,
		200
	)
	expect(projectsWithUserOneSkills1.results.length).toBe(2)
	expect(projectsWithUserOneSkills1.results[0].id).toBe(projectUserThree.id)
	expect(projectsWithUserOneSkills1.results[0].matchedSkills).toBe(3)
	expect(projectsWithUserOneSkills1.results[1].id).toBe(projectUserTwo.id)
	expect(projectsWithUserOneSkills1.results[1].matchedSkills).toBe(2)

	// User one blocks user two
	// User one fetches projects with his skills, check if there's no project of user two there
	// User one unblocks user two
	await blockUser(userOne.token, userTwo.id, 200)

	const { projects: projectsWithUserOneSkills2 } = await fetchPotentialProjects(
		userOne.token,
		200
	)
	expect(projectsWithUserOneSkills2.results.length).toBe(1)
	expect(projectsWithUserOneSkills2.results[0].id).toBe(projectUserThree.id)
	expect(projectsWithUserOneSkills2.results[0].matchedSkills).toBe(3)

	await unblockUser(userOne.token, userTwo.id, 200)

	// User two blocks user one
	// User one fetches projects with his skills, check if there's no project of user two there
	// User two unblocks user one
	await blockUser(userTwo.token, userOne.id, 200)

	const { projects: projectsWithUserOneSkills3 } = await fetchPotentialProjects(
		userOne.token,
		200
	)
	expect(projectsWithUserOneSkills3.results.length).toBe(1)
	expect(projectsWithUserOneSkills3.results[0].id).toBe(projectUserThree.id)
	expect(projectsWithUserOneSkills3.results[0].matchedSkills).toBe(3)

	await unblockUser(userTwo.token, userOne.id, 200)

	// User one updates his profile
	// User one fetches projects with his skills, check if correct
	await populateProfile(
		{ ...initialProfileValuesUserOne, skills: ['python'] },
		userOne.token,
		200
	)
	const { projects: projectsWithUserOneSkills4 } = await fetchPotentialProjects(
		userOne.token,
		200
	)
	expect(projectsWithUserOneSkills4.results.length).toBe(1)
	expect(projectsWithUserOneSkills4.results[0].id).toBe(projectUserFour.id)
	expect(projectsWithUserOneSkills4.results[0].matchedSkills).toBe(1)
	expect(projectsWithUserOneSkills4.results[0].skills[0].name).toBe('python')

	// User one fetches users with required skills, check if correct and order good
	// User one blocks user two
	// User one fetches users with required skills, check if not fetching user two
	// User one unblocks user two
	const { users: potentialUsersProjectUserOne } = await fetchPotentialUsers({
		token: userOne.token,
		projectId: projectUserOne.id,
	})
	expect(potentialUsersProjectUserOne.results.length).toBe(2)
	expect(potentialUsersProjectUserOne.results[0].id).toBe(userTwo.id)
	expect(potentialUsersProjectUserOne.results[0].matchedSkills).toBe(3)
	expect(potentialUsersProjectUserOne.results[1].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne.results[1].matchedSkills).toBe(2)

	await blockUser(userOne.token, userTwo.id, 200)

	const { users: potentialUsersProjectUserOne2 } = await fetchPotentialUsers({
		token: userOne.token,
		projectId: projectUserOne.id,
	})
	expect(potentialUsersProjectUserOne2.results.length).toBe(1)
	expect(potentialUsersProjectUserOne2.results[0].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne2.results[0].matchedSkills).toBe(2)

	await unblockUser(userOne.token, userTwo.id, 200)

	// User two blocks user one
	// User one fetches users with required skills, check if not fetching user two
	// User two unblocks user one
	await blockUser(userTwo.token, userOne.id, 200)

	const { users: potentialUsersProjectUserOne3 } = await fetchPotentialUsers({
		token: userOne.token,
		projectId: projectUserOne.id,
	})
	expect(potentialUsersProjectUserOne3.results.length).toBe(1)
	expect(potentialUsersProjectUserOne3.results[0].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne3.results[0].matchedSkills).toBe(2)

	await unblockUser(userTwo.token, userOne.id, 200)

	// User one fetches users for his project
	// Check if all good and if the order is good
	const { users: potentialUsersProjectUserOne4 } = await fetchPotentialUsers({
		token: userOne.token,
		projectId: projectUserOne.id,
	})
	expect(potentialUsersProjectUserOne4.results.length).toBe(2)
	expect(potentialUsersProjectUserOne4.results[0].id).toBe(userTwo.id)
	expect(potentialUsersProjectUserOne4.results[0].matchedSkills).toBe(3)
	expect(potentialUsersProjectUserOne4.results[1].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne4.results[1].matchedSkills).toBe(2)

	// User two updates profile, removing skills
	// User one fetches users for his project
	// Check if not fetching user two
	await populateProfile(
		{ ...initialProfileValuesUserTwo, skills: [] },
		userTwo.token,
		200
	)
	const { users: potentialUsersProjectUserOne5 } = await fetchPotentialUsers({
		token: userOne.token,
		projectId: projectUserOne.id,
	})
	expect(potentialUsersProjectUserOne5.results.length).toBe(1)
	expect(potentialUsersProjectUserOne5.results[0].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne5.results[0].matchedSkills).toBe(2)

	// User two updates his profile again
	// User one updates his project, tweaking skills
	// User one fetches users for his project
	// Check if all is good
	await populateProfile(
		{ ...initialProfileValuesUserTwo, skills: ['node'] },
		userTwo.token,
		200
	)
	await editProject(
		projectUserOne.id,
		{ ...projectUserOne1, skills: ['node', 'express', 'mariadb'] },
		userOne.token,
		200
	)
	const { users: potentialUsersProjectUserOne6 } = await fetchPotentialUsers({
		token: userOne.token,
		projectId: projectUserOne.id,
	})
	expect(potentialUsersProjectUserOne6.results.length).toBe(2)
	expect(potentialUsersProjectUserOne6.results[0].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne6.results[0].matchedSkills).toBe(2)
	expect(potentialUsersProjectUserOne6.results[1].id).toBe(userTwo.id)
	expect(potentialUsersProjectUserOne6.results[1].matchedSkills).toBe(1)
})

test('/fetchPopularTags, /fetchPopularSkills, /fetchSkillsInDemand and latest', async () => {
	// User two registers
	// User three registers
	await registerNewUser(userTwo, 201)
	await registerNewUser(userThree, 201)
	await registerNewUser(userFour, 201)

	// Users populate profiles
	await populateProfile(
		{ ...initialProfileValuesUserFour, skills: ['sql'] },
		userFour.token,
		200
	)
	await populateProfile(
		{ ...initialProfileValuesUserThree, skills: ['sql', 'express', 'react'] },
		userThree.token,
		200
	)
	await populateProfile(
		{ ...initialProfileValuesUserTwo, skills: ['sql', 'express', 'node'] },
		userTwo.token,
		200
	)
	await populateProfile(
		{
			...initialProfileValuesUserOne,
			skills: ['sql', 'express', 'react', 'node', 'mongodb'],
		},
		userOne.token,
		200
	)

	// User one creates a project 1
	// User one creates a project 2
	await createProject(
		{
			...projectUserOne1,
			skills: ['express', 'react', 'node'],
			tags: ['blog', 'ecommerce', 'wordpress'],
		},
		userOne.token,
		201
	)
	await createProject(
		{ ...projectUserOne2, skills: ['node', 'express'], tags: ['ecommerce'] },
		userOne.token,
		201
	)
	// User two creates a project 1
	// User two creates a project 2
	await createProject(
		{ ...projectUserTwo1, skills: ['node', 'react'], tags: ['ecommerce'] },
		userTwo.token,
		201
	)
	await createProject(
		{
			...projectUserTwo2,
			skills: ['node', 'mongodb'],
			tags: ['website', 'blog'],
		},
		userTwo.token,
		201
	)
	// User three creates a project 1
	// User three creates a project 2
	await createProject(
		{
			...projectUserThree1,
			skills: ['express'],
			tags: ['website', 'wordpress', 'blog'],
		},
		userThree.token,
		201
	)
	await createProject(
		{ ...projectUserThree2, skills: ['sql'], tags: ['easy', 'blog'] },
		userThree.token,
		201
	)

	// "In demand"
	// Node 4
	// Express 3
	// React 2
	// SQL 1
	// MongoDB 1

	// Fetch skills with pagination in_demand
	// Check if order is good and pagination works
	const { skills: allSkillsInDemand } = await fetchSkills({
		start: 0,
		end: 9,
		type: 'in_demand',
	})
	expect(allSkillsInDemand.results.length).toBe(5)
	expect(allSkillsInDemand.results[0].name).toBe('node')
	expect(allSkillsInDemand.results[1].name).toBe('express')
	expect(allSkillsInDemand.results[2].name).toBe('react')

	// "Popular"
	// SQL 4
	// Express 3
	// React 2
	// Node 2
	// MongoDB 1

	// Fetch skills with pagination popular
	// Check if order is good and pagination works
	const { skills: allSkillsPopular } = await fetchSkills({
		start: 0,
		end: 9,
		type: 'popular',
	})
	expect(allSkillsPopular.results.length).toBe(5)
	expect(allSkillsPopular.results[0].name).toBe('sql')
	expect(allSkillsPopular.results[1].name).toBe('express')

	// Fetch latest skills (default, no type sent)
	const { skills: allSkillsDefault } = await fetchSkills({ start: 0, end: 9 })
	expect(allSkillsDefault.results.length).toBe(5)
	expect(allSkillsDefault.results[0].name).toBe('mongodb')
	expect(allSkillsDefault.results[1].name).toBe('node')
	expect(allSkillsDefault.results[4].name).toBe('sql')

	// Fetch latest skills (default, no type sent)
	const { skills: allSkillsDefaultOnly1 } = await fetchSkills({
		start: 1,
		end: 1,
	})
	expect(allSkillsDefaultOnly1.results.length).toBe(1)
	expect(allSkillsDefaultOnly1.results[0].name).toBe('node')

	// "Tags"
	// blog 4
	// ecommerce 3
	// wordpress 2
	// website 2
	// easy 1

	// Fetch tags with pagination
	// Check if order is good and pagination works
	const { tags: allTags } = await fetchTags({ start: 0, end: 9 })
	expect(allTags.results.length).toBe(5)
	expect(allTags.results[0].name).toBe('blog')
	expect(allTags.results[1].name).toBe('ecommerce')
	expect(allTags.results[4].name).toBe('easy')

	const { tags: allTags2 } = await fetchTags({ start: 1, end: 3 })
	expect(allTags2.results.length).toBe(3)
	expect(allTags2.results[0].name).toBe('ecommerce')
})

test('/getLatestProjectsPagination', async () => {
	// User two registers
	// User three registers
	await registerNewUser(userTwo, 201)
	await registerNewUser(userThree, 201)
	await registerNewUser(userFour, 201)

	// Users populate profiles
	await populateProfile(
		{ ...initialProfileValuesUserFour, skills: ['sql'] },
		userFour.token,
		200
	)
	await populateProfile(
		{ ...initialProfileValuesUserThree, skills: ['sql', 'express', 'react'] },
		userThree.token,
		200
	)
	await populateProfile(
		{ ...initialProfileValuesUserTwo, skills: ['sql', 'express', 'node'] },
		userTwo.token,
		200
	)
	await populateProfile(
		{
			...initialProfileValuesUserOne,
			skills: ['sql', 'express', 'react', 'node', 'mongodb'],
		},
		userOne.token,
		200
	)

	// User one creates a project 1
	// User one creates a project 2
	await createProject(
		{
			...projectUserOne1,
			skills: ['express', 'react', 'node'],
			tags: ['blog', 'ecommerce', 'wordpress'],
		},
		userOne.token,
		201
	)
	await createProject(
		{ ...projectUserOne2, skills: ['node', 'express'], tags: ['ecommerce'] },
		userOne.token,
		201
	)
	// User two creates a project 1
	// User two creates a project 2
	const { project: projectUserTwoFirst } = await createProject(
		{ ...projectUserTwo1, skills: ['node', 'react'], tags: ['ecommerce'] },
		userTwo.token,
		201
	)
	const { project: projectUserTwoSecond } = await createProject(
		{
			...projectUserTwo2,
			skills: ['node', 'mongodb'],
			tags: ['website', 'blog'],
		},
		userTwo.token,
		201
	)
	// User three creates a project 1
	// User three creates a project 2
	const { project: projectUserThreeFirst } = await createProject(
		{
			...projectUserThree1,
			skills: ['express'],
			tags: ['website', 'wordpress', 'blog'],
		},
		userThree.token,
		201
	)
	const { project: projectUserThreeSecond } = await createProject(
		{ ...projectUserThree2, skills: ['sql'], tags: ['easy', 'blog'] },
		userThree.token,
		201
	)

	// Get latest projects
	// Check if order and pagination works
	const { projects: projectsFeed } = await fetchLatestProjectsPagination({
		token: userOne.token,
		start: 0,
		end: 9,
	})
	expect(projectsFeed.results.length).toBe(4)
	expect(projectsFeed.results[0].id).toBe(projectUserThreeSecond.id)
	expect(projectsFeed.results[1].id).toBe(projectUserThreeFirst.id)
	expect(projectsFeed.results[2].id).toBe(projectUserTwoSecond.id)
	expect(projectsFeed.results[3].id).toBe(projectUserTwoFirst.id)

	// User one blocks user two
	// News feed check
	// User one unblocks user two
	await blockUser(userOne.token, userTwo.id, 200)

	const { projects: projectsFeed2 } = await fetchLatestProjectsPagination({
		token: userOne.token,
		start: 0,
		end: 9,
	})
	expect(projectsFeed2.results.length).toBe(2)
	expect(projectsFeed2.results[0].id).toBe(projectUserThreeSecond.id)
	expect(projectsFeed2.results[1].id).toBe(projectUserThreeFirst.id)

	await unblockUser(userOne.token, userTwo.id, 200)

	// User two blocks user one
	// News feed check
	await blockUser(userTwo.token, userOne.id, 200)

	const { projects: projectsFeed3 } = await fetchLatestProjectsPagination({
		token: userOne.token,
		start: 0,
		end: 9,
	})
	expect(projectsFeed3.results.length).toBe(2)
	expect(projectsFeed3.results[0].id).toBe(projectUserThreeSecond.id)
	expect(projectsFeed3.results[1].id).toBe(projectUserThreeFirst.id)

	await unblockUser(userTwo.token, userOne.id, 200)

	// Check if pagination works
	const { projects: projectsFeed4 } = await fetchLatestProjectsPagination({
		token: userOne.token,
		start: 0,
		end: 1,
	})
	expect(projectsFeed4.results.length).toBe(2)
	expect(projectsFeed4.results[0].id).toBe(projectUserThreeSecond.id)
	expect(projectsFeed4.results[1].id).toBe(projectUserThreeFirst.id)
})

test('[/fetchPotentialUsers /fetchPotentialProjects] with pagination', async () => {
	// Users registering
	await registerNewUser(userThree, 201)
	await registerNewUser(userFour, 201)
	await registerNewUser(userFive, 201)
	await registerNewUser(userSix, 201)
	await registerNewUser(userSeven, 201)
	await registerNewUser(userEight, 201)
	await registerNewUser(userTwo, 201)

	// Users creating profiles
	await populateProfile(
		{
			...initialProfileValuesUserTwo,
			skills: ['node', 'express', 'react', 'sql', 'mongodb'],
		},
		userTwo.token,
		200
	)
	await populateProfile(
		{
			...initialProfileValuesUserThree,
			skills: ['node', 'express', 'react', 'sql', 'irrelevant'],
		},
		userThree.token,
		200
	)
	await populateProfile(
		{
			...initialProfileValuesUserFour,
			skills: ['node', 'express', 'react', 'irrelevant2', 'irrelevant'],
		},
		userFour.token,
		200
	)
	await populateProfile(
		{
			...initialProfileValuesUserFive,
			skills: ['node', 'express', 'irrelevant3', 'irrelevant2', 'irrelevant'],
		},
		userFive.token,
		200
	)
	await populateProfile(
		{
			...initialProfileValuesUserSix,
			skills: [
				'node',
				'irrelevant2',
				'irrelevant3',
				'irrelevant2',
				'irrelevant',
			],
		},
		userSix.token,
		200
	)
	await populateProfile(
		{
			...initialProfileValuesUserSeven,
			skills: ['node', 'express', 'react', 'sql', 'mongodb'],
		},
		userSeven.token,
		200
	)
	await populateProfile(
		{ ...initialProfileValuesUserEight, skills: ['irrelevant'] },
		userEight.token,
		200
	)

	// User one blocks user seven
	await blockUser(userOne.token, userSeven.id, 200)

	// User one creates a project
	const { project: projectUserOne } = await createProject(
		{
			...projectUserOne1,
			skills: ['node', 'express', 'react', 'sql', 'mongodb'],
		},
		userOne.token,
		201
	)

	const { project: projectUserTwoFirst } = await createProject(
		{ ...projectUserTwo1, skills: ['node', 'express'] },
		userTwo.token,
		201
	)
	const { project: projectUserTwoSecond } = await createProject(
		{ ...projectUserTwo2, skills: ['node', 'express', 'react', 'mongodb'] },
		userTwo.token,
		201
	)
	const { project: projectUserThreeFirst } = await createProject(
		{ ...projectUserThree1, skills: ['react', 'sql', 'mongodb'] },
		userThree.token,
		201
	)
	await createProject(
		{ ...projectUserThree2, skills: ['irrelevant'] },
		userThree.token,
		201
	)
	const { project: projectUserFourFirst } = await createProject(
		{
			...projectUserFour1,
			skills: ['node', 'express', 'react', 'sql', 'mongodb'],
		},
		userFour.token,
		201
	)
	await createProject(
		{
			...projectUserSeven1,
			skills: ['node', 'express', 'react', 'sql', 'mongodb'],
		},
		userSeven.token,
		201
	)

	// Check if pagination and order works as expected
	const { users: potentialUsersProjectUserOne } = await fetchPotentialUsers({
		token: userOne.token,
		projectId: projectUserOne.id,
		start: 0,
		end: 2,
	})
	expect(potentialUsersProjectUserOne.results.length).toBe(3)
	expect(potentialUsersProjectUserOne.results[0].id).toBe(userTwo.id)
	expect(potentialUsersProjectUserOne.results[0].skills.length).toBe(5)
	expect(potentialUsersProjectUserOne.results[1].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne.results[1].skills.length).toBe(4)
	expect(potentialUsersProjectUserOne.results[2].id).toBe(userFour.id)
	expect(potentialUsersProjectUserOne.results[2].skills.length).toBe(3)

	// Check if no blocked user
	const { users: potentialUsersProjectUserOne2 } = await fetchPotentialUsers({
		token: userOne.token,
		projectId: projectUserOne.id,
	})
	expect(potentialUsersProjectUserOne2.results.length).toBe(5)
	expect(potentialUsersProjectUserOne2.results[0].id).toBe(userTwo.id)
	expect(
		potentialUsersProjectUserOne2.results
			.map((u) => u.id)
			.includes(userSeven.id)
	).toBe(false)

	// User seven populates profile with skills
	await populateProfile(
		{
			...initialProfileValuesUserSeven,
			skills: ['node', 'express', 'react', 'sql', 'mongodb'],
		},
		userSeven.token,
		200
	)

	// User seven gets potential projects
	const { projects: potentialProjectsUserSeven } = await fetchPotentialProjects(
		userSeven.token,
		200
	)
	expect(potentialProjectsUserSeven.results.length).toBe(4)
	expect(potentialProjectsUserSeven.results[0].id).toBe(projectUserFourFirst.id)
	expect(potentialProjectsUserSeven.results[0].matchedSkills).toBe(5)
	expect(potentialProjectsUserSeven.results[1].id).toBe(projectUserTwoSecond.id)
	expect(potentialProjectsUserSeven.results[1].matchedSkills).toBe(4)
	expect(potentialProjectsUserSeven.results[2].id).toBe(
		projectUserThreeFirst.id
	)
	expect(potentialProjectsUserSeven.results[2].matchedSkills).toBe(3)
	expect(potentialProjectsUserSeven.results[3].id).toBe(projectUserTwoFirst.id)
	expect(potentialProjectsUserSeven.results[3].matchedSkills).toBe(2)

	// Check if order works properly
	const {
		projects: potentialProjectsUserSeven2,
	} = await fetchPotentialProjects(userSeven.token, 200, 0, 1)
	expect(potentialProjectsUserSeven2.results.length).toBe(2)
	expect(potentialProjectsUserSeven2.results[0].id).toBe(
		projectUserFourFirst.id
	)
	expect(potentialProjectsUserSeven2.results[0].matchedSkills).toBe(5)
	expect(potentialProjectsUserSeven2.results[1].id).toBe(
		projectUserTwoSecond.id
	)
	expect(potentialProjectsUserSeven2.results[1].matchedSkills).toBe(4)
})

test('/sendProjectApplication, /getProjectApplicationsForProjectId, /markProjectApplicationRead, /markProjectApplicationArchived', async () => {
	// Users registering
	await registerNewUser(userTwo, 201)
	await registerNewUser(userThree, 201)
	await registerNewUser(userFour, 201)
	await registerNewUser(userFive, 201)

	// User one creates a project
	const { project } = await createProject(
		{ ...projectUserOne1, skills: ['react'], tags: ['blog'] },
		userOne.token,
		201
	)

	const applicationUserTwoData = {
		message: 'Please check my profile if you are interested in hiring me.',
		email: 'usertwo@gmail.com',
	}
	const applicationUserThreeData = {
		message: 'Please check my profile if you are interested in hiring me.',
		email: 'userthree@gmail.com',
	}
	const applicationUserFourData = {
		message: 'Please check my profile if you are interested in hiring me.',
		email: 'userfour@gmail.com',
	}

	// User one sends a project application for user one's project
	const {
		projectApplication: projectApplicationUserTwo,
	} = await sendProjectApplication({
		token: userTwo.token,
		projectId: project.id,
		application: { ...applicationUserTwoData },
	})
	expect(projectApplicationUserTwo.user_id).toBe(userTwo.id)
	expect(projectApplicationUserTwo.project_id).toBe(project.id)
	expect(projectApplicationUserTwo.status).toBe('sent')
	expect(projectApplicationUserTwo.message).toBe(applicationUserTwoData.message)
	expect(projectApplicationUserTwo.email).toBe(applicationUserTwoData.email)

	// Check if there's a project application in the db
	const projectApplications = await ProjectApplication.query()
	expect(projectApplications.length).toBe(1)

	// Check if user one receives a notification
	const { notifications: notificationsUserOne } = await getNotifications(
		userOne.token,
		200
	)
	expect(notificationsUserOne.results.length).toBe(1)

	// User one tries to send an application again
	await sendProjectApplication({
		token: userTwo.token,
		projectId: project.id,
		application: { ...applicationUserTwoData },
		status: 400,
	})

	// User one blocks user three, user three tries to send application
	await blockUser(userOne.token, userThree.id, 200)
	await sendProjectApplication({
		token: userThree.token,
		projectId: project.id,
		application: { ...applicationUserThreeData },
		status: 403,
	})

	// User four blocks user one
	await blockUser(userFour.token, userOne.id, 200)
	await sendProjectApplication({
		token: userFour.token,
		projectId: project.id,
		application: { ...applicationUserFourData },
		status: 403,
	})

	// User one fetches project invitations for project
	const {
		projectApplications: projectApplicationsFetched,
	} = await getProjectApplications({
		token: userOne.token,
		projectId: project.id,
	})
	expect(projectApplicationsFetched.results.length).toBe(1)
	const { projectApplication } = await getSingleProjectApplication({
		token: userOne.token,
		projectApplicationId: projectApplicationsFetched.results[0].id,
	})
	expect(projectApplication.user_id).toBe(userTwo.id)
	expect(projectApplication.message).toBe(
		'Please check my profile if you are interested in hiring me.'
	)
	expect(projectApplication.email).toBe('usertwo@gmail.com')
	expect(projectApplication.project_id).toBe(project.id)

	// User two fails to fetch project invitations for project
	await getProjectApplications({
		token: userTwo.token,
		projectId: project.id,
		status: 401,
	})
	await getSingleProjectApplication({
		token: userTwo.token,
		projectApplicationId: projectApplicationsFetched.results[0].id,
		status: 401,
	})

	// Users get unblocked
	await unblockUser(userOne.token, userThree.id, 200)
	await unblockUser(userFour.token, userOne.id, 200)

	// User three and four send project applications
	const {
		projectApplication: projectApplicationUserThree,
	} = await sendProjectApplication({
		token: userThree.token,
		projectId: project.id,
		application: { ...applicationUserThreeData },
	})
	const {
		projectApplication: projectApplicationUserFour,
	} = await sendProjectApplication({
		token: userFour.token,
		projectId: project.id,
		application: { ...applicationUserFourData },
	})

	// User one fetches project invitations for project
	const {
		projectApplications: projectApplicationsFetched2,
	} = await getProjectApplications({
		token: userOne.token,
		projectId: project.id,
	})
	expect(projectApplicationsFetched2.results.length).toBe(3)
	expect(projectApplicationsFetched2.results[0].id).toBe(
		projectApplicationUserFour.id
	)
	expect(projectApplicationsFetched2.results[1].id).toBe(
		projectApplicationUserThree.id
	)
	expect(projectApplicationsFetched2.results[2].id).toBe(
		projectApplicationUserTwo.id
	)

	// User one fetches project invitations for project with pagination
	const {
		projectApplications: projectApplicationsFetched3,
	} = await getProjectApplications({
		token: userOne.token,
		projectId: project.id,
		start: 1,
		end: 2,
	})
	expect(projectApplicationsFetched3.results.length).toBe(2)
	expect(projectApplicationsFetched3.results[0].id).toBe(
		projectApplicationUserThree.id
	)
	expect(projectApplicationsFetched3.results[1].id).toBe(
		projectApplicationUserTwo.id
	)

	// User one marks PAU4  read
	await markProjectApplicationRead({
		token: userOne.token,
		projectApplicationId: projectApplicationUserFour.id,
	})

	// User one fetches only read applications
	const {
		projectApplications: projectApplicationsFetched4,
	} = await getProjectApplications({
		token: userOne.token,
		projectId: project.id,
		type: 'read',
	})
	expect(projectApplicationsFetched4.results.length).toBe(1)
	expect(projectApplicationsFetched4.results[0].id).toBe(
		projectApplicationUserFour.id
	)

	// User one marks PAU3 archived
	await markProjectApplicationArchived({
		token: userOne.token,
		projectApplicationId: projectApplicationUserThree.id,
	})

	// User one fetches archived PA
	const {
		projectApplications: projectApplicationsFetched5,
	} = await getProjectApplications({
		token: userOne.token,
		projectId: project.id,
		type: 'archived',
	})
	expect(projectApplicationsFetched5.results.length).toBe(1)
	expect(projectApplicationsFetched5.results[0].id).toBe(
		projectApplicationUserThree.id
	)

	// User one marks user five as a potential candidate
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project.id,
		userId: userFive.id,
		status: 200,
	})

	// User five checks notifications, finding the one about being marked
	const { notifications: notificationsUserFive } = await getNotifications(
		userFive.token,
		200
	)
	expect(notificationsUserFive.results.length).toBe(1)
	expect(notificationsUserFive.results[0].event.type).toBe(
		'potential_candidate_marked'
	)
	expect(notificationsUserFive.results[0].event.project_id).toBe(project.id)
	expect(notificationsUserFive.results[0].event.triggering_user_id).toBe(
		userOne.id
	)
	expect(notificationsUserFive.results[0].event.target_user_id).toBe(
		userFive.id
	)

	// User one gets all users that he marked as potential candidates
	const { markedCandidates } = await fetchedMarkedPotentialCandidates({
		token: userOne.token,
		projectId: project.id,
	})
	expect(markedCandidates.results.length).toBe(1)
	expect(markedCandidates.results[0].id).toBe(userFive.id)

	// User five blocks user one
	// User one gets all users that he marked as potential candidates, expecting 1, but can't fetch its profile
	// User five unblocks user one
	await blockUser(userFive.token, userOne.id, 200)

	const {
		markedCandidates: markedCandidatesAfterBlock,
	} = await fetchedMarkedPotentialCandidates({
		token: userOne.token,
		projectId: project.id,
	})
	expect(markedCandidatesAfterBlock.results.length).toBe(1)
	expect(markedCandidatesAfterBlock.results[0].id).toBe(userFive.id)
	await fetchUserById(
		userOne.token,
		markedCandidatesAfterBlock.results[0].id,
		403
	)

	await unblockUser(userFive.token, userOne.id, 200)

	// User one blocks user five
	// User one gets all users that he marked as potential candidates, expecting 1 he can't fetch
	await blockUser(userOne.token, userFive.id, 200)

	const {
		markedCandidates: markedCandidatesAfterBlock2,
	} = await fetchedMarkedPotentialCandidates({
		token: userOne.token,
		projectId: project.id,
	})
	expect(markedCandidatesAfterBlock2.results.length).toBe(1)
	expect(markedCandidatesAfterBlock2.results[0].id).toBe(userFive.id)
	await fetchUserById(
		userOne.token,
		markedCandidatesAfterBlock2.results[0].id,
		403
	)

	await unblockUser(userOne.token, userFive.id, 200)

	const {
		markedCandidates: markedCandidatesAfterUnblock,
	} = await fetchedMarkedPotentialCandidates({
		token: userOne.token,
		projectId: project.id,
	})
	expect(markedCandidatesAfterUnblock.results.length).toBe(1)
	expect(markedCandidatesAfterUnblock.results[0].id).toBe(userFive.id)
	await fetchUserById(
		userOne.token,
		markedCandidatesAfterUnblock.results[0].id,
		200
	)

	// User five gets all the projects where he's marked as a potential candidate
	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarked1,
	} = await fetchProjectsWhereLoggedUserIsMarked({ token: userFive.token })
	expect(projectsWhereUserIsMarked1.results.length).toBe(1)
	expect(projectsWhereUserIsMarked1.results[0].id).toBe(project.id)
	await fetchProjectById(userFive.token, project.id, 200)

	// User five gets all projects (0) after blocking user one
	await blockUser(userFive.token, userOne.id, 200)
	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarked2,
	} = await fetchProjectsWhereLoggedUserIsMarked({ token: userFive.token })
	expect(projectsWhereUserIsMarked2.results.length).toBe(1)
	expect(projectsWhereUserIsMarked2.results[0].id).toBe(project.id)
	await fetchProjectById(userFive.token, project.id, 403)

	await unblockUser(userFive.token, userOne.id, 200)
	// User five gets all projects (1) after user one blocks him, but can't fetch it
	await blockUser(userOne.token, userFive.id, 200)

	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarked3,
	} = await fetchProjectsWhereLoggedUserIsMarked({ token: userFive.token })
	expect(projectsWhereUserIsMarked3.results.length).toBe(1)
	expect(projectsWhereUserIsMarked3.results[0].id).toBe(project.id)
	await fetchProjectById(userFive.token, project.id, 403)

	await unblockUser(userOne.token, userFive.id, 200)

	// **
	// Checking delete user aftermath
	// **

	// User one populates profile
	await populateProfile(
		{ ...initialProfileValuesUserOne, skills: ['node', 'react', 'express'] },
		userOne.token,
		200
	)

	await deleteLoggedUser({ token: userOne.token })

	// Should be no projects
	// Should be no project applications
	// Should be no marked candidates
	// Should be two skills with 0 count of each type
	// Should be one tag with 0 count
	// Should five should fetch 0 projects where he's marked
	const allProjects = await Project.query()
	expect(allProjects.length).toBe(0)

	const allProjectApplications = await ProjectApplication.query()
	expect(allProjectApplications.length).toBe(0)

	const allMarkedCandidates = await MarkedCandidate.query()
	expect(allMarkedCandidates.length).toBe(0)

	const allSkills = await Skill.query()
	expect(allSkills.length).toBe(3)
	const node = allSkills.find((s) => s.name === 'node')
	const react = allSkills.find((s) => s.name === 'react')
	const express = allSkills.find((s) => s.name === 'express')
	expect(node.has_skills_count).toBe(0)
	expect(node.required_skills_count).toBe(0)
	expect(react.has_skills_count).toBe(0)
	expect(react.required_skills_count).toBe(0)
	expect(express.has_skills_count).toBe(0)
	expect(express.required_skills_count).toBe(0)

	const allTags = await Tag.query()
	expect(allTags.length).toBe(1)
	expect(allTags[0].count).toBe(0)

	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarkedAfterDelete,
	} = await fetchProjectsWhereLoggedUserIsMarked({ token: userFive.token })
	expect(projectsWhereUserIsMarkedAfterDelete.results.length).toBe(0)
})

test('fetchedMarkedPotentialCandidates pagination', async () => {
	// Users registering
	await registerNewUser(userFive, 201)
	await registerNewUser(userTwo, 201)
	await registerNewUser(userFour, 201)
	await registerNewUser(userThree, 201)

	// User one creates a project
	const { project: project2 } = await createProject(
		{ ...projectUserOne2, skills: ['node'], tags: ['blog'] },
		userOne.token,
		201
	)
	const { project } = await createProject(
		{ ...projectUserOne1, skills: ['react'], tags: ['wordpress'] },
		userOne.token,
		201
	)

	// User one marks user two, three, four
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project.id,
		userId: userTwo.id,
		status: 200,
	})
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project.id,
		userId: userThree.id,
		status: 200,
	})
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project.id,
		userId: userFour.id,
		status: 200,
	})
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project.id,
		userId: userFive.id,
		status: 200,
	})

	// For project 2
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project2.id,
		userId: userTwo.id,
		status: 200,
	})

	// Check pagination for fetched marked users
	const {
		markedCandidates: markedCandidates,
	} = await fetchedMarkedPotentialCandidates({
		token: userOne.token,
		projectId: project.id,
	})
	expect(markedCandidates.results.length).toBe(4)
	expect(markedCandidates.results[0].id).toBe(userFive.id)
	expect(markedCandidates.results[1].id).toBe(userFour.id)
	expect(markedCandidates.results[2].id).toBe(userThree.id)
	expect(markedCandidates.results[3].id).toBe(userTwo.id)

	const {
		markedCandidates: markedCandidatesPagination,
	} = await fetchedMarkedPotentialCandidates({
		token: userOne.token,
		projectId: project.id,
		start: 1,
		end: 2,
	})
	expect(markedCandidatesPagination.results.length).toBe(2)

	// Check fetchProjectsWhereLoggedUserIsMarked with multiple projects, pagination and order
	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarked,
	} = await fetchProjectsWhereLoggedUserIsMarked({ token: userTwo.token })
	expect(projectsWhereUserIsMarked.results.length).toBe(2)
	expect(projectsWhereUserIsMarked.results[0].id).toBe(project2.id)
	expect(projectsWhereUserIsMarked.results[1].id).toBe(project.id)

	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarked2,
	} = await fetchProjectsWhereLoggedUserIsMarked({
		token: userTwo.token,
		start: 1,
		end: 1,
	})
	expect(projectsWhereUserIsMarked2.results.length).toBe(1)
	expect(projectsWhereUserIsMarked2.results[0].id).toBe(project.id)

	// Add applications
	const applicationUserTwoData = {
		message: 'Please check my profile if you are interested in hiring me.',
		email: 'usertwo@gmail.com',
	}
	const applicationUserThreeData = {
		message: 'Please check my profile if you are interested in hiring me.',
		email: 'userthree@gmail.com',
	}
	const {
		projectApplication: projectApplicationUserTwo,
	} = await sendProjectApplication({
		token: userTwo.token,
		projectId: project.id,
		application: { ...applicationUserTwoData },
	})
	const {
		projectApplication: projectApplicationUserThree,
	} = await sendProjectApplication({
		token: userThree.token,
		projectId: project.id,
		application: { ...applicationUserThreeData },
	})

	const {
		projectApplications: projectApplicationsFetched,
	} = await getProjectApplications({
		token: userOne.token,
		projectId: project.id,
	})
	expect(projectApplicationsFetched.results.length).toBe(2)
	expect(projectApplicationsFetched.results[0].id).toBe(
		projectApplicationUserThree.id
	)
	expect(projectApplicationsFetched.results[1].id).toBe(
		projectApplicationUserTwo.id
	)

	// Fetch marked potential candidates who reacted, should be 2
	// Fetch marked potential candidates who didn't reacted, should be 2
	const {
		markedCandidates: markedCandidatesReacted,
	} = await fetchedMarkedPotentialCandidates({
		token: userOne.token,
		projectId: project.id,
		type: 'reacted',
	})
	expect(markedCandidatesReacted.results.length).toBe(2)
	expect(markedCandidatesReacted.results[0].id).toBe(userThree.id)
	expect(markedCandidatesReacted.results[1].id).toBe(userTwo.id)

	const {
		markedCandidates: markedCandidatesNotReacted,
	} = await fetchedMarkedPotentialCandidates({
		token: userOne.token,
		projectId: project.id,
		type: 'not_reacted',
	})
	expect(markedCandidatesNotReacted.results.length).toBe(2)
	expect(markedCandidatesNotReacted.results[0].id).toBe(userFive.id)
	expect(markedCandidatesNotReacted.results[1].id).toBe(userFour.id)

	// **
	// Checking delete project aftermath
	// **
	await deleteProject(project.id, userOne.token, 200)
	await deleteProject(project2.id, userOne.token, 200)

	// Should be no projects
	// Should be no project applications
	// Should be no marked candidates
	// Should be two skills with 0 count of each type
	// Should be one tag with 0 count
	const allProjects = await Project.query()
	expect(allProjects.length).toBe(0)

	const allProjectApplications = await ProjectApplication.query()
	expect(allProjectApplications.length).toBe(0)

	const allMarkedCandidates = await MarkedCandidate.query()
	expect(allMarkedCandidates.length).toBe(0)

	const allSkills = await Skill.query()
	expect(allSkills.length).toBe(2)
	const node = allSkills.find((s) => s.name === 'node')
	const react = allSkills.find((s) => s.name === 'react')
	expect(node.has_skills_count).toBe(0)
	expect(node.required_skills_count).toBe(0)
	expect(react.has_skills_count).toBe(0)
	expect(react.required_skills_count).toBe(0)

	const allTags = await Tag.query()
	expect(allTags.length).toBe(2)
	expect(allTags[0].count).toBe(0)
	expect(allTags[1].count).toBe(0)

	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarked3,
	} = await fetchProjectsWhereLoggedUserIsMarked({
		token: userTwo.token,
		start: 1,
		end: 1,
	})
	expect(projectsWhereUserIsMarked3.results.length).toBe(0)

	await fetchedMarkedPotentialCandidates({
		token: userOne.token,
		projectId: project.id,
		status: 404,
	})
})

test('fetchProjectsWhereMarked type check', async () => {
	await registerNewUser(userTwo, 201)
	// User two registers

	// User one creates project 1
	// User one creates project 2
	// User one creates project 3
	// User one creates project 4
	// User one creates project 5
	const { project: project5 } = await createProject(
		{ ...projectUserOne5, skills: ['node'], tags: ['blog'] },
		userOne.token,
		201
	)
	const { project: project2 } = await createProject(
		{ ...projectUserOne2, skills: ['node'], tags: ['blog'] },
		userOne.token,
		201
	)
	const { project: project3 } = await createProject(
		{ ...projectUserOne3, skills: ['node'], tags: ['blog'] },
		userOne.token,
		201
	)
	const { project } = await createProject(
		{ ...projectUserOne1, skills: ['react'], tags: ['wordpress'] },
		userOne.token,
		201
	)
	const { project: project4 } = await createProject(
		{ ...projectUserOne4, skills: ['node'], tags: ['blog'] },
		userOne.token,
		201
	)

	// User one marks user two as potential candidate for 5 projects
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project2.id,
		userId: userTwo.id,
		status: 200,
	})
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project5.id,
		userId: userTwo.id,
		status: 200,
	})
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project.id,
		userId: userTwo.id,
		status: 200,
	})
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project3.id,
		userId: userTwo.id,
		status: 200,
	})
	await markPotentialCandidate({
		token: userOne.token,
		projectId: project4.id,
		userId: userTwo.id,
		status: 200,
	})

	// User two sends application for 3 projects
	const applicationUserTwoData = {
		message: 'Please check my profile if you are interested in hiring me.',
		email: 'usertwo@gmail.com',
	}
	await sendProjectApplication({
		token: userTwo.token,
		projectId: project3.id,
		application: { ...applicationUserTwoData },
	})
	await sendProjectApplication({
		token: userTwo.token,
		projectId: project.id,
		application: { ...applicationUserTwoData },
	})
	await sendProjectApplication({
		token: userTwo.token,
		projectId: project2.id,
		application: { ...applicationUserTwoData },
	})

	// User two fetches projects he's marked (5)
	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarked,
	} = await fetchProjectsWhereLoggedUserIsMarked({ token: userTwo.token })
	expect(projectsWhereUserIsMarked.results.length).toBe(5)
	expect(projectsWhereUserIsMarked.results[0].id).toBe(project4.id)
	expect(projectsWhereUserIsMarked.results[4].id).toBe(project2.id)

	// User two fetches projects but the ones he reacted to (3)
	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarkedReacted,
	} = await fetchProjectsWhereLoggedUserIsMarked({
		token: userTwo.token,
		type: 'reacted',
	})
	expect(projectsWhereUserIsMarkedReacted.results.length).toBe(3)
	expect(projectsWhereUserIsMarkedReacted.results[0].id).toBe(project3.id)
	expect(projectsWhereUserIsMarkedReacted.results[1].id).toBe(project.id)
	expect(projectsWhereUserIsMarkedReacted.results[2].id).toBe(project2.id)

	// User two fetches projects but the ones he didn't react to
	const {
		projectsWhereUserIsMarked: projectsWhereUserIsMarkedNotReacted,
	} = await fetchProjectsWhereLoggedUserIsMarked({
		token: userTwo.token,
		type: 'not_reacted',
	})
	expect(projectsWhereUserIsMarkedNotReacted.results.length).toBe(2)
	expect(projectsWhereUserIsMarkedNotReacted.results[0].id).toBe(project4.id)
	expect(projectsWhereUserIsMarkedNotReacted.results[1].id).toBe(project5.id)
})

test('Search skills and tags', async () => {
	// User one creates a project
	await createProject(
		{
			...projectUserOne1,
			skills: [
				'SQL',
				'Node',
				'Node.js',
				'node',
				'nodejs',
				'MongoDB',
				'MONGODB',
			],
			tags: ['ecommerce', 'irrelevant', 'Ecommerce', 'commercial'],
		},
		userOne.token,
		201
	)

	const { skills: skillsNode1 } = await searchSkills({ searchValue: 'node.js' })
	const { skills: skillsNode2 } = await searchSkills({ searchValue: 'nodejs' })
	const { skills: skillsNode3 } = await searchSkills({ searchValue: 'node' }) // Fetches all 3

	const { tags: tagsEcommerce1 } = await searchTags({
		searchValue: 'e-commerce',
	}) // Only fetches ecommerce and Ecommerce
	const { tags: tagsEcommerce2 } = await searchTags({ searchValue: 'commerce' }) // Only fetches ecommerce and Ecommmerce

	expect(skillsNode1.length).toBe(2)
	expect(skillsNode1[0].name).toBe('nodejs')
	expect(skillsNode1[1].name).toBe('node')

	expect(skillsNode2.length).toBe(2)
	expect(skillsNode2[0].name).toBe('nodejs')
	expect(skillsNode2[1].name).toBe('node')

	expect(skillsNode3.length).toBe(2)
	expect(skillsNode3[0].name).toBe('node')
	expect(skillsNode3[1].name).toBe('nodejs')

	expect(tagsEcommerce1.length).toBe(2)
	expect(tagsEcommerce1[0].name).toBe('ecommerce')
	expect(tagsEcommerce1[1].name).toBe('commercial')

	expect(tagsEcommerce2.length).toBe(2)
	expect(tagsEcommerce2[0].name).toBe('ecommerce')
	expect(tagsEcommerce2[1].name).toBe('commercial')
})
