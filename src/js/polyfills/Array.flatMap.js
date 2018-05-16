Object.defineProperties(Array.prototype, {
	'flatMap': {
		value: function(callback) {
			return Array.prototype.concat.apply([], this.map(callback));
		},
		writeable: false,
		enumerable: false
	}
});
