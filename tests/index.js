var fs = require('fs');
var broccoli = require('broccoli');
var rimraf = require('rimraf');
var assert = require("assert");
var Watcher = require('..');
var Tree = require('./tree');


describe('broccoli-sane-watcher', function (done) {
  var watcher;

  beforeEach(function () {
    fs.mkdirSync('tests/fixtures');
  });

  afterEach(function (done) {
    if (watcher) {
      watcher.close();
      watcher = null;
    }
    rimraf('tests/fixtures', done);
  });

  it('test watching', function (done) {
    fs.mkdirSync('tests/fixtures/a');
    var changes = 0;
    var tree = new Tree(['tests/fixtures/a']);
    var builder = new broccoli.Builder(tree);
    watcher = new Watcher(builder);
    watcher.on('change', function (results) {
      assert.equal(results.directory, 'output');
      if (changes++) {
        done();
      } else {
        fs.writeFileSync('tests/fixtures/a/file.js');
      }
    });
    watcher.on('error', function (error) {
      assert.ok(false, error.message);
      done();
    });
  });
});
