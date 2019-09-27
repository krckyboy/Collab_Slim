module.exports = function populateProfileObject(profileFields, req) {
	const obj = {}

	for (let el of profileFields) {
		if (!req.body[el] && typeof(req.body[el]) !== 'boolean') {
			obj[el] = null
		} else {
			obj[el] = req.body[el]
		}
	}

	return obj
}
