'use strict';

angular.module('mzBrowser.grid', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/grid/:imageId?', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', ['instagramService', '$scope', '$rootScope', '$routeParams',
        function (instagramService, $scope, $rootScope, $routeParams) {

            $scope.modalTemplate = 'imageInfoModal.html';

            $scope.setChildView($scope);

            if (typeof $routeParams.imageId !== 'undefined' && instagramService.getPictureById($routeParams.imageId)) {
                //console.log(instagramService.getPictureById($routeParams.imageId));
                $rootScope.$broadcast('modalOpen',instagramService.getPictureById($routeParams.imageId));
            }

            var currPicts = instagramService.getCurrentPictures();

            if (currPicts.length > 0) {
                $scope.images = currPicts;
            } else {
                $rootScope.$broadcast('gridBroadcast');
            }


        }]);
