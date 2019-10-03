module.exports = function checkIfObjectValuesAreOfSpecificType(arr, expectedType) {
	if (Array.isArray(arr)) {
		if (arr.every(el => typeof el === expectedType) || arr.length === 0) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}
