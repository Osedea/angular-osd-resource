describe('osdResource', function() {
    var ResourceConfig;

    beforeEach(module('osdResource'));

    beforeEach(inject(function(_ResourceConfig_) {
        ResourceConfig = _ResourceConfig_;
    }));

    it('should have access to ResourceConfig', function() {
        expect(ResourceConfig).not.toBe(null);
    });
});