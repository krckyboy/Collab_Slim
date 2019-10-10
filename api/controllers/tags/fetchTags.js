const Tag = require('../../../db/models/Tag')
const validatePagination = require('../utils/validatePagination')

// Query params for pagination: 
// start - Starting from tag #10 for example
// end - Ends with tag #20
module.exports = async (req, res) => {
	try {
		let start = parseInt(req.query.start)
		let end = parseInt(req.query.end)

		if (!validatePagination({ start, end })) {
			start = 0
			end = 10
		}

		const tags = await Tag
			.query()
			.range(start, end)
			.orderBy('count', 'desc')

		res.json({ tags })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}