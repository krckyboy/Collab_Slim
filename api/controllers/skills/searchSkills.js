const Skill = require('../../../db/models/Skill')

// All tags should not contain dashes or dots. E-commerce -> ecommerce. Node.js -> nodejs
// Also, all javascript libraries should contain JS. For example Node -> Nodejs inside db. (For now, until I find a better way)
module.exports = async (req, res) => {
	try {
		const search = req.body.search // The value of the search input
		let skills

		const formattedSearch = search.toLowerCase().replace(/[^a-zA-Z ]/g, '')

		// You could fetch all skills and then do a search in javascript to see if it matches because you'll probably have less than 1000 skills.
		if (search.trim()) {
			skills = await Skill.query().whereRaw('LOWER(name) LIKE ?', '%' + formattedSearch + '%')
		} else {
			return res.status(404).send()
		}

		if (skills.length > 0) {
			return res.json(skills)
		} else {
			return res.status(404).send()
		}
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}