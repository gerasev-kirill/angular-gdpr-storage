gdpr.storage
=========

[![Build Status](https://travis-ci.org/gerasev-kirill/angular-gdpr-storage.svg)](https://travis-ci.org/gerasev-kirill/angular-gdpr-storage)
[![Dependency Status](https://david-dm.org/gerasev-kirill/angular-gdpr-storage.svg)](https://david-dm.org/gerasev-kirill/angular-gdpr-storage)
[![devDependency Status](https://david-dm.org/gerasev-kirill/angular-gdpr-storage/dev-status.svg)](https://david-dm.org/gerasev-kirill/angular-gdpr-storage#info=devDependencies)

An [AngularJS](https://github.com/angular/angular.js) module that makes Web Storage working in the *Angular Way*. Contains three services: `$gdprStorage`, `$localStorage` and `$sessionStorage`.

### Differences with Other Implementations

* **No Getter 'n' Setter Bullshit** - Right from AngularJS homepage: "Unlike other frameworks, there is no need to [...] wrap the model in accessors methods. Just plain old JavaScript here." Now you can enjoy the same benefit while achieving data persistence with Web Storage.

* **sessionStorage** - We got this often-overlooked buddy covered.

* **Cleanly-Authored Code** - Written in the *Angular Way*, well-structured with testability in mind.

* **No Cookie Fallback** - With Web Storage being [readily available](http://caniuse.com/namevalue-storage) in [all the browsers AngularJS officially supports](http://docs.angularjs.org/misc/faq#canidownloadthesourcebuildandhosttheangularjsenvironmentlocally), such fallback is largely redundant.

Install
=======

### Bower

```bash
bower install https://github.com/gerasev-kirill/angular-gdpr-storage.git
```

### NPM
```bash
npm install https://github.com/gerasev-kirill/angular-gdpr-storage.git
```


Usage
=====

### Require gdpr.storage and Inject the Services

```javascript
angular.module('app', [
    'storage.gdpr'
]).controller('Ctrl', function(
    $scope,
    $gdprStorage,
    $localStorage,
    $sessionStorage
){});
```

### Read and Write | [Demo](http://plnkr.co/edit/3vfRkvG7R9DgQxtWbGHz?p=preview)

Pass `$gdprStorage`, `$localStorage` (or `$sessionStorage`) by reference to a hook under `$scope` in plain ol' JavaScript:

```javascript
$scope.$storage = $gdprStorage;
```

And use it like you-already-know:

```html
<body ng-controller="Ctrl">
    <button ng-click="$storage.counter = $storage.counter + 1">{{$storage.counter}}</button>
</body>
```

> Optionally, specify default values using the `$default()` method:
>
> ```javascript
> $scope.$storage = $localStorage.$default({
>     counter: 42
> });
> ```

With this setup, changes will be automatically sync'd between `$scope.$storage`, `$localStorage`, and localStorage - even across different browser tabs!

### Read and Write Alternative (Not Recommended) | [Demo](http://plnkr.co/edit/9ZmkzRkYzS3iZkG8J5IK?p=preview)

If you're not fond of the presence of `$scope.$storage`, you can always use watchers:

```javascript
$scope.counter = $localStorage.counter || 42;

$scope.$watch('counter', function() {
    $localStorage.counter = $scope.counter;
});

$scope.$watch(function() {
    return angular.toJson($localStorage);
}, function() {
    $scope.counter = $localStorage.counter;
});
```

This, however, is not the way gdpr.storage is designed to be used with. As can be easily seen by comparing the demos, this approach is way more verbose, and may have potential performance implications as the values being watched quickly grow.

### Delete | [Demo](http://plnkr.co/edit/o4w3VGqmp8opfrWzvsJy?p=preview)

Plain ol' JavaScript again, what else could you better expect?

```javascript
// Both will do
delete $scope.$storage.counter;
delete $localStorage.counter;
```

This will delete the corresponding entry inside the Web Storage.

### Delete Everything | [Demo](http://plnkr.co/edit/YiG28KTFdkeFXskolZqs?p=preview)

If you wish to clear the Storage in one go, use the `$reset()` method:

```javascript
$localStorage.$reset();
````

> Optionally, pass in an object you'd like the Storage to reset to:
>
> ```javascript
> $localStorage.$reset({
>     counter: 42
> });
> ```

### Permitted Values | [Demo](http://plnkr.co/edit/n0acYLdhk3AeZmPOGY9Z?p=preview)

You can store anything except those [not supported by JSON](http://www.json.org/js.html):

* `Infinity`, `NaN` - Will be replaced with `null`.
* `undefined`, Function - Will be removed.

### Minification
Just run `$ npm install` to install dependencies.  Then run `$ grunt` for minification.

### Hints

#### Watch the watch

gdpr.storage internally uses an Angular watch to monitor changes to the `$storage`/`$localStorage` objects. That means that a digest cycle is required to persist your new values into the browser local storage.
Normally this is not a problem, but, for example, if you launch a new window after saving a value...

```javascript
$scope.$storage.school = theSchool;
$log.debug("launching " + url);
var myWindow = $window.open("", "_self");
myWindow.document.write(response.data);
```

the new values will not reliably be saved into the browser local storage. Allow a digest cycle to occur by using a zero-value `$timeout` as:

```javascript
$scope.$storage.school = theSchool;
$log.debug("launching and saving the new value" + url);
$timeout(function(){
   var myWindow = $window.open("", "_self");
   myWindow.document.write(response.data);
});
```

And your new values will be persisted correctly.

Todos
=====

* ngdoc Documentation
* Unit Tests

Any contribution will be appreciated.
