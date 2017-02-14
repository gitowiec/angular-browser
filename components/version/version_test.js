'use strict';

describe('mzBrowser.version module', function() {
  beforeEach(module('mzBrowser.version'));

  describe('version service', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.1');
    }));
  });
});
