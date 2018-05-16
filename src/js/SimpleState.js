import Transition from './Transition';

export default function SimpleState() {
	this.id = SimpleState.serialNo++;
	this.isAccepting = false;
	this.transitions = [];
} {
	SimpleState.serialNo = 0;
	SimpleState.prototype.linkTo = function(to, condition) {
		let tr = new Transition(this, to, condition);
		this.transitions.push(tr);
		return tr;
	};
	// SimpleState.prototype.traversal = function() {
	// 	let traversedStates = [], traversedTransitions = [];

	// 	traversalSub(this);

	// 	for(let state of traversedStates) {
	// 		delete state._isTraversed;
	// 	});

	// 	return {
	// 		traversedStates: traversedStates,
	// 		traversedTransitions: traversedTransitions
	// 	};

	// 	function traversalSub(state) {
	// 		if(state._isTraversed)
	// 			return;
	// 		state._isTraversed = true;
	// 		traversedStates.push(state);
	// 		for(let transition of state.transitions) {
	// 			let nextState = transition.to;
	// 			traversedTransitions.push(transition);
	// 			traversalSub(nextState);
	// 		});
	// 	}
	// };
	SimpleState.lambdaClosureOf = function(states) {
		let lambdaClosure = new Set(states);
		let processingQueue = Array.from(states);
		while(processingQueue.length !== 0) {
			let state = processingQueue.shift();
			for(let transition of state.transitions) {
				if(transition.condition === null) {	// lambda
					let nextState = transition.to;
					if(!lambdaClosure.has(nextState)) {
						lambdaClosure.add(nextState);
						processingQueue.push(nextState);
					}
				}
			}
		}
		return lambdaClosure;
	};
	SimpleState.oneClosureOf = function(states, condition) {
		let oneClosure = new Set();
		for(let state of states) {
			for(let transition of state.transitions) {
				if(transition.condition === condition) {
					oneClosure.add(transition.to);
				}
			}
		}

		return oneClosure;
	};
}
