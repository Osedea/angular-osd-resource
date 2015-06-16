describe('osdResource', function () {
    var ResourceConfig;
    var provider;
    var User;
    var Document;

    beforeEach(module('osdResource', function (ResourceConfigProvider) {
        provider = ResourceConfigProvider;

        provider
            .global({
                decorators: ['cache'],
                methods: {
                    persist: {method: 'POST', isArray: false}
                }
            })
            .add('User', '/api/user/:id')
            .add('Document', '/api/documents/:id', {
                decorators: [
                    'paginate'
                ],
                methods: {
                    custom: {method: 'GET', isArray:false}
                },
                relations: ['comments']
            });
    }));

    beforeEach(inject(function (_ResourceConfig_, _User_, _Document_) {
        ResourceConfig = _ResourceConfig_;
        User = _User_;
        Document = _Document_;
    }));
    
    /**
     * General Config Tests
     */

    it('should have access to ResourceConfig', function () {
        expect(ResourceConfig).not.toBe(null);
    });

    /**
     *  User Resource Config Tests
     */

    it('should create a User config object with name: User', function () {
        expect(ResourceConfig[0].name).toEqual('User');
    });

    it('should create a User config object with method persist', function () {
        expect(ResourceConfig[0].methods).toEqual(jasmine.objectContaining({
            persist: {method: 'POST', isArray:false}
        }));
    });

    it('should create a User config object with 1 decorator', function () {
        expect(ResourceConfig[0].decorators.length).toEqual(1);
    });

    /**
     *  Document Resource Config Tests
     */

    it('should create a Document config object with name: Document', function () {
        expect(ResourceConfig[1].name).toEqual('Document');
    });

    it('should create a Document config object with cache decorator', function () {
        expect(ResourceConfig[1].decorators).toContain('cache');
    });

    it('should create a Document config object with custom method', function () {
        expect(ResourceConfig[1].methods).toEqual(jasmine.objectContaining({
            custom: {method: 'GET', isArray:false}
        }));
    });

    it('should create a Document config object with 2 decorators', function () {
        expect(ResourceConfig[1].decorators.length).toEqual(2);
    });

    /**
     *  User Resource Tests
     */

    it('should create a User resource', function () {
        expect(User).not.toBe(null);
    });

    it('should have a User resource with a resource property that is a function', function () {
        expect(User.resource).toEqual(jasmine.any(Function));
    });

    it('should have a User resource with a save method that returns a resource object', function () {
        expect(User.save().$$state).toEqual(jasmine.any(Object));
    });

    it('should have a User resource with a update method that returns a resource object', function () {
        expect(User.update().$$state).toEqual(jasmine.any(Object));
    });

    it('should have a User resource with a get method that returns a resource object', function () {
        expect(User.get().$$state).toEqual(jasmine.any(Object));
    });

    it('should have a User resource with a query method that returns a resource object', function () {
        expect(User.query().$$state).toEqual(jasmine.any(Object));
    });

    it('should have a User resource with a delete method that returns a resource object', function () {
        expect(User.delete().$$state).toEqual(jasmine.any(Object));
    });

    /**
     *  Document Resource Tests
     */

    it('should create a Document resource', function () {
        expect(Document).not.toBe(null);
    });

    it('should create a Document resource with a custom method', function () {
        expect(Document.custom().$$state).toEqual(jasmine.any(Object));
    });

    it('should create a Document resource with a comments method that returns a resource object', function () {
        expect(Document.comments().$$state).toEqual(jasmine.any(Object));
    });

    it('should create a Document resource that can be paginated', function () {
        expect(Document.prevPage()).toEqual(jasmine.any(Object));
    });
});