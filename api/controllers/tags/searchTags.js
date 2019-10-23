const db = require('../../../db/index')

// All tags should not contain dashes or dots. E-commerce -> ecommerce. Node.js -> nodejs
// Also, all javascript libraries should contain JS. For example Node -> Nodejs inside db. (For now, until I find a better way)
module.exports = async (req, res) => {
	try {
		const search = req.body.search // The value of the search input
		let tags

		const formattedSearchValue = search.toLowerCase()
			.replace(/[^a-zA-Z ]/g, '') // This gets rid of all the non alphanumerical characters (also . - )
			.trim()

		const rawQuery = 'SELECT *, SIMILARITY(name, ?) AS sml FROM tags ORDER BY sml DESC LIMIT 5;'

		if (formattedSearchValue) {
			tags = await db.raw(rawQuery, formattedSearchValue)
			if (tags.rows) {
				tags = tags.rows.filter(tag => tag.sml > 0.1)
			} else {
				return res.status(404).send()
			}
		} else {
			return res.status(404).send()
		}

		return res.json({ tags })
	} catch (err) {
		console.error(err)
		res.status(500).json({ msg: 'Server error' })
	}
}