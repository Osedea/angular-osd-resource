(function() {
    var osdResource = angular.module('osdResource', [
        'ngLodash'
    ]);
})();

(function () {

    'use strict';

    var osdResource = angular.module('osdResource');

    /*
     Creates a default resource. Generally, we would decorate this with a service that
     handles data returned from an API (for example, we could decorate this with a
     cache decorator). Each resource is built using the ResourceConfig service.
     */
    function createResource(config) {
        return function ($resource) {
            var self = this;

            self.config = config;

            var resourceMethods = {
                query: {method: 'GET', isArray: false},
                update: {method: 'PUT'}
            };

            angular.extend(resourceMethods, config.methods);

            self.resource = $resource(config.route, {id: '@id'}, resourceMethods);

            self.save = function (data) {
                return self.resource.save(data).$promise;
            };

            self.update = function (data) {
                return self.resource.update(data).$promise;
            };

            self.get = function (params) {
                return self.resource.get(params).$promise;
            };

            self.query = function (params) {
                return self.resource.query(params).$promise;
            };

            self.delete = function (id) {
                return self.resource.delete({id: id}).$promise;
            };

            return self;
        };
    }

    /*
     This provider allows separate modules to configure the resource
     generator.

     @ngInject
     */
    osdResource.provider('ResourceConfig', function () {
        var self = this;
        var config = [];

        self.add = function (name, route, data) {
            data.name = name;
            data.route = route;

            config.push(data);

            return self;
        };

        self.$get = function () {
            return config;
        };

        return self;
    });

    /*
     Bind $provide to the module so that it can be used
     during the angular.run phase. Resource creation needs to happen in the
     angular.run phase because configuration isn't available before then.

     @ngInject
     */
    osdResource.config(function ($provide) {
        osdResource.register = {
            factory: $provide.factory,
            decorator: $provide.decorator
        };
    });

    /*
     Loop through each resource defined in ResourceConfig and create resource.

     @ngInject
     */
    osdResource.run(function (ResourceConfig) {
        ResourceConfig.forEach(function (config) {
            osdResource.register.factory(config.name, ['$resource', createResource(config)]);
        });
    });
})();

(function () {

    'use strict';

    var osdResource = angular.module('osdResource');

    /*
     A single cache decorator is used to cache data for all resources. Each resource caches its
     data in self.caches[<resource name>].

     @ngInject
     */
    function CacheDecorator($delegate, lodash) {
        var self = {
            caches: {}
        };

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


    /*
     Loop through each resource defined in ResourceConfig, adding decorator if specified.

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
