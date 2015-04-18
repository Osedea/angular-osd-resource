(function () {

    'use strict';

    var osdResource = angular.module('osdResource');

    /*
     A single cache decorator is used to cache data for all resources. Each resource caches its
     data in self.caches[<resource name>].

     @ngInject
     */
    function CacheDecorator($delegate, lodash) {
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

        // Give the decorator all methods that the delegated resource has
        angular.extend(decorator, $delegate);

        // Add relation resources to the list of cached calls.
        cachedCalls = cachedCalls.concat($delegate.config.relations);

        /*
         Create empty caches for a specific resource. Each resource method has its own cache object
         which keeps track of the cached data, the query params used and whether or data has been cached.
         */
        function initResourceCache() {
            self.caches[$delegate.config.name] = {};

            cachedCalls.forEach(function (call) {
                self.caches[$delegate.config.name][call] = {
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
        function makeCachedCall(call, params, forced) {
            var currentCache = self.caches[$delegate.config.name];

            if (!currentCache) {
                currentCache = initResourceCache();
            }

            if (!forced && currentCache[call].cached && lodash.isEqual(params, currentCache[call].params)) {
                return currentCache[call].data;
            }

            /*
             Here we cache the results and set flags for the next
             time the resource method is called.
             */
            currentCache[call].cached = true;
            currentCache[call].params = params;

            /*
             This is the decorated call.
             */
            var promisedResponse = $delegate[call](params)
                .then(function (response) {
                    return response;
                });

            currentCache[call].data = promisedResponse;

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

            currentCache.get.cached = false;
            currentCache.query.cached = false;

            return $delegate[call](data);
        }

        // Create decorator methods for all calls that require caching
        cachedCalls.forEach(function (call) {
            decorator[call] = function (params, forced) {
                return makeCachedCall(call, params, forced);
            };
        });

        // Create decorator methods for all calls that invalidate cache
        cacheClearingCalls.forEach(function (call) {
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
    osdResource.run(function (ResourceConfig) {
        ResourceConfig.forEach(function (config) {
            config.decorators.forEach(function (decorator) {
                if (decorator == 'cache') {
                    osdResource.register.decorator(config.name, CacheDecorator);
                }
            });
        });
    });
})();
