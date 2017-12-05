'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 
					   'mongodb://localhost/blogApiDb';

exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
	                        'mongodb://localhost/test-blogApiDb';

exports.PORT = process.env.PORT || 8080;