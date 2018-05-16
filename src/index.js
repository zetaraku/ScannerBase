import $ from 'jquery';
import ScannerBase from './js/ScannerBase';

import './scss/style.scss';

for(let [tab_title, tab_name] of [
	['NFA', 'nfa_tab'],
	['DFA', 'dfa_tab'],
	['OFA', 'ofa_tab'],
	['AST', 'ast_tab'],
]) {
	$('#tab_bar').append(
		$(`<li name=${tab_name}></li>`).append(
			$(`<a class="tablinks" href="javascript:void(0);">${tab_title}</a>`).on('click', function() {
				openTab(tab_name);
			})
		)
	);
}

$('#generate').on('click', function() {
	ScannerBase.serialReset();

	var regexstr = $('#regexstr').val();
	var ast = ScannerBase.makeASTFromRegexStr(regexstr);
	var nfa = ScannerBase.makeNFAFromAST(ast);
	var dfa = ScannerBase.makeDFAFromNFA(nfa);
	var ofa = ScannerBase.makeOFAFromDFA(dfa);

	$('#nfa').html(
		ScannerBase.generateDotImageOfNFA(nfa)
	);
	$('#dfa').html(
		ScannerBase.generateDotImageOfDFA(dfa)
	);
	$('#ofa').html(
		ScannerBase.generateDotImageOfOFA(ofa)
	);
	$('#ast').html(
		ScannerBase.generateDotImageOfAST(ast)
	);

	document.getElementsByClassName('tablinks')[0].click();
});

function openTab(tabname) {
	$('.tabcontent').css('display', 'none');
	$('.tablinks').removeClass('active');
	$('#'+tabname).css('display', 'block');
	$('#tab_ul').find('[name='+tabname+']').addClass('active');
}
