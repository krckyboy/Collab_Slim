/* eslint-disable indent */
/* eslint-disable no-undef */
const request = require('supertest')
const app = require('../app')

const {
	userOne,
	userTwo,
	userThree,
	userFour,
	initialProfileValuesUserOne,
	initialProfileValuesUserTwo,
	initialProfileValuesUserThree,
	registerNewUser,
	login, // new
	checkCount, // new
	compareValues, // new
	projectUserOne1, // new
	projectUserOne2, // new
	projectUserTwo1, // new
	projectUserThree1,
	projectUserFour1,
	populateProfile,
	createProject,
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
	const projects = await Project.query().eager('[required_skills, has_tags]')
	expect(projects.length).toBe(1)
	expect(projects[0].owner_id).toBe(userTwo.id)
	expect(projects[0].required_skills.length).toBe(2)
	expect(projects[0].has_tags.length).toBe(1)
	expect(projects[0].has_tags[0].name).toBe('ecommerce')

	// Check if only user two exists
	const users = await User.query()
	expect(users.length).toBe(1)
	expect(users[0].id).toBe(userTwo.id)

	// Checks skills count before user 2 is gone (has_skills)	
	const skills1 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills1, length: 4, values: { express: 1, node: 0, mongodb: 0, react: 0 } })

	// Checks skills count before user 2 is gone (required_skills)	
	checkCount({ type: 'required_skills_count', arr: skills1, length: 4, values: { express: 0, node: 1, mongodb: 1, react: 0 } })

	// Checks tags count before user 2 is gone (has_skills)	
	const tags1 = await Tag.query()
	checkCount({ type: 'count', arr: tags1, length: 2, values: { ecommerce: 1, easy: 0 } })

	await request(app)
		.delete('/api/users')
		.set('Authorization', `Bearer ${userTwo.token}`)
		.expect(200)

	// Check skills after deleting both
	const skills2 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills2, length: 4, values: { express: 0, node: 0, mongodb: 0, react: 0 } })
	checkCount({ type: 'required_skills_count', arr: skills2, length: 4, values: { express: 0, node: 0, mongodb: 0, react: 0 } })

	// Check skills after deleting both
	const tags2 = await Tag.query()
	checkCount({ type: 'count', arr: tags2, length: 2, values: { ecommerce: 0, easy: 0 } })
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
	expect(fetchedUserTwo.user.email).toBe(undefined)

	// User two fetches user one [200]
	const fetchedUserOne = await fetchUserById(userTwo.token, userOne.id, 200)
	expect(fetchedUserOne.user.id).toBe(userOne.id)
	expect(fetchedUserOne.user.name).toBe(userOne.name)
	expect(fetchedUserOne.user.email).toBe(undefined)
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
	checkCount({ type: 'has_skills_count', arr: skilluserOneSkills2, length: 2, values: { node: 1, react: 2, } })

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
	}

	const userOneFetched3 = await fetchUserById(userOne.token, userOne.id, 200)

	compareValues({
		obj: userOneFetched3.user,
		values: valuesWhenSentNoneForSkillsAndSomeData
	})

	// Check skills, should only be user two's
	const skills4 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills4, length: 3, values: { react: 1, express: 1, node: 0 } })

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
	checkCount({ type: 'has_skills_count', arr: skills5, length: 3, values: { react: 2, express: 2, node: 0 } })

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
	checkCount({ type: 'has_skills_count', arr: skills6, length: 3, values: { react: 1, express: 1, node: 0 } })

	// User one tries to update profile with invalid data
	await populateProfile({
		skills: true
	}, userOne.token,
		400)

	await populateProfile({
		website: 12321
	}, userOne.token,
		400)

	// User two populates with no skills
	await populateProfile({
		...initialProfileValuesUserTwo,
		skills: [] // removing both node and react
	}, userTwo.token,
		200)

	const skills7 = await Skill.query()
	checkCount({ type: 'has_skills_count', arr: skills7, length: 3, values: { react: 0, express: 0, node: 0 } })
})

