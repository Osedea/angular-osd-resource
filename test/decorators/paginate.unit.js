describe('PaginateDecorator', function() {
    var $resource, $q, UserResource;

    beforeEach(module('testModule'));

    beforeEach(inject(function(_$resource_, _$q_, _UserResource_) {
        $q = _$q_;
        $resource = _$resource_;
        UserResource = _UserResource_;
    }));

    it('should have access to UserResource', function() {
        expect(UserResource).not.toBe(null);
    });

    it('should set the correct defaults for pagination', function() {
        expect(UserResource.paginationStates.UserResource.page).toBe(1);
        expect(UserResource.paginationStates.UserResource.perPage).toBe(null);
    });

    it('should increased the page number and query when next() is called', function() {
        spyOn(UserResource, 'query').and.returnValue();

        UserResource.nextPage();

        expect(UserResource.paginationStates.UserResource.page).toBe(2);
        expect(UserResource.query).toHaveBeenCalled();
    });

    it('should decrease the page number and query when prev() is called', function() {
        spyOn(UserResource, 'query').and.returnValue();

        UserResource.prevPage();

        expect(UserResource.paginationStates.UserResource.page).toBe(0);
        expect(UserResource.query).toHaveBeenCalled();
    });

    it('should allow us to set the perPage', function() {
        UserResource.perPage(10);

        expect(UserResource.paginationStates.UserResource.perPage).toBe(10);
    });

    it('should allow us to set the current page', function() {
        UserResource.page(10);

        expect(UserResource.paginationStates.UserResource.page).toBe(10);
    });

    it('should query the resource with current pagination params', function() {
        var deferred = $q.defer();

        spyOn(UserResource.resource, 'query').and.returnValue({ $promise: deferred.promise });

        var params = { param1: 'param1', param2: 'param2' };

        UserResource.query(params);

        expect(UserResource.resource.query).toHaveBeenCalledWith({ param1: 'param1', param2: 'param2', page: 1, perPage: null }, undefined, undefined);
    });

    it('allows us to chain page() and perPage() with query()', function() {
        var deferred = $q.defer();

        spyOn(UserResource.resource, 'query').and.returnValue({ $promise: deferred.promise });

        var params = { param1: 'param1', param2: 'param2' };

        UserResource.page(10).perPage(10).query(params);

        expect(UserResource.resource.query).toHaveBeenCalledWith({ param1: 'param1', param2: 'param2', page: 10, perPage: 10 }, undefined, undefined);
    });

    it('allows multiple calls to nextPage() and sends correct params', function() {
        var deferred = $q.defer();

        spyOn(UserResource.resource, 'query').and.returnValue({ $promise: deferred.promise });

        var params = { param1: 'param1', param2: 'param2' };

        UserResource.nextPage(params);
        expect(UserResource.resource.query).toHaveBeenCalledWith({ param1: 'param1', param2: 'param2', page: 2, perPage: null }, undefined, undefined);

        UserResource.nextPage(params);
        expect(UserResource.resource.query).toHaveBeenCalledWith({ param1: 'param1', param2: 'param2', page: 3, perPage: null }, undefined, undefined);
    });
});
