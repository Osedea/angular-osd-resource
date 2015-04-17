(function() {

    'use strict';

    var osdResource = angular.module('osdResource');

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
