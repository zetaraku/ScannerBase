export default function DFA() {
	this.id = DFA.serialNo++;
	this.startState = undefined;
	this.states = [];
	this.transitions = [];
} {
	DFA.serialNo = 0;
}
