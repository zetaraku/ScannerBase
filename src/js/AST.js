import OpType from './OpType';

export default function AST(operator, operands, regexContent) {
	this.id = AST.serialNo++;
	this.operator = operator;
	this.operands = operands;
	this.regexContent = regexContent;
} {
	AST.serialNo = 0;
	AST.prototype.withExtraParam = function(extraParam) {
		this.extraParam = extraParam;
		return this;
	};
	AST.prototype.traversal = function(f_start, f_end) {
		traversalSub(this);
		function traversalSub(ast) {
			f_start(ast);
			if(ast.operator.operandCount !== undefined) 
				for(let operand of ast.operands) {
					traversalSub(operand);
				}
			f_end(ast);
		}
	};
	AST.prototype.toRegexString = function() {
		switch(this.operator) {
		case OpType.NONE:
			return undefined;
		case OpType.CHAR:
			return '\'' + this.extraParam + '\'';
		case OpType.LAMBDA:
			return 'λ';
		case OpType.OR:
			return '|';
		case OpType.STAR:
			return '*';
		case OpType.PLUS:
			return '+';
		case OpType.QMARK:
			return '?';
		case OpType.TIMEOF:
			return this.extraParam;
		case OpType.CONCAT:
			return 'CONCAT';
		default:
			return undefined;
		}
	};
}
