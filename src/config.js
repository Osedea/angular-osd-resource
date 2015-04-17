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
