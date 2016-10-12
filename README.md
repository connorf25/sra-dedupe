SRA-Dedupe
=================================
This module is part of the [Bond University Centre for Research in Evidence-Based Practice](https://github.com/CREBP) Systematic Review Assistant suite of tools.

This module forms the reference library deduplication tool.

The [previous version of this module](https://github.com/CREBP/SRA/blob/master/application/models/reference.php#L122-L191) was PHP based, this version is NodeJS and is intended to be used as part of a suite - i.e. this module cannot do data access by itself and forms only the most atomic of deduplication operations.


See the [reflib-cli](https://github.com/hash-bang/Reflib-CLI) program for a user facing version of this module.


```javascript
var dedupeLib = require('sra-dedupe');
var dedupe = dedupeLib();
var refs = [ /* get reference library somehow */ ];

dedupe.compareAll(refs)
	.on('dupe', function(ref1, ref2, result) {
		console.log('Duplicate', ref1.recNumber, ref2.recNumber, result);
	})
	.on('end', function() { /* Do something when finished */ }
```


API
===
The source code of the module has more detail including valid parameters and returns from each function. Below is a summary of the available APIs for brief reference.

Dedupe(settings)
----------------
Initialize the object with the given settings.
You can also set settings directly via the object.


dedupe.findDOI(ref)
-------------------
Attempt to locate and extract a DOI from a reference
The DOI could be located in the DOI field or stored as a URL within the url array


dedupe.compare(ref1, ref2)
--------------------------
Examine two inputs and decide if they are duplicate references.


dedupe.compareAll(refs)
-----------------------
Asynchronously compare all entities within a collection firing emitters as duplicates are found.
This function uses a lazy Cartesian product iterator to optimize the stack when iterating.
