import Transition from './Transition';

export default function CompoundState(subStates) {
	this.id = CompoundState.serialNo++;
	this.subStates = subStates;
	this.isAccepting = undefined;
	this.transitions = [];
	this.transitionsMap = new Map();
} {
	CompoundState.serialNo = 0;
	CompoundState.prototype.linkTo = function(to, condition) {
		let tr = new Transition(this, to, condition);
		this.transitions.push(tr);
		this.transitionsMap.set(condition, to);
		return tr;
	};
	CompoundState.prototype.subStateReprensentation = function(to, condition) {
		return Array.from(this.subStates).map(function(e){return e.id;}).sort().join(',');
	};
}
