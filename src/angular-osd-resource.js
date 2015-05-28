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
                return self.resource.save(data, success, error).$promise;
            };

            self.update = function (data, success, error) {
                return self.resource.update(data, success, error).$promise;
            };

            self.get = function (params, success, error) {
                return self.resource.get(params, success, error).$promise;
            };

            self.query = function (params, success, error) {
                return self.resource.query(params, success, error).$promise;
            };

            self.delete = function (id, success, error) {
                return self.resource.delete({id: id}, success, error).$promise;
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
