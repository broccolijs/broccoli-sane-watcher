var Promise = require('rsvp').Promise;

module.exports = Tree;
function Tree(inputs) {
  this.inputs = inputs;
}

Tree.prototype.read = function (readTree) {
  var inputs = this.inputs;
  var sequence = Promise.resolve();

  this.inputs.forEach(function (input) {
    sequence = sequence.then(function () {
      return readTree(input);
    });
  });

  return sequence.then(function () {
    return 'output';
  });
};
