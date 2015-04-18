(function() {
    var testModule = angular.module('testModule', [
        'ngResource',
        'osdResource'
    ]);

       // @ngInject
    function resourceConfig(ResourceConfigProvider) {
        ResourceConfigProvider
            .global({
                decorators: [
                    'cache',
                    'paginate'
                ],
                methods: {
                    query: {method: 'GET', isArray: true}
                }
            })
            .add('UserResource', '/api/v1/users/:id', {
                relations: ['groups']
            });
    }

    angular.module('testModule')
        .config(resourceConfig);
})();
