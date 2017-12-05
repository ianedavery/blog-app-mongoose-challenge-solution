'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogPostData() {
	console.info('seeding blog data');
	const seedData = [];
	for(let i=1; i<=10; i++) {
		seedData.push(generateBlogPostData());
	}
	return BlogPost.insertMany(seedData);
}

function tearDownDb() {
	return new Promise((resolve, reject) => {
		console.warn('Deleting Database');
		mongoose.connection.dropDatabase()
			.then(result => resolve(result))
			.catch(err => reject(err));
	});
}

function generateBlogPostData() {
	return {
	  "title": faker.lorem.sentence(),
	  "author": {
		  "firstName": faker.name.firstName(),
		  "lastName": faker.name.lastName()
	  },
	  "content": faker.lorem.text()
	}
}

describe('BlogPost API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});
	beforeEach(function() {
		return seedBlogPostData();
	});
	afterEach(function() {
		return tearDownDb();
	});
	after(function() {
		return closeServer();
	});
	describe('GET endpoint', function() {
		it('should return all existing posts', function() {
			let res;
			return chai.request(app)
				.get('/posts')
				.then(function(_res) {
					res = _res;
					res.should.have.status(200);
					res.body.should.have.length.of.at.least(1);
					return BlogPost.count();
				})
				.then(function(count) {
					res.body.should.have.length.of.at.least(count);
				});
		});
		it('should return blog posts with right fields', function(){
			let resBlogPost;
			return chai.request(app)
				.get('/posts')
				.then(function(res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a('array');
					res.body.should.have.length.of.at.least(1);
					res.body.forEach(function(blogposts) {
						blogposts.should.be.a('object');
						blogposts.should.include.keys(
							'id', 'title', 'author', 'content', 'created');
					});
					resBlogPost = res.body[0];
					return BlogPost.findById(resBlogPost.id);
				})
				.then(function(blogpost) {
					resBlogPost.id.should.equal(blogpost.id);
					resBlogPost.title.should.equal(blogpost.title);
					resBlogPost.content.should.equal(blogpost.content);
					resBlogPost.author.should.equal(blogpost.authorName);
				});
		});
	});
	describe('POST endpoint', function() {
		it('should add a new post', function() {
			const newPost = {
	  			title: faker.lorem.sentence(),
	  			author: {
		  			firstName: faker.name.firstName(),
		  			lastName: faker.name.lastName()
	 			},
	  			content: faker.lorem.text()
				};
			return chai.request(app)
				.post('/posts')
				.send(newPost)
				.then(function(res) {
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.be.a('object');
					res.body.should.include.keys(
						'id', 'title', 'author', 'content');
					res.body.id.should.not.be.null;
					res.body.title.should.equal(newPost.title);
					res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
					res.body.content.should.equal(newPost.content);
					return BlogPost.findById(res.body.id);
				})
				.then(function(blogpost) {
					blogpost.title.should.equal(newPost.title);
					blogpost.author.firstName.should.equal(newPost.author.firstName);
					blogpost.author.lastName.should.equal(newPost.author.lastName);
					blogpost.content.should.equal(newPost.content);
				});
		});
	});
	describe('PUT endpoint', function() {
		it('should update fields you send over', function() {
			const updateData = {
				title: 'new title'
			};
			return BlogPost
				.findOne()
				.then(function(blogpost) {
					updateData.id = blogpost.id;
					return chai.request(app)
						.put(`/posts/${blogpost.id}`)
						.send(updateData);
				})
				.then(function(res) {
					res.should.have.status(204);
					return BlogPost.findById(updateData.id);
				})
				.then(function(blogpost) {
					blogpost.title.should.equal(updateData.title);
				});
		});
	});
	describe('DELETE endpoint', function() {
		it('should delete a post by id', function() {
			let blogpost;
			return BlogPost
				.findOne()
				.then(function(_blogpost) {
					blogpost = _blogpost;
					return chai.request(app)
						.delete(`/posts/${blogpost.id}`);
				})
				.then(function(res) {
					res.should.have.status(204);
					return BlogPost.findById(blogpost.id);
				})
				.then(function(_blogpost) {
					should.not.exist(_blogpost);
				});
		});
	});
});