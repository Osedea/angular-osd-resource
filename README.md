# angular-osd-resource

This module provides an easy way to create and decorate angular $resource services from a config file. This module was created with two goals: consistent API services and avoiding boilerplate.

### Version
0.0.1

### Installation and Setup

This package can be installed using bower:
```sh
$ bower install angular-osd-resource
```

Add the module to your app's module list:

```js
angular.module(
            'app',
            [
                ...,
                'osdResource',
            ]
    )
```

Include a script tag (or add it to whatever you use to compile your js):
```html
<script src="path/to/bower_components/angular-osd-resource/angular-osd-resource.min.js"></script>
```

### Configuring Resources

All of your resources can be generated from a single configuration file. Here's an example configuration:

```
(function() {

    // @ngInject
    function resourceConfig(ResourceConfigProvider) {
        ResourceConfigProvider.config([
            {
                route: '/api/documents/:id',
                name: 'Document',
            },
            {
                route: '/api/forms/:id',
                name: 'Form',
                decorators: ['cache'],
            },
        ]);
    }

    chaya.config(resourceConfig);
})();
```

In the example above we're defining two resources, Document and Form. Each of these resources will make API calls to their specified route.

### Generated Resources

Generated resources have the following API:
```
return {
    save: function (data) {
        return resource.save(data).$promise;
    },
    update: function (data) {
        return resource.update(data).$promise;
    },
    get: function (params) {
        return resource.get(params).$promise;
    },
    query: function (params) {
        return resource.query(params).$promise;
    },
    delete: function (id) {
        return resource.delete({id: id}).$promise;
    }
};
```

**Note: ** Each resource method returns a `$promise`, therefore it needs to be handled using Angular's `$promise` API.

### How To Use Them

Here's an example of how to use a generated resource in a controller:

```
// @ngInject
myApp.controller('FormCtrl', function(Form) {

    // Form is the generated resource
    Form.query()
        .then(function(response) {
            var forms = response;
            // ...
        });
})
```

### Decorators

When generating resources, we can decorate them with common functions. For example, if we want to cache data being queried from the resource, we can use the cacheDecorator. Other possible decorators could include logging or debugging functions. See above for an example of how to include decorators on a resource.

The following decorator are available:
 - cache


#### License

The MIT License (MIT)

Copyright (c) 2015 damacisaac

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


