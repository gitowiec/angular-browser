'use strict';


angular.module('mzBrowser', [
    'ngRoute',
    'ui.bootstrap',
    'mzBrowser.grid',
    'mzBrowser.list'
]).filter('Date', function () {
    return function (text) {
        var d = new Date(text * 1000);
        return d.toLocaleString('pl');
    };
}).directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
}).constant("NOT_IMPORTANT", {
    "ACCESS_TOKEN"     : "2051206158.e744635.e0bac9ff782b4fb8a17a7e31667af23b",
    "CLIENT_ID"        : "e7446359d4d942dfafe4937c021c5c35",
    // "END_POINT"        : "https://api.instagram.com/v1/tags/{{tagName}}/media/recent?scope=public_content&client_id={{cId}}&callback=JSON_CALLBACK",
    "END_POINT_AT"     : "https://api.instagram.com/v1/tags/{{tagName}}/media/recent?scope=public_content&access_token={{accessToken}}&callback=JSON_CALLBACK",
    // "END_POINT_MORE"   : "https://api.instagram.com/v1/tags/{{tagName}}/media/recent?scope=public_content&client_id={{cId}}&max_tag_id={{maxTagId}}&callback=JSON_CALLBACK",
    "END_POINT_MORE_AT": "https://api.instagram.com/v1/tags/{{tagName}}/media/recent?scope=public_content&access_token={{accessToken}}&max_tag_id={{maxTagId}}&callback=JSON_CALLBACK"
}).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/grid'});
}]).factory('instagramService', ['$http', 'NOT_IMPORTANT', '$interpolate',
    function ($http, NOT_IMPORTANT, $interpolate) {

        var instance, tag_name = null,
            next_max_tag_id = null,
            min_tag_id = null,
            access_token = null;
        var currentPictures = [];


        /**
         * Metody prywatne
         */
        var loadByTag = function (tagName, callback) {
            var endPoint = $interpolate(NOT_IMPORTANT.END_POINT_AT)({
                'tagName': tagName,
                // 'accessToken': NOT_IMPORTANT.ACCESS_TOKEN
                'accessToken': access_token
            });
            tag_name = tagName;
            $http.jsonp(endPoint).success(function (response) {
                // console.log(response);
                next_max_tag_id = response.pagination.next_max_tag_id;
                min_tag_id = response.pagination.min_tag_id;
                callback(response.data);
            });
        };
        var loadMore = function (callback) {
            if (String(tag_name) !== 'null' && String(next_max_tag_id) !== 'null') {
                var endPoint = $interpolate(NOT_IMPORTANT.END_POINT_MORE_AT)({
                    'tagName'    : tag_name,
                    'maxTagId'   : next_max_tag_id,
                    // 'accessToken': NOT_IMPORTANT.ACCESS_TOKEN
                    'accessToken': access_token
                    //'maxTagId': min_tag_id
                });
                $http.jsonp(endPoint).success(function (response) {
                    next_max_tag_id = response.pagination.next_max_tag_id;
                    min_tag_id = response.pagination.min_tag_id;
                    callback(response.data);
                });
            }
        };


        function preparePrevNext(currentPictures) {
            var len = currentPictures.length;

            for (var i = 0; i < len; i++) {
                currentPictures[i].nextId = angular.isObject(currentPictures[i - 1]) ? currentPictures[i - 1].id : currentPictures[len - 1].id;
                currentPictures[i].prevId = angular.isObject(currentPictures[i + 1]) ? currentPictures[i + 1].id : currentPictures[0].id;
            }
        }

        function sortById(data, dir) {
            dir = dir || 1;
            data.sort(function (a, b) {
                if (a.id < b.id) {
                    return -1 * dir;
                } else if (a.id > b.id) {
                    return 1 * dir;
                } else {
                    return 0;
                }
            });
        }

        //console.log(currentPictures.getLast());
        /**
         * Metody publiczne
         * @type {{next_max_tag_id: null, min_tag_id: null, tag_name: null, currentPictures: {}, reset: Function, loadByTag: Function, loadMore: Function}}
         */
        instance = {
            reset             : function () {
                next_max_tag_id = null;
                min_tag_id = null;
                tag_name = null;
                currentPictures = [];
            },
            getPictureById    : function (id) {
                var result = {};
                angular.forEach(currentPictures, function (val, index) {
                    if (val.id == id) {
                        result = val;
                    }
                });
                return result;
            },
            /**
             * Zwraca listę aktualnie wyświetlanych obrazków
             * @returns {Array}
             */
            getCurrentPictures: function () {
                return currentPictures;
            },

            next: function ($scope) {
                access_token = $scope.$parent.getAccessToken();
                loadByTag($scope.$parent.getTag(), function (data) {
                    for (var i = 0; i < data.length; i++) {
                        data[i].id = data[i].id.replace(/^(\d+)\_(\d+)/, '$1');
                        //console.log(data[i].id);
                        currentPictures.push(data[i]);
                        $scope.counter.photos++;
                    }
                    sortById(currentPictures, 1);
                    preparePrevNext(currentPictures);
                    //console.log(currentPictures);
                    $scope.images = currentPictures;
                });
            },
            more: function ($scope) {
                access_token = $scope.$parent.getAccessToken();

                loadMore(function (data) {
                    for (var i = 0; i < data.length; i++) {
                        data[i].id = data[i].id.replace(/^(\d+)\_(\d+)/, '$1');
                        currentPictures.push(data[i]);
                        $scope.counter.photos++;
                    }
                    sortById(currentPictures, 1);
                    preparePrevNext(currentPictures);
                    $scope.images = currentPictures;
                });
            }
        };

        return instance;
    }

]).controller('FrontController', ['$scope', '$modal', 'instagramService', '$location',
    function ($scope, $modal, instagramService, $location) {

        var modalInstance;

        $scope.tag = 'vwvan';
        $scope.counter = {
            photos: 0
        };


        $scope.childView = null;
        $scope.sort = "-id";
        /**
         * Ustawia nazwę klasy html "active" na elemencie menu
         * @param path
         * @returns {*}
         */
        $scope.getHTMLClass = function (path) {
            if ($location.path().substr(0, path.length) == path) {
                return "active"
            } else {
                return ""
            }
        };


        /**
         * Ustawia wartosc inputa tag
         * @param tag
         */
        $scope.setTag = function (tag) {
            $scope.tag = tag;
        };
        /**
         * Zwara wartosc inputa tag
         * @returns {string|*}
         */
        $scope.getTag = function () {
            return $scope.tag;
        };

        $scope.getAccessToken = function () {
            return $scope.accessToken;
        };

        /**
         * Ustawia w widoku parent podwidok child
         * @param obj
         */
        $scope.setChildView = function (obj) {
            $scope.childView = obj;
        };

        /**
         * Czysci liste/grid zdjec
         */
        $scope.clearView = function () {
            //console.log($location.path().replace(/^\/(grid|list)\//i,'').length);
            if (String($scope.childView) !== 'null' || typeof $scope.childView !== 'undefined') {
                $location.path($location.path().substr(0, $location.path().replace(/^\/(grid|list)\//i, '').length));
                $scope.childView.images = [];
                instagramService.reset();
                $scope.counter.photos = 0;
                $scope.moreIsDisabled = true;

            }
        };

        /**
         * Szuka po tagu
         */
        $scope.searchByTag = function () {
            $scope.clearView();
            if (String($scope.childView) !== 'null' || typeof $scope.childView !== 'undefined') {
                $scope.childView.images = [];
                $scope.counter.photos = 0;
                instagramService.next($scope.childView);
                $scope.moreIsDisabled = $scope.childView.images > 0;
            }
        };

        /**
         * Pobiera wiecej zdjec o wybranym tagu
         */
        $scope.getMore = function () {
            if (String($scope.childView) !== 'null' || typeof $scope.childView !== 'undefined') {
                instagramService.more($scope.childView);
            }
        };

        /**
         * Pokazuje modal z informacja o zdjeciu
         * @param img
         */
        $scope.showInfo = function (img) {
            //console.log(img);
            modalInstance = $modal.open({
                templateUrl: $scope.childView.modalTemplate,
                controller : 'ModalInstanceCtrl',
                size       : 'lg',
                resolve    : {
                    image: function () {
                        return img;
                    }
                }
            });
            modalInstance.result.then(
                function (result) {
                    if (typeof result === 'undefined') {
                        $location.path($location.path().replace(/^\/(grid|list)\/([_0-9]+)/i, '/$1'));
                    }
                },
                function (result) {
                    if (result === 'backdrop click') {
                        $location.path($location.path().replace(/^\/(grid|list)\/([_0-9]+)/i, '/$1'));
                    }
                });
        };

        $scope.start = function () {
            //console.log('start!');
            //$scope.searchByTag();
            //instagramService.next($scope.childView);
        };


        $scope.$on('gridBroadcast', function () {
            $scope.searchByTag();
        });

        $scope.$on('modalOpen', function (e, img) {
            //console.log(e);
            //console.log(img);
            if (modalInstance) modalInstance.close(false);
            $scope.showInfo(img);
        });

    }])
/**
 * Kontroler sterujacy zachowaniem modala
 */
    .controller('ModalInstanceCtrl', function ($scope, $modalInstance, image) {

        $scope.image = image;

        $scope.zoomIn = function (image) {
            console.log(image);
        };

        $scope.ok = function () {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss();
        };


        $scope.$on('modalClose', function () {
            $modalInstance.close();
        });


    });



