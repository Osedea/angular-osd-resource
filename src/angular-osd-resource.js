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
