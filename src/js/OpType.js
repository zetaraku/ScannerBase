let OpType = (function(){
	function OpType(name, precIn, precOut, opCount) {
		this.name = name;
		if(precIn !== undefined || precOut !== undefined) {
			this.precedence = {};
			if(precIn !== undefined)
				this.precedence.IN = precIn;
			if(precOut !== undefined)
				this.precedence.OUT = precOut;
		}
		if(opCount !== undefined)
			this.operandCount = opCount;
	}
	OpType.prototype.toString = function() {
		return 'OpType.' + this.name;
	};
	let precedence = {
		OUT: {
			LPARAM: 10, RPARAM: 2,
			STAR: 8, PLUS: 8, QMARK: 8, TIMEOF: 8,
			CONCAT: 6,
			OR: 4,
			END_OF_REGEX: -1
		},
		IN: {
			LPARAM: 1,
			STAR: 9, PLUS: 9, QMARK: 9, TIMEOF: 9,
			CONCAT: 7,
			OR: 5
		}
	};
	let operandCount = {
		OR: 2,
		STAR: 1,
		PLUS: 1,
		QMARK: 1,
		TIMEOF: 1,
		CONCAT: 2
	};

	let obj = {};
	[
		'NONE',
		'CHAR',
		'CHARSET',
		'LAMBDA',
		'LPARAM',
		'RPARAM',
		'OR',
		'STAR',
		'PLUS',
		'QMARK',
		'TIMEOF',
		'CONCAT',
		'END_OF_REGEX'
	].forEach(function(e) {
		obj[e] = new OpType(
			e,
			precedence.IN[e],
			precedence.OUT[e],
			operandCount[e]
		);
	});
	return obj;
})();

export default OpType;
