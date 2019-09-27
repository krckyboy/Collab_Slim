module.exports = function filterArrayStrings(arr) {
	let filteredArray = []
	if (arr && arr.length > 0) {
		arr.split(',').forEach(el => {
			const trimmedEl = el.trim()
			if (trimmedEl) {
				filteredArray.push(trimmedEl)
			}
		})

		if (!filteredArray.length > 0) {
			filteredArray = null
		} else {
			return filteredArray
		}
	} else {
		return filteredArray
	}
}