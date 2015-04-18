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
        ResourceConfig.forEach(function (config) {
            config.decorators.forEach(function (decorator) {
                if (decorator == 'paginate') {
                    osdResource.register.decorator(config.name, PaginateDecorator);
                }
            });
        });
    });
})();
