# angular-osd-resource

This module provides an easy way to create and decorate angular $resource services from a config file. It also provides provides caching and pagination state decorators. This module was created with the following goals: clean, consistent API resources and easy to use caching and pagination.

### Version
0.1.2

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

All of your resources can be generated from a single configuration file. This is done through the `ResourceConfigProvider`. Here's an example configuration:

```
(function() {

    // @ngInject
    function resourceConfig(ResourceConfigProvider) {
        ResourceConfigProvider
            .global({
                decorators: ['cache', 'paginate'],
                methods: {
                    persist: { method: 'POST', isArray: false },
                }
            })
            .add('Document', '/api/documents/:id', {
                decorators: [ ... ],
                methods: { ... },
                relations: [ ... ],
            })
            .add('Form', '/api/forms/:id')
            .add('User', '/api/users/:id');
    }

    app.config(resourceConfig);
})();
```

In the example above we're defining three resources, Document, Form and User. Each of these resources will make API calls to their specified route.

`ResourceConfigProvider` also allows us to set global configuration on all of our resources. In this example, we're saying that every resource should use the `cache` and `paginate` decorator and every resource should have a `persist` method.

Although the config does allow us to create custom methods, keep in mind that we want our APIs to be as simple as possible. In most cases, it is better to use query params rather than create custom routes.


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
**Note:** Each resource method returns a `$promise`, therefore it needs to be handled using Angular's `$promise` API.

**Note:** If extra methods are provided, they can be called in the same way as the default methods.

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

### Resource Relations

When configuring resources, we can also specify relationships. For example, if a `User` has many `Comments`, we would like to be able to query `/api/v1/users/:id/comments`. To do this, we can specify an array of relations in our resource config file. See above for an example. To query the comments associated with the user of id = 1 , we can do the following:

```
// @ngInject
myApp.controller('UserCtrl', function(User) {

    // User has a Comments relation
    User.comments({ id: 1 })
        .then(function(response) {
            var comments = response;
            // ...
        });
})
```


### Decorators

When generating resources, we can decorate them with common functions. For example, if we want to cache data being queried from the resource, we can use the cacheDecorator. See above for an example of how to include decorators on a resource.

The following decorators are available:
 - cache
 - paginate


### Paginate Decorator

In our configuration file, we can specify that we want our resource to be decorated with a paginator. The paginate decorator manages the pagination state so we don't have to. The following methods are available for paginated resources:

```
/* Extend the params with pagination state and make query */
PaginatedResource.query = function(params) {};

/* Decrement the current page and make paginated query */
PaginatedResource.prevPage = function(params) {};

/* Increment the current page and make paginated query */
PaginatedResource.nextPage = function(params) {};

PaginatedResource.perPage = function(value) {};

PaginatedResource.page = function(value) {};
```


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