test('/createP, /archiveP, /editP, /unarchiveP /deleteP', async () => {
	// User one creates project 1
	const { project: projectUserOne } = await createProject({ ...projectUserOne1, skills: ['node', 'mongodb'], tags: ['ecommerce'] }, userOne.token, 201)

	// Check if skills exist properly with count
	const skills1 = await Skill.query()
	checkCount({ type: 'required_skills_count', arr: skills1, length: 2, values: { node: 1, mongodb: 1 } })

	// Check if tags exist properly with count
	const tags1 = await Tag.query()
	checkCount({ type: 'count', arr: tags1, length: 1, values: { ecommerce: 1 } })

	// User one edits project 1, removing mongodb, adding express and replacing tag
	const projectUserOneEdited = {
		name: 'user_one_project_edited',
		description: 'user_one_project_description_edited',
		url: 'www.user_one_project.com_edited'
	}
	await editProject(projectUserOne.id, { ...projectUserOneEdited, skills: ['node', 'express'], tags: ['wordpress'] }, userOne.token, 200)

	// Checking if it's successfully edited
	const { project: projectUserOneFetched1 } = await fetchProjectById(userOne.token, projectUserOne.id, 200)
	compareValues({
		obj: projectUserOneFetched1,
		values: { ...projectUserOneEdited }
	})

	// Check if skills are updated properly
	const skills2 = await Skill.query()
	checkCount({ type: 'required_skills_count', arr: skills2, length: 3, values: { node: 1, express: 1, mongodb: 0 } })

	// Check if tags are updated properly
	const tags2 = await Tag.query()
	checkCount({ type: 'count', arr: tags2, length: 2, values: { wordpress: 1, ecommerce: 0 } })

	// User one edits project once again, sending empty array for skills and array
	await editProject(projectUserOne.id, { ...projectUserOne1, skills: [], tags: [] }, userOne.token, 200)

	// Check if skills are updated properly
	const skills3 = await Skill.query()
	expect(skills3.length).toBe(3) // node mongodb express

	// Check if tags are updated properly
	const tags3 = await Tag.query()
	expect(tags3.length).toBe(2) // wordpress ecommerce

	// Check if project updated
	const projectUserOneFetched2 = await fetchProjectById(userOne.token, projectUserOne.id, 200)
	compareValues({
		obj: projectUserOneFetched2.project,
		values: { ...projectUserOne1 }
	})

	// User one edits project just to get back the skills and tags
	await editProject(projectUserOne.id, { ...projectUserOneEdited, skills: ['sql', 'express'], tags: ['easy'] }, userOne.token, 200)

	// Check if skills are updated properly
	const skills4 = await Skill.query()
	checkCount({ type: 'required_skills_count', arr: skills4, length: 4, values: { sql: 1, express: 1, node: 0, mongodb: 0 } })

	// Check if tags are updated properly
	const tags4 = await Tag.query()
	checkCount({ type: 'count', arr: tags4, length: 3, values: { easy: 1, wordpress: 0, ecommerce: 0 } })

	// User one edits project once again, sending no values for skills and array
	await editProject(projectUserOne.id, { ...projectUserOne1, }, userOne.token, 200)

	// Check if skills are updated properly
	const skills5 = await Skill.query()
	checkCount({ type: 'required_skills_count', arr: skills5, length: 4, values: { sql: 0, express: 0, node: 0, mongodb: 0 } })

	// Check if tags are updated properly
	const tags5 = await Tag.query()
	checkCount({ type: 'count', arr: tags5, length: 3, values: { easy: 0, wordpress: 0, ecommerce: 0 } })

	// User one edits project just to get back the skills and tags
	await editProject(projectUserOne.id, { ...projectUserOneEdited, skills: ['sql', 'express'], tags: ['easy'] }, userOne.token, 200)

	// Check if project updated
	const projectUserOneFetched3 = await fetchProjectById(userOne.token, projectUserOne.id, 200)
	compareValues({
		obj: projectUserOneFetched3.project,
		values: { ...projectUserOneEdited }
	})

	expect(projectUserOneFetched3.project.required_skills.length).toBe(2)
	expect(projectUserOneFetched3.project.has_tags.length).toBe(1)

	// Check if skills are updated properly
	const skills6 = await Skill.query()
	checkCount({ type: 'required_skills_count', arr: skills6, length: 4, values: { sql: 1, express: 1, node: 0, mongodb: 0 } })

	// Check if tags are updated properly
	const tags6 = await Tag.query()
	checkCount({ type: 'count', arr: tags6, length: 3, values: { easy: 1, wordpress: 0, ecommerce: 0 } })

	// User archives project
	await archiveProject(userOne.token, projectUserOne.id, 200)

	const projectUserOneFetched4 = await fetchProjectById(userOne.token, projectUserOne.id, 200)

	expect(projectUserOneFetched4.project.archived).toBe(true)
	expect(projectUserOneFetched4.project.required_skills.length).toBe(2)
	expect(projectUserOneFetched4.project.has_tags.length).toBe(1)

	// Check if skills are updated properly
	const skills7 = await Skill.query()
	checkCount({ type: 'required_skills_count', arr: skills7, length: 4, values: { sql: 0, express: 0, node: 0, mongodb: 0 } })

	// Check if tags are updated properly
	const tags7 = await Tag.query()
	checkCount({ type: 'count', arr: tags7, length: 3, values: { easy: 0, wordpress: 0, ecommerce: 0 } })

	// User two unarchives project
	await unarchiveProject(userOne.token, projectUserOne.id, 200)

	// Check skills
	const skills8 = await Skill.query()
	checkCount({ type: 'required_skills_count', arr: skills8, length: 4, values: { sql: 1, express: 1, node: 0, mongodb: 0 } })

	// Check tags
	const tags8 = await Tag.query()
	checkCount({ type: 'count', arr: tags8, length: 3, values: { easy: 1, wordpress: 0, ecommerce: 0 } })

	// Check project data along with skills and tags
	const projectUserOneFetched5 = await fetchProjectById(userOne.token, projectUserOne.id, 200)

	expect(projectUserOneFetched5.project.archived).toBe(false)
	expect(projectUserOneFetched5.project.required_skills.length).toBe(2)
	expect(projectUserOneFetched5.project.has_tags.length).toBe(1)

	compareValues({
		obj: projectUserOneFetched5.project,
		values: { ...projectUserOneEdited }
	})

	// User one edits project again with different skills and tags
	await editProject(projectUserOne.id, { ...projectUserOne1, skills: ['mongodb', 'python'], tags: ['easy', 'advanced'] }, userOne.token, 200)

	// Check skills
	const skills9 = await Skill.query()
	checkCount({ type: 'required_skills_count', arr: skills9, length: 5, values: { sql: 0, express: 0, node: 0, mongodb: 1, python: 1 } })

	// Check tags
	const tags9 = await Tag.query()
	checkCount({ type: 'count', arr: tags9, length: 4, values: { easy: 1, wordpress: 0, ecommerce: 0, advanced: 1 } })

	// Check project data along with skills and tags
	const projectUserOneFetched6 = await fetchProjectById(userOne.token, projectUserOne.id, 200)
	expect(projectUserOneFetched6.project.archived).toBe(false)
	expect(projectUserOneFetched6.project.required_skills.length).toBe(2)
	expect(projectUserOneFetched6.project.has_tags.length).toBe(2)

	compareValues({
		obj: projectUserOneFetched6.project,
		values: { ...projectUserOne1 }
	})

	// User one deletes project
	await deleteProject(projectUserOne.id, userOne.token, 200)

	// Check what happens with skills
	const skills10 = await Skill.query()
	checkCount({ type: 'required_skills_count', arr: skills10, length: 5, values: { sql: 0, express: 0, node: 0, mongodb: 0, python: 0 } })

	// Check what happens with tags
	const tags10 = await Tag.query()
	checkCount({ type: 'count', arr: tags10, length: 4, values: { easy: 0, wordpress: 0, ecommerce: 0, advanced: 0 } })

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
	await populateProfile({ ...initialProfileValuesUserOne, skills: ['node', 'express', 'react', 'sql', 'mongodb'] }, userOne.token, 200)
	await populateProfile({ ...initialProfileValuesUserTwo, skills: ['node', 'express', 'sql'] }, userTwo.token, 200)
	await populateProfile({ ...initialProfileValuesUserThree, skills: ['node', 'express'] }, userThree.token, 200)

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
	const { project: projectUserOne } = await createProject({ ...projectUserOne1, skills: ['node', 'express', 'react', 'sql', 'mongodb'] }, userOne.token, 201)
	const { project: projectUserOneSecond } = await createProject({ ...projectUserOne2, skills: ['node', 'express', 'sql'] }, userOne.token, 201)
	const { project: projectUserTwo } = await createProject({ ...projectUserTwo1, skills: ['node', 'mongodb'] }, userTwo.token, 201)
	const { project: projectUserThree } = await createProject({ ...projectUserThree1, skills: ['node', 'express', 'sql'] }, userThree.token, 201)
	const { project: projectUserFour } = await createProject({ ...projectUserFour1, skills: ['python', 'mariadb',] }, userFour.token, 201)

	// User two blocks user one
	// User two can't fetch user one's projects
	// User two unblocks user one
	await blockUser(userTwo.token, userOne.id, 200)
	await fetchUsersProjects(userOne.id, userTwo.token, 404)
	await unblockUser(userTwo.token, userOne.id, 200)

	// User 1 blocks user 2
	// User 2 cannot fetch user 1's projects
	// User 1 unblocks user 2
	await blockUser(userOne.token, userTwo.id, 200)
	await fetchUsersProjects(userTwo.id, userOne.token, 404)
	await unblockUser(userOne.token, userTwo.id, 200)

	// User two fetches user one's projects successfully
	const userOneProjects1 = await fetchUsersProjects(userOne.id, userTwo.token, 200)
	const userOneProjects1Ids = userOneProjects1.projects.map(p => p.id)
	expect(userOneProjects1.projects.length).toBe(2)
	expect(userOneProjects1Ids.includes(projectUserOne.id))
	expect(userOneProjects1Ids.includes(projectUserOneSecond.id))

	// User one fetches projects with his skills
	// Check if the number is correct and the order is good, make sure he doesn't fetch his own projects
	const { projects: projectsWithUserOneSkills1 } = await fetchPotentialProjects(userOne.token, 200)
	expect(projectsWithUserOneSkills1.length).toBe(2)
	expect(projectsWithUserOneSkills1[0].id).toBe(projectUserThree.id)
	expect(projectsWithUserOneSkills1[0].matchedSkills).toBe(3)
	expect(projectsWithUserOneSkills1[1].id).toBe(projectUserTwo.id)
	expect(projectsWithUserOneSkills1[1].matchedSkills).toBe(2)

	// User one blocks user two
	// User one fetches projects with his skills, check if there's no project of user two there
	// User one unblocks user two
	await blockUser(userOne.token, userTwo.id, 200)

	const { projects: projectsWithUserOneSkills2 } = await fetchPotentialProjects(userOne.token, 200)
	expect(projectsWithUserOneSkills2.length).toBe(1)
	expect(projectsWithUserOneSkills2[0].id).toBe(projectUserThree.id)
	expect(projectsWithUserOneSkills2[0].matchedSkills).toBe(3)

	await unblockUser(userOne.token, userTwo.id, 200)

	// User two blocks user one
	// User one fetches projects with his skills, check if there's no project of user two there
	// User two unblocks user one
	await blockUser(userTwo.token, userOne.id, 200)

	const { projects: projectsWithUserOneSkills3 } = await fetchPotentialProjects(userOne.token, 200)
	expect(projectsWithUserOneSkills3.length).toBe(1)
	expect(projectsWithUserOneSkills3[0].id).toBe(projectUserThree.id)
	expect(projectsWithUserOneSkills3[0].matchedSkills).toBe(3)

	await unblockUser(userTwo.token, userOne.id, 200)

	// User one updates his profile
	// User one fetches projects with his skills, check if correct
	await populateProfile({ ...initialProfileValuesUserOne, skills: ['python'] }, userOne.token, 200)
	const { projects: projectsWithUserOneSkills4 } = await fetchPotentialProjects(userOne.token, 200)
	expect(projectsWithUserOneSkills4.length).toBe(1)
	expect(projectsWithUserOneSkills4[0].id).toBe(projectUserFour.id)
	expect(projectsWithUserOneSkills4[0].matchedSkills).toBe(1)
	expect(projectsWithUserOneSkills4[0].required_skills[0].name).toBe('python')

	// User one fetches users with required skills, check if correct and order good
	// User one blocks user two
	// User one fetches users with required skills, check if not fetching user two
	// User one unblocks user two
	const { users: potentialUsersProjectUserOne } = await fetchPotentialUsers(userOne.token, projectUserOne.id, 200)
	expect(potentialUsersProjectUserOne.length).toBe(2)
	expect(potentialUsersProjectUserOne[0].id).toBe(userTwo.id)
	expect(potentialUsersProjectUserOne[0].matchedSkills).toBe(3)
	expect(potentialUsersProjectUserOne[1].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne[1].matchedSkills).toBe(2)

	await blockUser(userOne.token, userTwo.id, 200)

	const { users: potentialUsersProjectUserOne2 } = await fetchPotentialUsers(userOne.token, projectUserOne.id, 200)
	expect(potentialUsersProjectUserOne2.length).toBe(1)
	expect(potentialUsersProjectUserOne2[0].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne2[0].matchedSkills).toBe(2)

	await unblockUser(userOne.token, userTwo.id, 200)

	// User two blocks user one 
	// User one fetches users with required skills, check if not fetching user two
	// User two unblocks user one
	await blockUser(userTwo.token, userOne.id, 200)

	const { users: potentialUsersProjectUserOne3 } = await fetchPotentialUsers(userOne.token, projectUserOne.id, 200)
	expect(potentialUsersProjectUserOne3.length).toBe(1)
	expect(potentialUsersProjectUserOne3[0].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne3[0].matchedSkills).toBe(2)

	await unblockUser(userTwo.token, userOne.id, 200)

	// User one fetches users for his project
	// Check if all good and if the order is good
	const { users: potentialUsersProjectUserOne4 } = await fetchPotentialUsers(userOne.token, projectUserOne.id, 200)
	expect(potentialUsersProjectUserOne4.length).toBe(2)
	expect(potentialUsersProjectUserOne4[0].id).toBe(userTwo.id)
	expect(potentialUsersProjectUserOne4[0].matchedSkills).toBe(3)
	expect(potentialUsersProjectUserOne4[1].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne4[1].matchedSkills).toBe(2)

	// User two updates profile, removing skills
	// User one fetches users for his project
	// Check if not fetching user two
	await populateProfile({ ...initialProfileValuesUserTwo, skills: [] }, userTwo.token, 200)
	const { users: potentialUsersProjectUserOne5 } = await fetchPotentialUsers(userOne.token, projectUserOne.id, 200)
	expect(potentialUsersProjectUserOne5.length).toBe(1)
	expect(potentialUsersProjectUserOne5[0].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne5[0].matchedSkills).toBe(2)

	// User two updates his profile again
	// User one updates his project, tweaking skills
	// User one fetches users for his project
	// Check if all is good
	await populateProfile({ ...initialProfileValuesUserTwo, skills: ['node'] }, userTwo.token, 200)
	await editProject(projectUserOne.id, { ...projectUserOne1, skills: ['node', 'express', 'mariadb'], }, userOne.token, 200)
	const { users: potentialUsersProjectUserOne6 } = await fetchPotentialUsers(userOne.token, projectUserOne.id, 200)
	expect(potentialUsersProjectUserOne6.length).toBe(2)
	expect(potentialUsersProjectUserOne6[0].id).toBe(userThree.id)
	expect(potentialUsersProjectUserOne6[0].matchedSkills).toBe(2)
	expect(potentialUsersProjectUserOne6[1].id).toBe(userTwo.id)
	expect(potentialUsersProjectUserOne6[1].matchedSkills).toBe(1)
})
