'use strict';

angular.module('mzBrowser.version', [
  'mzBrowser.version.interpolate-filter',
  'mzBrowser.version.version-directive'
])

.value('version', '0.2');
