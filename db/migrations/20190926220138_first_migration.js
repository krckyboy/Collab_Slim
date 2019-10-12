exports.up = knex => {
	return knex.schema
		.createTable('users', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.string('name').unique().notNull()
			table.string('email').unique().notNull()
			table.string('location')
			table.string('website')
			table.string('bio', '1500')
			table.string('github')
		})
		.createTable('authentication', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.string('password').notNull()
			table.integer('login_failed_attempts')
				.unsigned()
				.defaultTo(0)
			table
				.integer('user_id')
				.unsigned()
				.references('id')
				.inTable('users')
				.onDelete('CASCADE')
				.index()
		})
		.createTable('skills', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.string('name').unique()
			table.integer('has_skills_count')
				.unsigned()
				.defaultTo(0)
			table.integer('required_skills_count')
				.unsigned()
				.defaultTo(0)
		})
		.createTable('has_skills', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.unique(['user_id', 'skill_id'])
			table
				.integer('user_id')
				.unsigned()
				.references('users.id')
				.notNull()
				.onDelete('CASCADE')
				.index()
			table
				.integer('skill_id')
				.unsigned()
				.references('skills.id')
				.notNull()
				.onDelete('CASCADE')
				.index()
		})
		.createTable('projects', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.string('name')
			table.string('description')
			table.string('url')			
			table.string('location')			
			table.specificType('images', 'text array')			
			table.boolean('paid')
			table.boolean('remote')
			table.boolean('archived').defaultTo(false)
			table
				.integer('owner_id')
				.unsigned()
				.references('id')
				.inTable('users')
				.onDelete('CASCADE')
				.index()
		})
		.createTable('required_skills', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.unique(['project_id', 'skill_id'])
			table
				.integer('project_id')
				.unsigned()
				.references('id')
				.inTable('projects')
				.onDelete('CASCADE')
				.index()
			table
				.integer('skill_id')
				.unsigned()
				.references('id')
				.inTable('skills')
				.onDelete('CASCADE')
				.index()
		})
		.createTable('blocked_members', table => {
			table.increments('id').primary()
			table.unique(['user_id', 'target_id'])
			table
				.integer('user_id')
				.unsigned()
				.references('id')
				.inTable('users')
				.onDelete('CASCADE')
				.index()
			table
				.integer('target_id')
				.unsigned()
				.references('id')
				.inTable('users')
				.onDelete('CASCADE')
				.index()
			table.timestamps(true, true)
		})
		.createTable('tags', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.string('name').unique()
			table.integer('count')
				.unsigned()
				.defaultTo(0)
		})
		.createTable('has_tags', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table
				.integer('project_id')
				.unsigned()
				.references('id')
				.inTable('projects')
				.onDelete('CASCADE')
				.index()
			table
				.integer('tag_id')
				.unsigned()
				.references('id')
				.inTable('tags')
				.onDelete('CASCADE')
				.index()
		})
		.createTable('events', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.string('type')
			table
				.integer('project_id')
				.unsigned()
				.references('id')
				.inTable('projects')
				.onDelete('SET NULL')
				.index()
			table
				.integer('triggering_user_id')
				.unsigned()
				.references('id')
				.inTable('users')
				.onDelete('SET NULL')
				.index()
			table
				.integer('target_user_id')
				.unsigned()
				.references('id')
				.inTable('users')
				.onDelete('SET NULL')
				.index()
			table
				.integer('specific_event_id') // "Created a project" 
				.unsigned()
		})
		.createTable('notifications', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.boolean('seen').defaultTo(false)
			table
				.integer('user_to_notify')
				.unsigned()
				.references('id')
				.inTable('users')
				.onDelete('CASCADE')
				.index()
			table
				.integer('event_id')
				.unsigned()
				.references('id')
				.inTable('events')
				.onDelete('CASCADE')
				.index()
		})
		.createTable('project_applications', table => {
			table.increments('id').primary()
			table.timestamps(true, true)
			table.string('message')
			table.string('email')
			table.string('status')
			table
				.integer('user_id')
				.unsigned()
				.references('id')
				.inTable('users')
				.onDelete('CASCADE')
				.index()
			table
				.integer('project_id')
				.unsigned()
				.references('id')
				.inTable('projects')
				.onDelete('CASCADE')
				.index()
		})
}

exports.down = knex => {
	return knex.schema
		.dropTableIfExists('project_applications')
		.dropTableIfExists('notifications')
		.dropTableIfExists('required_skills')
		.dropTableIfExists('has_tags')
		.dropTableIfExists('tags')
		.dropTableIfExists('has_skills')
		.dropTableIfExists('skills')
		.dropTableIfExists('authentication')
		.dropTableIfExists('events')
		.dropTableIfExists('blocked_members')
		.dropTableIfExists('projects')
		.dropTableIfExists('users')
}	