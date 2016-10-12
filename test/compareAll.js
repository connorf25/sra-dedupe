var dedupeLib = require('..');
var expect = require('chai').expect;

describe('dedupe.compareAll()', function() {

	it('should compare a non-duplicate library', function(done) {
		var dedupe = dedupeLib();
		dedupe.compareAll(require('./data/nodupes.json'))
			.on('dupe', function(ref1, ref2, result) {
				console.log('FAIL', ref1, ref2, result);
				expect.fail();
			})
			.on('end', done);
	});

	it('should compare a library with duplicates', function(done) {
		this.timeout(10 * 10000);
		var library = require('./data/dupes.json');
		var dedupe = dedupeLib();
		var dupes = [];
		var progressUpdates = 0;
		dedupe.compareAll(library)
			.on('dupe', function(ref1, ref2, result) {
				dupes.push(result);
			})
			.on('progress', function(current, max) {
				progressUpdates++;
			})
			.on('end', function() {
				expect(progressUpdates).to.be.above(0);
				expect(dupes).to.have.length.above(0);
				expect(dupes).to.have.length.below(library.length / 8); // Only allow 1/8th of the library to be dupes
				done();
			});
	});
});
