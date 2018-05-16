export default function NFA(type) {
	this.id = NFA.serialNo++;
	this.type = type;
	this.startState = undefined;
	this.finalState = undefined;
	this.subNFA = [];
	this.addedStates = [];
	this.addedTransitions = [];
	this.regexContent = undefined;
} {
	NFA.serialNo = 0;
	NFA.prototype.traversal = function(f_start, f_end) {
		traversalSub(this);
		function traversalSub(nfa) {
			f_start(nfa);
			for(let nextNFA of nfa.subNFA) {
				traversalSub(nextNFA);
			}
			f_end(nfa);
		}
	};
}
