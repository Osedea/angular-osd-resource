(function() {
    var osdResource = angular.module('osdResource', [
        'ngLodash',
        'ngResource'
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
        return function ($resource, lodash) {
            var self = this;

            self.config = config;

            var resourceMethods = {
                query: {method: 'GET', isArray: false},
                update: {method: 'PUT'}
            };

            // Add custom resource methods
            lodash.assign(resourceMethods, config.methods);

            // Add relation resource methods
            lodash.forEach(self.config.relations, function (relation) {
                resourceMethods[relation] = { method: 'GET', isArray: true, url: self.config.route + '/' + relation };
            });

            // Build the $resource
            self.resource = $resource(config.route, {id: '@id'}, resourceMethods);

            // Create a functions on the service for each custom method set on $resource
            lodash.forEach(Object.keys(config.methods), function (key) {
                self[key] = function (data) {
                    return self.resource[key](data).$promise;
                };
            });

            // Create a functions on the service for each relation method set on $resource
            lodash.forEach(self.config.relations, function (relation) {
                self[relation] = function (data) {
                    return self.resource[relation](data).$promise;
                };
            });

            self.save = function (data, success, error) {
                return self.resource.save({}, data, success, error).$promise;
            };

            self.update = function (data, success, error) {
                return self.resource.update({}, data, success, error).$promise;
            };

            self.get = function (params, success, error) {
                return self.resource.get(params, success, error).$promise;
            };

            self.query = function (params, success, error) {
                return self.resource.query(params, success, error).$promise;
            };

            // Delete is a reserved keyword in IE8
            self['delete'] = function (id, success, error) {
                return self.resource['delete']({id: id}, success, error).$promise;
            };

            return self;
        };
    }

    /*
     Loop through each resource defined in ResourceConfig and create resource.

     @ngInject
     */
    osdResource.run(function (ResourceConfig, lodash) {
        lodash.forEach(ResourceConfig, function (config) {
            osdResource.register.factory(config.name, ['$resource', 'lodash', createResource(config)]);
        });
    });
}());

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

        var forced = false;

        // Give the decorator all methods that the delegated resource has
        lodash.extend(decorator, $delegate);

        // Add relation resources to the list of cached calls.
        cachedCalls = cachedCalls.concat($delegate.config.relations);

        // Clears all cached data for the given resource.
        self.clearCache = function() {
            self.caches[$delegate.config.name] = {};
        };

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

(function () {

    'use strict';

    var osdResource = angular.module('osdResource');

    /*
     A single paginate decorator is used to paginate data for all resources. Each resource stores its
     pagination status in self.paginationStates[<resource name>].

     @ngInject
     */
    function PaginateDecorator($delegate, lodash) {
        var paginator = {};

        var allowedParams = [
            'page',
            'perPage'
        ];

        if (!paginator.paginationStates) {
            paginator.paginationStates = {};
        }

        lodash.assign(paginator, $delegate);

        paginator.paginationStates[$delegate.config.name] = {
            page: 1,
            perPage: null,
            totalCount: 0,
            totalPage: 0
        };

        /* Extend the params with pagination state and make query */
        paginator.query = function (params) {
            params = params || {};

            var paginationStates = paginator.paginationStates[$delegate.config.name];

            // Add only allowed query params
            lodash.assign(
                params,
                lodash.pick(
                    paginationStates,
                    allowedParams
                )
            );

            /* This is the decorated call. */
            return $delegate.query(
                params,
                function success(response, headers) {
                    // This is the way to get the response headers
                    paginationStates.totalCount = headers('x-total-count');
                    paginationStates.totalPages = headers('x-total-pages');
                }
            );
        };

        /* Decrement the current page and make paginated query */
        paginator.prevPage = function (params) {
            paginator.paginationStates[$delegate.config.name].page--;

            return paginator.query(params);
        };

        /* Increment the current page and make paginated query */
        paginator.nextPage = function (params) {
            paginator.paginationStates[$delegate.config.name].page++;

            return paginator.query(params);
        };

        /* Set the number of items per page to query */
        paginator.perPage = function (value) {
            paginator.paginationStates[$delegate.config.name].perPage = value;

            return paginator;
        };

        /* Set the current page */
        paginator.page = function (value) {
            paginator.paginationStates[$delegate.config.name].page = value;

            return paginator;
        };

        /* Get total number of pages for this query */
        paginator.getTotalPage = function () {
            return paginator.paginationStates[$delegate.config.name].totalPage;
        };

        /* Get total number of items in this request */
        paginator.getTotalCount = function () {
            return paginator.paginationStates[$delegate.config.name].totalCount;
        };

        /* Check if the query has more items to load */
        paginator.hasMore = function () {
            return paginator.paginationStates[$delegate.config.name].totalPage > paginator.paginationStates[$delegate.config.name].page;
        };

        return paginator;
    }

    /*
     Loop through each resource defined in ResourceConfig, adding paginate decorator if specified.

     @ngInject
     */
    osdResource.run(function (ResourceConfig, lodash) {
        lodash.forEach(ResourceConfig, function (config) {
            lodash.forEach(config.decorators, function (decorator) {
                if (decorator == 'paginate') {
                    osdResource.register.decorator(config.name, PaginateDecorator);
                }
            });
        });
    });
}());
