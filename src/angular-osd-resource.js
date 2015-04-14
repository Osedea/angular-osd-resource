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
            self.config.methods = self.config.methods || {};

            var resourceMethods = {
                query: {method: 'GET', isArray: false},
                update: {method: 'PUT'}
            };

            // Add extra methods
            angular.extend(resourceMethods, config.methods);

            self.resource = $resource(config.route, {id: '@id'}, resourceMethods);

            // Create a method on the service for each config method provided
            Object.keys(config.methods).forEach(function (key) {
                self[key] = function (data) {
                    return self.resource[key](data).$promise;
                }
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
            data.decorators = data.decorators || [];
            data.methods = data.methods || {};

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
     Loop through each resource defined in ResourceConfig and create resource.

     @ngInject
     */
    osdResource.run(function (ResourceConfig) {
        ResourceConfig.forEach(function (config) {
            osdResource.register.factory(config.name, ['$resource', createResource(config)]);
        });
    });
})();
