(function() {
    var osdResource = angular.module('osdResource', [
        'ngLodash'
    ]);
})();

(function() {

    'use strict';

    var osdResource = angular.module('osdResource');

    /*
     Bind $provide to the module so that it can be used during the angular.run phase.
     Resource creation needs to happen in the angular.run phase because configuration
     from other modules isn't available before then.

     @ngInject
     */
    osdResource.config(function ($provide) {
        osdResource.register = {
            factory: $provide.factory,
            decorator: $provide.decorator
        };
    });

    /*
     A provider for separate modules to configure the resource generator.

     @ngInject
     */
    osdResource.provider('ResourceConfig', function () {
        var self = this;
        var config = [];
        var global = {
            decorators: [],
            methods: {}
        };

        self.add = function (name, route, data) {
            data = data || {};
            data.name = name;
            data.route = route;

            // Extra configurations
            data.decorators = data.decorators || [];
            data.methods = data.methods || {};
            data.relations = data.relations || [];

            // Add global values to config
            data.decorators = data.decorators.concat(global.decorators);
            angular.extend(data.methods, global.methods);

            config.push(data);

            return self;
        };

        self.global = function(data) {
            global = data;

            return self;
        };

        self.$get = function () {
            return config;
        };

        return self;
    });
})();

(function () {

    'use strict';

    var osdResource = angular.module('osdResource');

    /*
     Creates a default resource. Generally, we would decorate this with a service that
     handles data returned from an API (for example, we could decorate this with a
     cache decorator). Each resource is built using the ResourceConfig provider.
     */
    function createResource(config) {
        return function ($resource) {
            var self = this;

            self.config = config;

            var resourceMethods = {
                query: {method: 'GET', isArray: false},
                update: {method: 'PUT'}
            };

            // Add custom resource methods
            angular.extend(resourceMethods, config.methods);

            // Add relation resource methods
            angular.forEach(self.config.relations, function (relation) {
                resourceMethods[relation] = { method: 'GET', isArray: true, url: self.config.route + '/' + relation };
            });

            // Build the $resource
            self.resource = $resource(config.route, {id: '@id'}, resourceMethods);

            // Create a functions on the service for each custom method set on $resource
            angular.forEach(Object.keys(config.methods), function (key) {
                self[key] = function (data) {
                    return self.resource[key](data).$promise;
                };
            });

            // Create a functions on the service for each relation method set on $resource
            angular.forEach(self.config.relations, function (relation) {
                self[relation] = function (data) {
                    return self.resource[relation](data).$promise;
                };
            });

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
     Loop through each resource defined in ResourceConfig and create resource.

     @ngInject
     */
    osdResource.run(function (ResourceConfig) {
        angular.forEach(ResourceConfig, function (config) {
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

            angular.forEach(cachedCalls, function (call) {
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
        angular.forEach(cachedCalls, function (call) {
            decorator[call] = function (params, forced) {
                return makeCachedCall(call, params, forced);
            };
        });

        // Create decorator methods for all calls that invalidate cache
        angular.forEach(cacheClearingCalls, function (call) {
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
        angular.forEach(ResourceConfig, function (config) {
            angular.forEach(config.decorators, function (decorator) {
                if (decorator == 'cache') {
                    osdResource.register.decorator(config.name, CacheDecorator);
                }
            });
        });
    });
})();

(function () {

    'use strict';

    var osdResource = angular.module('osdResource');

    /*
     A single paginate decorator is used to paginate data for all resources. Each resource stores its
     pagination status in self.paginationStates[<resource name>].

     @ngInject
     */
    function PaginateDecorator($delegate) {
        var paginator = {};

        if (!paginator.paginationStates) {
            paginator.paginationStates = {};
        }

        angular.extend(paginator, $delegate);

        paginator.paginationStates[$delegate.config.name] = {
            page: 1,
            perPage: null
        };

        /* Extend the params with pagination state and make query */
        paginator.query = function(params) {
            params = params || {};

            angular.extend(params, paginator.paginationStates[$delegate.config.name]);

            /* This is the decorated call. */
            return $delegate.query(params);
        };

        /* Decrement the current page and make paginated query */
        paginator.prevPage = function(params) {
            paginator.paginationStates[$delegate.config.name].page--;
            paginator.query(params);
        };

        /* Increment the current page and make paginated query */
        paginator.nextPage = function(params) {
            paginator.paginationStates[$delegate.config.name].page++;
            paginator.query(params);
        };

        paginator.perPage = function(value) {
            paginator.paginationStates[$delegate.config.name].perPage = value;

            return paginator;
        };

        paginator.page = function(value) {
            paginator.paginationStates[$delegate.config.name].page = value;

            return paginator;
        };

        return paginator;
    }

    /*
     Loop through each resource defined in ResourceConfig, adding paginate decorator if specified.

     @ngInject
     */
    osdResource.run(function (ResourceConfig) {
        angular.forEach(ResourceConfig, function (config) {
            angular.forEach(config.decorators, function (decorator) {
                if (decorator == 'paginate') {
                    osdResource.register.decorator(config.name, PaginateDecorator);
                }
            });
        });
    });
})();
