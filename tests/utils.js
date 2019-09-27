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

module.exports = {
	registerNewUser: registerNewUser,
	userOne,
	userTwo,
	userThree,
	userFour,
	userFive,
}
