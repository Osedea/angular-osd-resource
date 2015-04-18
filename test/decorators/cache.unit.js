describe('osdResource', function() {
    var cacheDecorator;

    beforeEach(module('osdResource'));

    it('should have access to cacheDecorator', function() {
        expect(cacheDecorator).not.toBe(null);
    });
});