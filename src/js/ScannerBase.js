import './polyfills/Array.flatMap';
import './polyfills/Set.equals';

import AST from './AST';

import NFA from './NFA';
import DFA from './DFA';
import OFA from './OFA';

import SimpleState from './SimpleState';
import CompoundState from './CompoundState';
import GroppingState from './GroppingState';

import OpType from './OpType';

import Viz from './lib/viz';

const ScannerBase = {
	serialReset: function(no) {
		no = no || 0;
		AST.serialNo = no;
		NFA.serialNo = no;
		DFA.serialNo = no;
		OFA.serialNo = no;
		SimpleState.serialNo = no;
		CompoundState.serialNo = no;
		GroppingState.serialNo = no;
	},

	makeASTFromRegexStr: function(regexstr) {
		let operandStack = [];
		let operatorStack = [];

		operatorStack.opush = function(op) {
			while(this.length !== 0) {
				let inOp = this.pop(), outOp = op;
				if(inOp.precedence.IN > outOp.precedence.OUT) {
					let operands = [];
					for(let i=0;i<inOp.operandCount;i++)
						operands.unshift(operandStack.pop());
					operandStack.push(buildOperatorAST(inOp, operands));
				} else {
					this.push(inOp);
					break;
				}
			}
			this.push(op);
		};

		let prev_op = OpType.NONE;

		regexstr.split('').forEach(function(c) {
			if(c === '(') {
				checkConcat(OpType.LPARAM);
				operatorStack.opush(prev_op = OpType.LPARAM);
			} else if(c === ')') {
				checkLambda(OpType.RPARAM);
				operatorStack.opush(prev_op = OpType.RPARAM);
				console.assert(operatorStack.pop() === OpType.RPARAM);
				console.assert(operatorStack.pop() === OpType.LPARAM);
			} else if(c === '|') {
				checkLambda(OpType.OR);
				operatorStack.opush(prev_op = OpType.OR);
			} else if(c === '*') {
				operatorStack.opush(prev_op = OpType.STAR);
			} else if(c === '+') {
				operatorStack.opush(prev_op = OpType.PLUS);
			} else if(c === '?') {
				operatorStack.opush(prev_op = OpType.QMARK);
			} else {
				checkConcat(OpType.CHAR);
				operandStack.push(buildAtomAST(c));
				prev_op = OpType.CHAR;
			}
		});
		operatorStack.opush(OpType.END_OF_REGEX);

		return operandStack[0] || buildAtomAST(null);

		function checkLambda(currentOp) {
			if(hasALambdaBetween(prev_op, currentOp))
				operandStack.push(buildAtomAST(null));
		}
		function checkConcat(currentOp) {
			if(hasAConcateBetween(prev_op, currentOp))
				operatorStack.opush(OpType.CONCAT);
		}
		function hasAConcateBetween(left, right) {
			let L = [
				OpType.CHAR,
				OpType.RPARAM,
				OpType.LBRACK,
				OpType.STAR,
				OpType.PLUS,
				OpType.QMARK,
				OpType.TIMEOF
			];
			let R = [
				OpType.CHAR,
				OpType.LPARAM,
				OpType.LBRACK
			];

			return L.includes(left) && R.includes(right);
		}
		function hasALambdaBetween(left, right) {
			let L = [
				OpType.NONE,
				OpType.LPARAM,
				OpType.OR
			];
			let R = [
				OpType.OR,
				OpType.RPARAM
			];

			return L.includes(left) && R.includes(right);
		}

		function buildAtomAST(c) {
			if(c !== null)
				return charElement(c);
			else
				return lambdaElement();

			function charElement(c) {
				return new AST(OpType.CHAR, [], c).withExtraParam(c);
			}
			function lambdaElement() {
				return new AST(OpType.LAMBDA, [], '');
			}
		}
		function buildOperatorAST(op, operands) {
			if(op === OpType.STAR)
				return anyOfElement(operands[0]);
			else if(op === OpType.PLUS)
				return moreOfElement(operands[0]);
			else if(op === OpType.QMARK)
				return optionalElement(operands[0]);
			else if(op === OpType.OR)
				return orElements(operands[0], operands[1]);
			else if(op === OpType.CONCAT)
				return concatElements(operands[0], operands[1]);
			else
				throw new Error(op, operands);

			function anyOfElement(a) {
				return new AST(
					OpType.STAR, [a],
					(a.operator === OpType.CHAR || a.operator === OpType.OR ? a.regexContent : '('+a.regexContent+')') + '*'
				);
			}
			function moreOfElement(a) {
				return new AST(
					OpType.PLUS, [a],
					(a.operator === OpType.CHAR || a.operator === OpType.OR ? a.regexContent : '('+a.regexContent+')') + '+'
				);
			}
			function optionalElement(a) {
				return new AST(
					OpType.QMARK, [a],
					(a.operator === OpType.CHAR || a.operator === OpType.OR ? a.regexContent : '('+a.regexContent+')') + '?'
				);
			}
			function orElements(a, b) {
				return new AST(
					OpType.OR, [a, b],
					'('+a.regexContent + '|' + b.regexContent+')'
				);
			}
			function concatElements(a, b) {
				return new AST(
					OpType.CONCAT, [a, b],
					a.regexContent + b.regexContent
				);
			}
		}
	},
	makeNFAFromAST: function makeNFAFromAST(ast) {
		if(ast.operator === OpType.CHAR)
			return charElement(ast.extraParam);
		else if(ast.operator === OpType.CHARSET)
			return charsetElement(ast.extraParam);
		else if(ast.operator === OpType.LAMBDA)
			return lambdaElement();
		else if(ast.operator === OpType.STAR)
			return anyOfElement(ast.operands);
		else if(ast.operator === OpType.PLUS)
			return moreOfElement(ast.operands);
		else if(ast.operator === OpType.QMARK)
			return optionalElement(ast.operands);
		else if(ast.operator === OpType.OR)
			return orElements(ast.operands);
		else if(ast.operator === OpType.CONCAT)
			return concatElements(ast.operands);
		else
			throw new Error(ast);

		function charElement(c) {

			let startState = new SimpleState();
			let finalState = new SimpleState();

			let addedTransitions = [
				startState.linkTo(finalState, c)
			];

			let C = new NFA(OpType.CHAR);
			C.startState = startState;
			C.finalState = finalState;
			C.finalState.isAccepting = true;

			C.regexContent = ast.regexContent;
			C.addedStates = [startState, finalState];
			C.addedTransitions = addedTransitions;

			return C;
		}

		function lambdaElement() {

			let startState = new SimpleState();
			let finalState = new SimpleState();

			let addedTransitions = [
				startState.linkTo(finalState, null)
			];

			let C = new NFA(OpType.LAMBDA);
			C.startState = startState;
			C.finalState = finalState;
			C.finalState.isAccepting = true;

			C.regexContent = ast.regexContent;
			C.addedStates = [startState, finalState];
			C.addedTransitions = addedTransitions;

			return C;
		}

		function anyOfElement(operands) {
			let A = makeNFAFromAST(operands[0]);

			let startState = new SimpleState();
			let finalState = new SimpleState();

			let addedTransitions = [
				startState.linkTo(finalState, null),
				startState.linkTo(A.startState, null),
				A.finalState.linkTo(finalState, null),
				// A.finalState.linkTo(A.startState, null)
				finalState.linkTo(startState, null)
			];
			A.finalState.isAccepting = false;

			let C = new NFA(OpType.STAR);
			C.startState = startState;
			C.finalState = finalState;
			C.finalState.isAccepting = true;

			C.subNFA = [A];
			C.regexContent = ast.regexContent;
			C.addedStates = [startState, finalState];
			C.addedTransitions = addedTransitions;

			return C;
		}

		function moreOfElement(operands) {
			let A = makeNFAFromAST(operands[0]);

			let startState = new SimpleState();
			let finalState = new SimpleState();

			let addedTransitions = [
				startState.linkTo(A.startState, null),
				A.finalState.linkTo(finalState, null),
				// A.finalState.linkTo(A.startState, null)
				finalState.linkTo(startState, null)
			];
			A.finalState.isAccepting = false;

			let C = new NFA(OpType.PLUS);
			C.startState = startState;
			C.finalState = finalState;
			C.finalState.isAccepting = true;

			C.subNFA = [A];
			C.regexContent = ast.regexContent;
			C.addedStates = [startState, finalState];
			C.addedTransitions = addedTransitions;

			return C;
		}

		function optionalElement(operands) {
			let A = makeNFAFromAST(operands[0]);

			let startState = new SimpleState();
			let finalState = new SimpleState();

			let addedTransitions = [
				startState.linkTo(finalState, null),
				startState.linkTo(A.startState, null),
				A.finalState.linkTo(finalState, null)
			];

			A.finalState.isAccepting = false;

			let C = new NFA(OpType.QMARK);
			C.startState = startState;
			C.finalState = finalState;
			C.finalState.isAccepting = true;

			C.subNFA = [A];
			C.regexContent = ast.regexContent;
			C.addedStates = [startState, finalState];
			C.addedTransitions = addedTransitions;

			return C;
		}

		function orElements(operands) {
			let A = makeNFAFromAST(operands[0]),
				B = makeNFAFromAST(operands[1]);

			let startState = new SimpleState();
			let finalState = new SimpleState();

			let addedTransitions = [
				startState.linkTo(A.startState, null),
				startState.linkTo(B.startState, null),
				A.finalState.linkTo(finalState, null),
				B.finalState.linkTo(finalState, null)
			];

			A.finalState.isAccepting = false;
			B.finalState.isAccepting = false;

			let C = new NFA(OpType.OR);
			C.startState = startState;
			C.finalState = finalState;
			C.finalState.isAccepting = true;

			C.subNFA = [A, B];
			C.regexContent = ast.regexContent;
			C.addedStates = [startState, finalState];
			C.addedTransitions = addedTransitions;

			return C;
		}

		function concatElements(operands) {
			let A = makeNFAFromAST(operands[0]),
				B = makeNFAFromAST(operands[1]);

			let addedTransitions = [
				A.finalState.linkTo(B.startState, null)
			];
			A.finalState.isAccepting = false;

			let C = new NFA(OpType.CONCAT);
			C.startState = A.startState;
			C.finalState = B.finalState;

			C.subNFA = [A, B];
			C.regexContent = ast.regexContent;
			C.addedStates = [];
			C.addedTransitions = addedTransitions;

			return C;
		}
	},
	makeDFAFromNFA: function(nfa) {
		let dfa = new DFA();
		let startState = new CompoundState(
			SimpleState.lambdaClosureOf([nfa.startState])
		);
		startState.isAccepting = startState.subStates.has(nfa.finalState);
		dfa.startState = startState;
		dfa.states.push(dfa.startState);

		let processingQueue = [startState];
		while(processingQueue.length !== 0) {
			let processingState = processingQueue.shift();

			let conditions = new Set(
				Array.from(processingState.subStates).flatMap(function(state) {
					return state.transitions.map(function(transition) {
						return transition.condition;
					});
				})
			);
			conditions.delete(null);	// exclude lambda transition

			for(let c of conditions) {
				let newSubStates = SimpleState.lambdaClosureOf(SimpleState.oneClosureOf(processingState.subStates, c));
				let existedState = undefined;
				for(let state of dfa.states) {
					if(newSubStates.equals(state.subStates)) {
						existedState = state;
						break;
					}
				}
				if(existedState === undefined) {
					let newState = new CompoundState(newSubStates);
					newState.isAccepting = newState.subStates.has(nfa.finalState);
					dfa.states.push(newState);
					processingQueue.push(newState);
					dfa.transitions.push(
						processingState.linkTo(newState, c)
					);
				} else {
					dfa.transitions.push(
						processingState.linkTo(existedState, c)
					);
				}
			}
		}

		return dfa;
	},
	makeOFAFromDFA: function(dfa) {
		let ofa = new OFA();
		let acceptingStates = new Set();
		let nonAcceptingStates = new Set();
		for(let state of dfa.states) {
			if(state.isAccepting)
				acceptingStates.add(state);
			else
				nonAcceptingStates.add(state);
		}
		ofa.states = [
			new GroppingState(acceptingStates, true)
		];
		if(nonAcceptingStates.size !== 0)
			ofa.states.push(new GroppingState(nonAcceptingStates, false));

		let ERROR_STATE = new CompoundState();
		ERROR_STATE.group = null;

		let updated;
		do {
			updated = false;
			CHECKING: for(let i=0;i<ofa.states.length;i++) {
				let processingState = ofa.states[i];
				let conditions = new Set(
					Array.from(processingState.subStates).flatMap(function(state) {
						return Array.from(state.transitionsMap.keys());
					})
				);
				for(let condition of conditions) {
					let transitionsGroups = new Map();
					for(let state of processingState.subStates) {
						let nextStateGroup = (state.transitionsMap.get(condition)||ERROR_STATE).group;
						if(!transitionsGroups.has(nextStateGroup))
							transitionsGroups.set(nextStateGroup, []);
						transitionsGroups.get(nextStateGroup).push(state);
					}
					if(transitionsGroups.size>1) {
						ofa.states.splice(i, 1);
						transitionsGroups.forEach(function(states, oldGroupState) {
							let newGroupState = new GroppingState(states, processingState.isAccepting);
							processingState.overridelinkTo(newGroupState, condition);
							ofa.states.push(newGroupState);
						});
						updated = true;
						break CHECKING;
					} else {
						transitionsGroups.forEach(function(states, oldGroupState) {
							processingState.overridelinkTo(oldGroupState, condition);
						});
					}
				};
			}
		} while(updated);

		ofa.startState = dfa.startState.group;

		return ofa;
	},

	generateDotImageOfAST: function(rootAST) {
		let dotFileSrc = "";
		dotFileSrc += ("digraph " + "AST" + " { ");
		// dotFileSrc += ("rankdir=\"LR\";");
		// dotFileSrc += ("node [shape=circle];");

		dotFileSrc += (
			"root -> " + rootAST.id + "; "
		);

		rootAST.traversal(function(ast) {
			dotFileSrc += (ast.id + " [label = \"" + ast.toRegexString() + "\"]; ");
			for(let operand of ast.operands) {
				dotFileSrc += (
					ast.id + " -> " + operand.id + "; "
				);
			}
		}, function() {

		});

		dotFileSrc += ("}");

		console.log(dotFileSrc);
		return Viz(dotFileSrc);
	},
	generateDotImageOfNFA: function(rootNFA) {
		let dotFileSrc = "";
		dotFileSrc += ("digraph NFA { ");
		dotFileSrc += ("rankdir=\"LR\"; ");
		dotFileSrc += ("node [shape=circle]; ");

		dotFileSrc += (
			"start -> " + rootNFA.startState.id + "; "
		);

		rootNFA.traversal(function(nfa) {
			if(nfa.type !== OpType.CONCAT || nfa === rootNFA) {
				dotFileSrc += ("subgraph cluster_" + nfa.id + " { ");
				dotFileSrc += ("label = \"" + nfa.regexContent + "\"; ");
				dotFileSrc += ("style = solid; ");
			}
			for(let s of nfa.addedStates) {
				if(s.isAccepting)
					dotFileSrc += (s.id + " [peripheries = 2]; ");
			}
			for(let t of nfa.addedTransitions) {
				dotFileSrc += (
					t.from.id + " -> " + t.to.id +
					" [" +
						"label = \"" + (t.condition !== null ? t.condition : 'λ') + "\" " +
						"style = " + (t.condition !== null ? "solid" : "dashed") + " " +
					"]" + "; "
				);
			}
		}, function(nfa) {
			if(nfa.type !== OpType.CONCAT || nfa === rootNFA) {
				dotFileSrc += ("} ");
			}
		});

		dotFileSrc += ("}");

		console.log(dotFileSrc);
		return Viz(dotFileSrc);
	},
	generateDotImageOfDFA: function(rootDFA) {
		let dotFileSrc = "";
		dotFileSrc += ("digraph DFA { ");
		dotFileSrc += ("rankdir=\"LR\"; ");
		dotFileSrc += ("node [shape=circle]; ");

		dotFileSrc += (
			"start -> " + rootDFA.startState.id + "; "
		);

		for(let state of rootDFA.states) {
			dotFileSrc += (state.id + " [label = \"" + state.id + '\\n{' +state.subStateReprensentation() + "}\"]; ");
			if(state.isAccepting)
				dotFileSrc += (state.id + " [peripheries = 2]; ");
		}

		for(let t of rootDFA.transitions) {
			dotFileSrc += (
				t.from.id + " -> " + t.to.id +
				" [" +
					"label = \"" + t.condition + "\" " +
					"style = solid" +
				"]" + "; "
			);
		}

		dotFileSrc += ("}");

		console.log(dotFileSrc);
		return Viz(dotFileSrc);
	},
	generateDotImageOfOFA: function(rootOFA) {
		let dotFileSrc = "";
		dotFileSrc += ("digraph OFA { ");
		dotFileSrc += ("rankdir=\"LR\"; ");
		dotFileSrc += ("node [shape=circle]; ");

		dotFileSrc += (
			"start -> " + rootOFA.startState.id + "; "
		);

		for(let state of rootOFA.states) {
			dotFileSrc += (state.id + " [label = \"" + state.id + '\\n{' +state.subStateReprensentation() + "}\"]; ");
			if(state.isAccepting)
				dotFileSrc += (state.id + " [peripheries = 2]; ");
			state.transitionsMap.forEach(function(nextState, condition) {
				dotFileSrc += (
					state.id + " -> " + nextState.id +
					" [" +
						"label = \"" + condition + "\" " +
						"style = solid" +
					"]" + "; "
				);
			});
		}

		dotFileSrc += ("}");

		console.log(dotFileSrc);
		return Viz(dotFileSrc);
	},
};

export default ScannerBase;
