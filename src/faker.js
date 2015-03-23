/**
 * Module facker
 */
var sparkWord = require('./spark_word')

// =========================================== \\
// facker
// =========================================== //
var FACKER_FACTOR = [
	String.fromCharCode(816), // underline
    String.fromCharCode(773) + String.fromCharCode(818), // transmute
	String.fromCharCode(1161), // Ass
	String.fromCharCode(822), // strikeout
];

var REPALCE_HOLDER = new RegExp('[' + FACKER_FACTOR.join() + ']', 'g')

function faker(str, factorIndex) {
	var i, j, factor, ret;

	factorIndex = factorIndex ? factorIndex : 0;
	factor = FACKER_FACTOR[factorIndex]; // 2386
    ret = '';

    str = str.replace(REPALCE_HOLDER, '');

    // No spark word
    str = sparkWord.string(str);

    for (i = 0, j = str.length; i < j; i++) {
        ret += str.charAt(i) + factor;
    }

    return ret;
}

module.exports = faker;
