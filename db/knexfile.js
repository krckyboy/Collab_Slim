const config = {
	client: 'postgresql',
	connection: {
		database: 'collab_slim',
		user: 'postgres',
		password: 'password'
	},
	useNullAsDefault: true,
}

module.exports = Object.assign({}, config, {
	development: config,
	staging: config,
	production: config,
})
