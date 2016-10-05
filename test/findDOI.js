var dedupe = require('..')();
var expect = require('chai').expect;

describe('dedupe.findDOI()', function() {

	it('should find a DOI in the DOI field', function() {
		expect(dedupe.findDOI({doi: '10.1109/5.771073'})).to.equal('10.1109/5.771073');
		expect(dedupe.findDOI({doi: 'http://doi.org/10.1109/5.771073'})).to.equal('10.1109/5.771073');
		expect(dedupe.findDOI({doi: 'https://doi.org/10.1109/5.771073'})).to.equal('10.1109/5.771073');
		expect(dedupe.findDOI({doi: 'nope'})).to.be.false;
	});

	it('should find a DOI in the URL array', function() {
		expect(dedupe.findDOI({urls: ['foo', 'bar', '10.1109/5.771073', 'baz']})).to.equal('10.1109/5.771073');
		expect(dedupe.findDOI({urls: ['http://google.com', 'http://doi.org/10.1109/5.771073']})).to.equal('10.1109/5.771073');
		expect(dedupe.findDOI({urls: ['https://doi.org/10.1109/5.771073', 'https://bbc.co.uk']})).to.equal('10.1109/5.771073');
		expect(dedupe.findDOI({urls: ['http://google.com', 'https://bbc.co.uk']})).to.be.false;
		expect(dedupe.findDOI({urls: []})).to.be.false;
	});

});
