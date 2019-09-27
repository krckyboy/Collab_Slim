// For security and to prevent big loads.
module.exports = function validatePagination({ start, end }) {
	// If either is not a number, fallback to default
	if (isNaN(start) || isNaN(end)) {
		return false
	}

	// If end > start, fallback to default
	if (end < start) {
		return false
	}

	// Calculate the distance between start and end, and if more than 100, fallback to default.
	if (end - start > 100) {
		return false
	}

	return true
}