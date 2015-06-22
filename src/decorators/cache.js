(function () {

    'use strict';

    var osdResource = angular.module('osdResource');

    /*
     A single cache decorator is used to cache data for all resources. Each resource caches its
     data in self.caches[<resource name>].

     @ngInject
     */
    function CacheDecorator($rootScope, $delegate, lodash) {
        var decorator = {};

        var self = {
            caches: {}
        };

        var cachedCalls = [
            'get',
            'query'
        ];

        var cacheClearingCalls = [
            'save',
            'update',
            'delete'
        ];

        var forced = false;

        // Give the decorator all methods that the delegated resource has
        lodash.extend(decorator, $delegate);

        // Add relation resources to the list of cached calls.
        cachedCalls = cachedCalls.concat($delegate.config.relations);

        // Clears all cached data for the given resource.
        decorator.clearCache = function() {
            self.caches[$delegate.config.name] = {};
        };

        // Event for clearing all caches. Typical use is for after a user logs out.
        $rootScope.$on('osdResource.cache.clearAll', function (event) {
            self.caches = {};
        });

        function objectToString(obj) {
            var result = [];

            lodash.forIn(obj, function (value, key) {
                result.push(key + ':' + value);
            });

            return result.join('&');
        }

        /*
         Simple hash function to convert string to integer. This is the java implementation of a
         hashing algorithm.

         Source: http://stackoverflow.com/a/7616484
         */
        function hash(str) {
            var res = 0;
            var len = str.length;

            for (var i = 0; i < len; i++) {
                res = res * 31 + str.charCodeAt(i);
            }

            return res;
        }

        /*
         Create empty caches for a specific resource. Each resource method has its own cache object
         which keeps track of the cached data, the query params used and whether or data has been cached.
         */
        function initResourceCache(hash) {
            self.caches[$delegate.config.name] = {};

            lodash.forEach(cachedCalls, function (call) {
                self.caches[$delegate.config.name][call] = {};

                self.caches[$delegate.config.name][call][hash] = {
                    cached: false,
                    params: null,
                    data: null
                };
            });

            return self.caches[$delegate.config.name];
        }

        /*
         If not forced, cached is true, and the query params are the same,
         return the cached data; otherwise make the API call.
         */
        function makeCachedCall(call, params) {
            var currentCache = self.caches[$delegate.config.name];
            var paramsHash = hash(objectToString(params));

            if (!currentCache || !currentCache[call] || !currentCache[call][paramsHash]) {
                currentCache = initResourceCache(paramsHash);
            }

            // Check if we explicitely don't want a cached call or if it's
            // already cached.
            if (!forced && currentCache[call][paramsHash].cached) {
                return currentCache[call][paramsHash].data;
            }

            /*
             Here we cache the results and set flags for the next
             time the resource method is called.
             */
            currentCache[call][paramsHash].cached = true;
            currentCache[call][paramsHash].params = params;

            /*
             This is the decorated call.
             */
            var promisedResponse = $delegate[call](params)
                .then(function (response) {
                    return response;
                });

            currentCache[call][paramsHash].data = promisedResponse;

            // Reset forced flag
            forced = false;

            return promisedResponse;
        }

        /*
         On save or update, we invalidate the cache. This prevents us
         from returning outdated data on a later call.
         */
        function makeCacheClearingCall(call, data) {
            var currentCache = self.caches[$delegate.config.name];

            if (!currentCache) {
                currentCache = initResourceCache();
            }

            lodash.forEach(currentCache.get, function (cacheCall) {
                cacheCall.cached = false;
            });
            lodash.forEach(currentCache.query, function (cacheCall) {
                cacheCall.cached = false;
            });

            return $delegate[call](data);
        }

        // Set forced to true, the cache will not be used for the next call.
        decorator.setForced = function () {
            forced = true;

            return decorator;
        };

        // Create decorator methods for all calls that require caching.
        lodash.forEach(cachedCalls, function (call) {
            decorator[call] = function (params) {
                return makeCachedCall(call, params);
            };
        });

        // Create decorator methods for all calls that invalidate cache.
        lodash.forEach(cacheClearingCalls, function (call) {
            decorator[call] = function (data) {
                return makeCacheClearingCall(call, data);
            };
        });

        return decorator;
    }

    /*
     Loop through each resource defined in ResourceConfig, adding cache decorator if specified.

     @ngInject
     */
    osdResource.run(function (ResourceConfig, lodash) {
        lodash.forEach(ResourceConfig, function (config) {
            lodash.forEach(config.decorators, function (decorator) {
                if (decorator == 'cache') {
                    osdResource.register.decorator(config.name, CacheDecorator);
                }
            });
        });
    });
}());
