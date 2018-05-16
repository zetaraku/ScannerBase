Object.defineProperties(Set.prototype, {
	'equals': {
		value: function (that) {
			if(this.size !== that.size)
				return false;
			for(let e of this)
				if (!that.has(e))
					return false;
			return true;
		},
		writeable: false,
		enumerable: false
	},
});
