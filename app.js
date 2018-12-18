#!/usr/bin/env node

/**
* Simple, dumb command line runner for the dedupe
* Usage: ./app.js <input.json> [output.json]

* Input must be valid JSON following the Reflib standard
* If output is omitted the input file is used and changed in place
* Change the duplicate detection action by setting the `DEDUPE_ACTION` environment variable. Actions are 'remove' and 'mark'
* Change the field that gets marked if action is 'mark' by setting `DEDUPE_MARK_FIELD` from its default of 'caption'
*/

var Dedupe = require('.');
var fs = require('fs');

var inputPath = process.argv[2];
var outputPath = process.argv[3] || input;
var action = process.env.DEDUPE_ACTION || 'remove';
var markField = process.env.DEDUPE_MARK_FIELD || 'caption'

var dedupe = new Dedupe();
var refs = JSON.parse(fs.readFileSync(inputPath));

dedupe.compareAll(refs)
	.on('dupe', (ref1, ref2, res) => {
		if (action == 'remove') {
			ref2.DELETE = true;
		} else if (action == 'mark') {
			ref2[markField] = 'DUPE OF ' + ref1.recNumber;
		}
	})
	.on('error', err => {
		console.log('Error', err.toString());
		process.exit(1);
	})
	.on('end', ()=> {
		if (action == 'remove') refs = refs.filter(ref => !ref.DELETE); // Remove all refs marked as deleted

		fs.writeFileSync(outputPath, JSON.stringify(refs));

		process.exit(0);
	});
