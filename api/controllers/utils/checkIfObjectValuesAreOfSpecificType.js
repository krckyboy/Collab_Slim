module.exports = function checkIfObjectValuesAreOfSpecificType(obj, expectedType) {
	if (typeof obj === 'object' && !Array.isArray(obj)) {
		const arr = Object.entries(obj)

		if (arr.every(el => typeof el[1] === expectedType || el[1] === null)) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}
