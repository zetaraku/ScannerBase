export default function OFA() {
	this.id = OFA.serialNo++;
	this.startState = undefined;
	this.states = [];
	this.transitions = [];
} {
	OFA.serialNo = 0;
}
