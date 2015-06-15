describe('osdResource', function () {
    var ResourceConfig;
    var provider;

    beforeEach(module('osdResource', function (ResourceConfigProvider) {
        provider = ResourceConfigProvider;

        provider
            .global({
                decorators: ['paginate'],
                methods: {
                    persist: {method: 'POST', isArray: false}
                }
            })
            .add('User', '/api/user/:id')
            .add('Document', '/api/documents/:id', {
                decorators: [
                    'cache'
                ],
                methods: {
                    custom: {method: 'GET', isArray:false}
                }
            });
    }));

    beforeEach(inject(function (_ResourceConfig_) {
        ResourceConfig = _ResourceConfig_;
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


});