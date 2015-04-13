(function () {

    'use strict';

    /*
     A single cache decorator is used to cache data for all resources. Each resource caches its
     data in self.caches[<resource name>].

     @ngInject
     */
    function CacheDecorator($delegate, lodash) {
        var self = this;
        self.caches = {};

        function initResourceCache() {
            self.caches[$delegate.config.name] = {
                get: {
                    cached: false,
                    params: null,
                    data: null
                },
                query: {
                    cached: false,
                    params: null,
                    data: null
                }
            };

            return self.caches[$delegate.config.name];
        }

        /*
         If not forced, cached is true and the query params are the same
         return the cached data, otherwise make the API call.
         */
        function getCachedCall(call, params, forced) {
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
        function clearCachedCall(call, data) {
            var currentCache = self.caches[$delegate.config.name];

            if (!currentCache) {
                currentCache = initResourceCache();
            }

            currentCache.get.cached = false;
            currentCache.query.cached = false;

            return $delegate[call](data);
        }

        return {
            // Call the parent save function and invalidate cache
            save: function (data) {
                return clearCachedCall('save', data);
            },

            // Call the parent update function and invalidate cache
            update: function (data) {
                return clearCachedCall('update', data);
            },

            // Get possibly cached data
            get: function (params, forced) {
                return getCachedCall('get', params, forced);
            },

            // Query possibly cached data
            query: function (params, forced) {
                return getCachedCall('query', params, forced);
            },

            // Call the parent delete function and invalidate cache
            delete: function (data) {
                return clearCachedCall('delete', data);
            }
        };
    }
})();
