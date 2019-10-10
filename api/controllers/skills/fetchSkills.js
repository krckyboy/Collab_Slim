const Skill = require('../../../db/models/Skill')
const validatePagination = require('../utils/validatePagination')
const getProperTypeQuerySkill = require('./utils/getProperTypeQuerySkill')

// Query params for pagination: 
// start - Starting from skill #10 for example
// end - Ends with skill #20
module.exports = async (req, res) => {
	try {
		const type = getProperTypeQuerySkill(req.query.type) // Either skills in demand or popular skills (popular as in has_skills_count)
		let start = parseInt(req.query.start)
		let end = parseInt(req.query.end)

		let skills

		if (!validatePagination({ start, end })) {
			start = 0
			end = 10
		}

		if (type) {
			skills = await Skill
				.query()
				.range(start, end)
				.orderBy(type, 'desc')
		} else {
			// By default it should fetch latest skills.
			skills = await Skill
				.query()
				.range(start, end)
				.orderBy('created_at', 'desc')
		}

		res.json({ skills })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}