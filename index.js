function createLib (execlib) {
  return execlib.loadDependencies('client', ['allex:varargfunctionhandler:lib'], createMixins.bind(null, execlib));
}

function createMixins (execlib, vararglib) {
  'use strict';

  return {
    service: require('./servicecreator')(execlib, vararglib)
  };
}
module.exports = createLib;
