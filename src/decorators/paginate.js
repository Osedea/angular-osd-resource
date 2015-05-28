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
