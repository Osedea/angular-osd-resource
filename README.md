[![Build Status](https://travis-ci.org/Osedea/angular-osd-resource.svg?branch=master)](https://travis-ci.org/Osedea/angular-osd-resource)

# angular-osd-resource

This module provides easy form validation in AngularJS. There are three directives included in the module:

  - osd-submit (calls a given function if validation passes)
  - osd-field (adds an error class if field is invalid)
  - osd-error (displays error messages for invalid fields)

### Version
0.1.4

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
                'osdForm',
            ]
    )
```

Include a script tag (or add it to whatever you use to compile your js):
```html
<script src="path/to/bower_components/angular-osd-resource/angular-osd-resource.min.js"></script>
```

### Example

A registration form to be validated using angular-osd-resource:

```html
<form role="form" name="regForm" osd-submit="userCtrl.register()" novalidate>
    <osd-field attr="name">
        <label class="control-label">Name</label>
        <input type="text" class="form-control" name="name"
               ng-model="userCtrl.currentUser.name" required="required">
        <osd-error msg="Name required"></osd-error>
    </osd-field>

    <osd-field attr="email">
        <label class="control-label">Email</label>
        <input type="email" class="form-control" name="email"
               ng-model="userCtrl.currentUser.email" required="required">
        <osd-error msg="Email required"></osd-error>
        <osd-error error-type="email" msg="Email must be valid"></osd-error>
        <osd-error validator="userCtrl.asyncEmailValidator()" msg="Email already taken"></osd-error>
    </osd-field>

    <osd-field attr="password">
        <label class="control-label">Password</label>
        <input type="password" class="form-control" name="password"
               ng-model="userCtrl.currentUser.password" required="required">
        <osd-error msg="Password required"></osd-error>
        <osd-error validator="userCtrl.passwordsMatchValidator()" msg="Passwords do not match"></osd-error>
    </osd-field>

    <osd-field attr="confirmation">
        <label class="control-label">Password Confirmation</label>
        <input type="password" class="form-control" name="confirmation"
               ng-model="userCtrl.currentUser.password_confirmation" required="required">
        <osd-error msg="Password confirmation required"></osd-error>
    </osd-field>

    <button type="submit" class="btn">Continue</button>
</form>
```

### osd-submit
The osd-submit directive validates all fields and calls the given function if the form is valid. Validation only occurs when the form is submitted. A name attribute must be provided along witht the osd-submit directive.

```js
<form role="form" name="regForm" osd-submit="userCtrl.register()" novalidate>
```

If any field is invalid on submission, an event will be broadcasted on $rootScope, passing the Angular FormController:

```js
    $rootScope.$broadcast('osdInvalid', ngFormCtrl);
```

Validation can be forced using the 'osdValidate' event:
```js
    $scope.$broadcast('osdValidate');
```

The form validation status can be reset with the 'osdReset' event:
```js
    $scope.$broadcast('osdReset');
```

### osd-field
Defines the name of the field that will be validated and adds an error class if the field is invalid. There must be a form field with the same name, and an ng-model directive.

```js
<osd-field attr="fieldToValidate">
    <input type="text" name="fieldToValidate" ng-model="fields.fieldToValidate" required="required"/>
</osd-field>
```

### osd-error
Accepts an error type, an error message, and an optional validator function. The error types are the same as those provided by Angular's FormController, with 'required' being the default. See https://docs.angularjs.org/api/ng/type/form.FormController for information on the available error types.

```js
<osd-error error-type="email" msg="Email must be valid"></osd-error>
```

If a validator is given, the error-type is not required:

```js
<osd-error validator="userCtrl.passwordsMatchValidator()" msg="Passwords do not match"></osd-error>
```

### Default validators
The osdError directive comes with several default validators. These can be used in the same way as custom validators:

```js
<osd-error validator="pastDateValidator()" msg="Date must be in the past"></osd-error>
```

In the example above, the validator will check that the field value is in the past.

The following default validators are available:
 - pastDateValidator()
 - futureDateValidator()

### Multi-field validators
The osdError directive comes with several multi-field validators. These can be used to validate based on multiple fields in your form. The osdError directive accepts a built-in validator name and an array of attributes to check. The most common example is checking that the password confirmation field matches the password field:

```js
<osd-error validator="strictMatchValidator()" attrs="['password', 'passwordConfirmation']" msg="Passwords do not match"></osd-error>
```

In the example above, the validator will check that the password and passwordConfirmation fields are strictly equal.

The following multi-field validators are available:
 - strictMatchValidator()
 - strictIncreaseValidator()




### License

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


