function createMixins (execlib) {
  'use strict';

  return {
    service: require('./servicecreator')(execlib)
  };
}
module.exports = createMixins;
