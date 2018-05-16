export default function GroppingState(subStates, isAccepting) {
	this.id = GroppingState.serialNo++;
	this.subStates = subStates;
	this.isAccepting = isAccepting;
	this.transitionsMap = new Map();
	this.subStatesLabel = "";
	let self = this;
	for(let state of subStates) {
		state.group = self;
	}
} {
	GroppingState.serialNo = 0;
	GroppingState.prototype.overridelinkTo = function(to, condition) {
		if(to !== null)
			this.transitionsMap.set(condition, to);
		else
			this.transitionsMap.delete(condition);
	};
	GroppingState.prototype.subStateReprensentation = function(to, condition) {
		return Array.from(this.subStates).map(function(e){return e.id;}).sort().join(',');
	};
	// GroppingState.prototype.traversal = function() {
	// 	let traversedStates = [];

	// 	traversalSub(this);

	// 	for(let state of traversedStates) {
	// 		delete state._isTraversed;
	// 	});

	// 	return {
	// 		traversedStates: traversedStates
	// 	};

	// 	function traversalSub(state) {
	// 		if(state._isTraversed)
	// 			return;
	// 		state._isTraversed = true;
	// 		traversedStates.push(state);
	// 		state.transitionsMap.forEach(function(to, condition) {
	// 			let nextState = transition.to;
	// 			traversalSub(nextState);
	// 		});
	// 	}
	// };
}