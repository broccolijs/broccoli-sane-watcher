var EventEmitter   = require('events').EventEmitter;
var sane           = require('sane');
var Promise        = require('rsvp').Promise;
var printSlowTrees = require('broccoli/lib/logging').printSlowTrees;

module.exports = Watcher;
function Watcher(builder, options) {
  this.builder = builder;
  this.options = options || {};
  this.watched = {};
  this.timeout = null;
  this.sequence = this.build();
}

Watcher.prototype = Object.create(EventEmitter.prototype);

// gathers rapid changes as one build
Watcher.prototype.scheduleBuild = function () {
  if (this.timeout) return;

  var timeout = new Promise(function (resolve, reject) {
    this.timeout = setTimeout(resolve, this.options.debounce || 100);
  }.bind(this));

  var build = function() {
    this.timeout = null;
    return this.build();
  }.bind(this);

  var verbose = this.options.verbose;
  this.sequence = this.sequence.then(function () {
    return timeout.then(build);
  });
};

Watcher.prototype.build = function Watcher_build() {
  var addWatchDir = this.addWatchDir.bind(this);
  var triggerChange = this.triggerChange.bind(this);
  var triggerError = this.triggerError.bind(this);

  return this.builder
    .build(addWatchDir)
    .then(triggerChange, triggerError)
    .then(function(run) {
      if (this.options.verbose) {
        printSlowTrees(run.graph);
      }

      return run;
    }.bind(this));
};

Watcher.prototype.addWatchDir = function Watcher_addWatchDir(dir) {
  if (this.watched[dir]) return;
  var watcher = sane(dir);
  watcher.on('change', this.onFileChanged.bind(this));
  watcher.on('add', this.onFileAdded.bind(this));
  watcher.on('delete', this.onFileDeleted.bind(this));
  this.watched[dir] = watcher;
};

Watcher.prototype.onFileChanged = function (path) {
  if (this.options.verbose) console.log('file changed', path);
  this.scheduleBuild();
};

Watcher.prototype.onFileAdded = function (path) {
  if (this.options.verbose) console.log('file added', path);
  this.scheduleBuild();
};

Watcher.prototype.onFileDeleted = function (path) {
  if (this.options.verbose) console.log('file deleted', path);
  this.scheduleBuild();
};

Watcher.prototype.triggerChange = function (hash) {
  this.emit('change', hash);
  return hash;
};

Watcher.prototype.triggerError = function (error) {
  this.emit('error', error);
  throw error;
};

Watcher.prototype.close = function () {
  clearTimeout(this.timeout);
  var watched = this.watched;
  for (var dir in watched) {
    if (!watched.hasOwnProperty(dir)) continue;
    watched[dir].close();
    delete watched[dir];
  }
};

Watcher.prototype.then = function(success, fail) {
  return this.sequence.then(success, fail);
};
