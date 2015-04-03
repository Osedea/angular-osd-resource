(function () {

    var osdResource = angular.module('osdResource', []);

    /*
      Creates a default resource. Generally, we would decorate this with a service that
      handles data returned from an API (for example, we could decorate this with a
      cache decorator). Each resource is built using a resourceConfig constant.
     */
    function createResource(config) {
        return function ($resource) {

            var resource = $resource(config.route, {id: '@id'}, {
                query: {method: 'GET', isArray: false},
                update: {method: 'PUT'}
            });

            return {
                save: function (data) {
                    return resource.save(data).$promise;
                },

                update: function (data) {
                    return resource.update(data).$promise;
                },

                get: function (params) {
                    return resource.get(params).$promise;
                },

                query: function (params) {
                    return resource.query(params).$promise;
                },

                delete: function (id) {
                    return resource.delete({id: id}).$promise;
                },
            };
        };
    }

    // @ngInject
    function cacheDecorator($delegate, $q) {
        var self = this;

        self.get = {
            cached: false,
            params: null,
            deferred: null,
        };

        self.query = {
            cached: false,
            params: null,
            deferred: null,
        };

        /*
         If not forced, cached is true and the query params are the same
         return the cached data, otherwise make the API call.
         */
        function getCachedCall(call, params, forced) {
            if (!forced && self[call].cached && params === self[call].params) {
                return self[call].deferred.promise;
            }

            self[call].deferred = $q.defer();

            // This is the decorated call
            $delegate[call](params)
                .then(function(response) {
                    self[call].deferred.resolve(response);
                });

            self[call].cached = true;
            self[call].params = params;

            return self[call].deferred.promise;
        }

        function clearCachedCall(call, data) {
                get.cached = false;
                query.cached = false;

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
            },
        };
    }

    /*
      This provider allows separate modules to configure the resource
      generator.
     */
    osdResource.provider('ResourceConfig', function() {
        var config = [];

        return {
            config: function(value) {
                config = value;
            },

            $get: function() {
                return config;
            },
        };
    });

    /*
      Bind the $provide provider to the module so that it can be used
      during the angular.run phase. Resource creation needs to happen in the
      angular.run phase because configuration isn't available before then.

     @ngInject
     */
    osdResource.config(function($provide) {
        osdResource.register = {
            factory: $provide.factory,
            decorator: $provide.decorator,
        };
    });

    /*
     Loop through each resource defined in resourceConfig,
     create resources and adding decorators if specified.

     @ngInject
    */
    osdResource.run(function(ResourceConfig) {
        ResourceConfig.forEach(function (config) {
            osdResource.register.factory(config.name, ['$resource', createResource(config)]);

            config.decorators.forEach(function(decorator) {
                if (decorator == 'cache') {
                    osdResource.register.decorator(config.name, cacheDecorator);
                }
            });
        });
    });
})();

