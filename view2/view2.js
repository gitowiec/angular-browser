'use strict';

angular.module('mzBrowser.list', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/list/:imageId?', {
            templateUrl: 'view2/view2.html',
            controller: 'View2Ctrl'
        });
    }])

    .controller('View2Ctrl', ['instagramService', '$scope', '$rootScope', '$routeParams',
        function (instagramService, $scope, $rootScope, $routeParams) {

            $scope.modalTemplate = 'imageZoomModal.html';

            $scope.setChildView($scope);

            if (typeof $routeParams.imageId !== 'undefined' && instagramService.getPictureById($routeParams.imageId)) {
                $rootScope.$broadcast('modalOpen',instagramService.getPictureById($routeParams.imageId));
            }

            var currPicts = instagramService.getCurrentPictures();

            if (currPicts.length > 0) {
                $scope.images = currPicts;
            } else {
                $rootScope.$broadcast('gridBroadcast');
            }

        }]);
