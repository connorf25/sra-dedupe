var _ = require('lodash');
var compareNames = require('compare-names');
var doiRegex = require('doi-regex');
var events = require('events');
var util = require('util');

function SRADedupe(settings) {
	var dedupe = this;

	dedupe.settings = _.defaults(settings, {
		regexps: {
			alphaNumeric: /[^a-z0-9]+/g,
			junkWords: /\b(the|a)\b/g,
			looksNumeric: /^[^0-9\.\-]+$/,
			looksNumericWhitespace: /^\s*[^0-9\.\-]+\s*$/,
			onlyNumeric: /[^0-9]+/g,
		},
	});


	/**
	* Attempt to locate and extract a DOI from a reference
	* The DOI could be located in the DOI field or stored as a URL within the url array
	* @param {Object} ref The reference to examine
	* @return {string|boolean} Either the extracted 'true' DOI (i.e. minus URL prefix) or boolean false if none is present
	*/
	dedupe.findDOI = function(ref) {
		if (ref.doi && doiRegex().test(ref.doi)) return ref.doi.match(doiRegex())[0];

		if (ref.urls) {
			var matching = ref.urls.filter(url => doiRegex().test(url));
			if (matching.length == 1) return matching[0].match(doiRegex())[0];
		}

		return false;
	};

	/**
	* Examine two inputs and decide if they are duplicate references
	* @param {Object} ref1 The first reference to compare
	* @param {Object} ref2 The second reference to compare
	* @return {Object} An object with the keys `isDupe` (boolean), `reason` (string)
	* @return {boolean|string} Either false if the references are not duplicates or truey value string explaining the reason they are
	*/
	dedupe.compare = function(ref1, ref2) {
		// Stage 1 - Very basic sanity checks - do not match if title is absent on either side {{{
		if (!ref1.title || !ref2.title) return {isDupe: false, reason: 'missing title'};
		// }}}

		// Stage 2 - Basic sanity checks - do not match if year, page, volume, isbn or number is present BUT mismatch exactly {{{
		// Since these fields are usually numeric its fairly likely that if these dont match its not a duplicate
		if (['year', 'pages', 'volume', 'number', 'isbn'].some(function(f) {
			if (ref1[f] && ref2[f]) { // Both refs possess the comparitor
				if (!dedupe.settings.regexps.looksNumeric.test(ref1[f]) || !dedupe.settings.regexps.looksNumeric.test(ref2[f])) return false;
				// Strip all non-numerics out {{{
				var cf1 = ref1[f].replace(dedupe.settings.regexps.onlyNumeric, '');
				if (!cf1) return; // Skip out if nothing is left anyway
				var cf2 = ref2[f].replace(dedupe.settings.regexps.onlyNumeric, '');
				if (!cf2) return;
				// }}}
				return (cf1 != cf2);
			}
		})) return {isDupe: false, reason: 'UNKNOWN'};
		// }}}

		// Stage 3 - Extract DOIs from both sides and compare {{{
		var ref1DOI = dedupe.findDOI(ref1);
		var ref2DOI = dedupe.findDOI(ref2);
		if (ref1DOI && ref2DOI) return {isDupe: ref1DOI == ref2DOI, reason: 'doi'}; // Both have a DOI so we can be definitive
		// }}}

		// Stage 4 - Extraction of years from titles + comparison {{{
		// Extract an array of years from each title and check that ref2 contains the same years if the years mismatch its not a dupe
		var ref1Years = ref1.title.match(/\b([0-9]{4})\b/g) || [];
		var ref2Years = ref2.title.match(/\b([0-9]{4})\b/g) || [];
		if (
			(ref1Years.length || ref2Years.length) && // At least one has a year set
			_.intersection(ref1Years, ref2Years).length != _.max([ref1Years.length, ref2Years.length])
		) return {isDupe: false, reason: 'year'};
		// }}}

		// Stage 5 - Extract numbers from ISBNs on either side and compare {{{
		// This comparison only works if each side has a 'perfect' ISBN - i.e. /^\s*[0-9\.\-\s]+\s*$/
		// This test uses the certainty that ISBN numbers are unlikely to be mangled
		// If both (de-noised) ISBNs match the ref is declared a dupe, if not they are declared a NON dupe
		if (
			ref1.isbn &&
			ref2.isbn &&
			dedupe.settings.regexps.looksNumericWhitespace.test(ref1.isbn) &&
			dedupe.settings.regexps.looksNumericWhitespace.test(ref2.isbn)
		) {
			var r1ISBN = ref1.replace(dedupe.settings.regexps.onlyNumeric, '');
			var r2ISBN = ref2.replace(dedupe.settings.regexps.onlyNumeric, '');
			return {isDupe: r1ISBN == r2ISBN, reason: 'isbn'}; // If direct match its a dupe, if not its NOT a dupe
		}
		// }}}

		// Stage 6 - Comparison of title + authors via string distance checking {{{
		var r1Title = ref1.title.toLowerCase();
		var r2Title = ref2.title.toLowerCase();

		/*if (
			natural.JaroWinklerDistance(r1Title, r2Title) >= config.tasks.dedupe.stringDistance.jaroWinklerMin &&
			natural.LevenshteinDistance(r1Title, r2Title) <= config.tasks.dedupe.stringDistance.levenshteinMax
		) {
			console.log('---DUPE---');
			console.log('REF1', r1Title);
			console.log('REF2', r2Title);
			console.log('JWD', colors.cyan(natural.JaroWinklerDistance(r1Title, r2Title)));
			console.log('Lev', colors.cyan(natural.LevenshteinDistance(r1Title, r2Title)));
			console.log('---');
		}*/

		if (
			(ref1.authors && ref2.authors) &&
			(
				ref1.title == ref2.title ||
				(
					natural.JaroWinklerDistance(r1Title, r2Title) >= config.tasks.dedupe.stringDistance.jaroWinklerMin &&
					natural.LevenshteinDistance(r1Title, r2Title) <= config.tasks.dedupe.stringDistance.levenshteinMax
				)
			) &&
			compareNames(ref1.authors, ref2.authors)
		) return {isDupe: true, reason: 'authors'};
		// }}}

		// Final - not a duplicate {{{
		return {isDupe: false, reason: 'EXHAUSTED'};
		// }}}
	};

	return dedupe;
}

util.inherits(SRADedupe, events.EventEmitter);

module.exports = function(settings) {
	return new SRADedupe(settings);
};
