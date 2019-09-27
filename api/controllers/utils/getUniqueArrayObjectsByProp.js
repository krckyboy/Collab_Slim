module.exports = function getUniqueArrayObjectsByProp(arr, prop) {
	const unique = arr
		.map(el => el[prop]) // [1, 1, 2]

		// store the keys of the unique objects
		.map((el, index, self) => self.indexOf(el) === index && index) // [1, false, 2]
		
		// eliminate the dead keys & store unique objects
		.filter(el => arr[el]).map(el => arr[el]) 

	return unique
}