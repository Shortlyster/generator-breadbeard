const generators = require('yeoman-generator');

module.exports = generators.Base.extend({
  initializing: function() {
    this.composeWith('breadbeard:base', this, this.options);
  }
});
