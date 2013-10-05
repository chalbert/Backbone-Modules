(function() {

//  require(['Model', 'Collection'], function(Model, Collection) {

//  var proxy = Model.extend();
//  var klass = Collection.extend({
//    url : function() { return '/collection'; }
//  });
  var proxy, klass, doc, collection;

  module("Model", {

    setup: function() {
      define('setup', ['Model', 'Collection'], function(Model, Collection) {

        proxy = Model.extend();
        klass = Collection.extend({
          url : function() { return '/collection'; }
        });
        doc = new proxy({
          id     : '1-the-tempest',
          title  : "The Tempest",
          author : "Bill Shakespeare",
          length : 123
        });
        collection = new klass();
        collection.add(doc);

      });
    },
    teardown: function(){
      require.undef('setup');
    }

  });

  asyncTest("initialize", 3, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        initialize: function() {
          this.one = 1;
          equal(this.collection, collection);
        }
      });
      var model = new Model({}, {collection: collection});
      equal(model.one, 1);
      equal(model.collection, collection);

      start();
    });
  });

  asyncTest("initialize with attributes and options", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        initialize: function(attributes, options) {
          this.one = options.one;
        }
      });
      var model = new Model({}, {one: 1});
      equal(model.one, 1);

      start();
    });
  });

  asyncTest("initialize with parsed attributes", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        parse: function(attrs) {
          attrs.value += 1;
          return attrs;
        }
      });
      var model = new Model({value: 1}, {parse: true});
      equal(model.get('value'), 2);

      start();
    });
  });

  asyncTest("initialize with defaults", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        defaults: {
          first_name: 'Unknown',
          last_name: 'Unknown'
        }
      });
      var model = new Model({'first_name': 'John'});
      equal(model.get('first_name'), 'John');
      equal(model.get('last_name'), 'Unknown');

      start();
    });
  });

  asyncTest("parse can return null", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        parse: function(attrs) {
          attrs.value += 1;
          return null;
        }
      });
      var model = new Model({value: 1}, {parse: true});
      equal(JSON.stringify(model.toJSON()), "{}");

      start();
    });
  });

  asyncTest("url", 3, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      doc.urlRoot = null;
      equal(doc.url(), '/collection/1-the-tempest');
      doc.collection.url = '/collection/';
      equal(doc.url(), '/collection/1-the-tempest');
      doc.collection = null;
      raises(function() { doc.url(); });
      doc.collection = collection;

      start();
    });
  });

  asyncTest("url when using urlRoot, and uri encoding", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        urlRoot: '/collection'
      });
      var model = new Model();
      equal(model.url(), '/collection');
      model.set({id: '+1+'});
      equal(model.url(), '/collection/%2B1%2B');

      start();
    });
  });

  asyncTest("url when using urlRoot as a function to determine urlRoot at runtime", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        urlRoot: function() {
          return '/nested/' + this.get('parent_id') + '/collection';
        }
      });

      var model = new Model({parent_id: 1});
      equal(model.url(), '/nested/1/collection');
      model.set({id: 2});
      equal(model.url(), '/nested/1/collection/2');

      start();
    });
  });

  asyncTest("underscore methods", 5, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({ 'foo': 'a', 'bar': 'b', 'baz': 'c' });
      var model2 = model.clone();
      deepEqual(model.keys(), ['foo', 'bar', 'baz']);
      deepEqual(model.values(), ['a', 'b', 'c']);
      deepEqual(model.invert(), { 'a': 'foo', 'b': 'bar', 'c': 'baz' });
      deepEqual(model.pick('foo', 'baz'), {'foo': 'a', 'baz': 'c'});
      deepEqual(model.omit('foo', 'bar'), {'baz': 'c'});

      start();
    });
  });

  asyncTest("clone", 10, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var a = new Model({ 'foo': 1, 'bar': 2, 'baz': 3});
      var b = a.clone();
      equal(a.get('foo'), 1);
      equal(a.get('bar'), 2);
      equal(a.get('baz'), 3);
      equal(b.get('foo'), a.get('foo'), "Foo should be the same on the clone.");
      equal(b.get('bar'), a.get('bar'), "Bar should be the same on the clone.");
      equal(b.get('baz'), a.get('baz'), "Baz should be the same on the clone.");
      a.set({foo : 100});
      equal(a.get('foo'), 100);
      equal(b.get('foo'), 1, "Changing a parent attribute does not change the clone.");

      var foo = new Model({p: 1});
      var bar = new Model({p: 2});
      bar.set(foo.clone().attributes, {unset: true});
      equal(foo.get('p'), 1);
      equal(bar.get('p'), undefined);

      start();
    });
  });

  asyncTest("isNew", 6, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var a = new Model({ 'foo': 1, 'bar': 2, 'baz': 3});
      ok(a.isNew(), "it should be new");
      a = new Model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': -5 });
      ok(!a.isNew(), "any defined ID is legal, negative or positive");
      a = new Model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': 0 });
      ok(!a.isNew(), "any defined ID is legal, including zero");
      ok( new Model({          }).isNew(), "is true when there is no id");
      ok(!new Model({ 'id': 2  }).isNew(), "is false for a positive integer");
      ok(!new Model({ 'id': -5 }).isNew(), "is false for a negative integer");

      start();
    });
  });

  asyncTest("get", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      equal(doc.get('title'), 'The Tempest');
      equal(doc.get('author'), 'Bill Shakespeare');

      start();
    });
  });

  asyncTest("escape", 5, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      equal(doc.escape('title'), 'The Tempest');
      doc.set({audience: 'Bill & Bob'});
      equal(doc.escape('audience'), 'Bill &amp; Bob');
      doc.set({audience: 'Tim > Joan'});
      equal(doc.escape('audience'), 'Tim &gt; Joan');
      doc.set({audience: 10101});
      equal(doc.escape('audience'), '10101');
      doc.unset('audience');
      equal(doc.escape('audience'), '');

      start();
    });
  });

  asyncTest("has", 10, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();

      strictEqual(model.has('name'), false);

      model.set({
        '0': 0,
        '1': 1,
        'true': true,
        'false': false,
        'empty': '',
        'name': 'name',
        'null': null,
        'undefined': undefined
      });

      strictEqual(model.has('0'), true);
      strictEqual(model.has('1'), true);
      strictEqual(model.has('true'), true);
      strictEqual(model.has('false'), true);
      strictEqual(model.has('empty'), true);
      strictEqual(model.has('name'), true);

      model.unset('name');

      strictEqual(model.has('name'), false);
      strictEqual(model.has('null'), false);
      strictEqual(model.has('undefined'), false);

      start();
    });
  });

  asyncTest("set and unset", 8, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var a = new Model({id: 'id', foo: 1, bar: 2, baz: 3});
      var changeCount = 0;
      a.on("change:foo", function() { changeCount += 1; });
      a.set({'foo': 2});
      ok(a.get('foo') == 2, "Foo should have changed.");
      ok(changeCount == 1, "Change count should have incremented.");
      a.set({'foo': 2}); // set with value that is not new shouldn't fire change event
      ok(a.get('foo') == 2, "Foo should NOT have changed, still 2");
      ok(changeCount == 1, "Change count should NOT have incremented.");

      a.validate = function(attrs) {
        equal(attrs.foo, void 0, "validate:true passed while unsetting");
      };
      a.unset('foo', {validate: true});
      equal(a.get('foo'), void 0, "Foo should have changed");
      delete a.validate;
      ok(changeCount == 2, "Change count should have incremented for unset.");

      a.unset('id');
      equal(a.id, undefined, "Unsetting the id should remove the id property.");

      start();
    });
  });

  asyncTest("#2030 - set with failed validate, followed by another set triggers change", function () {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var attr = 0, main = 0, error = 0;
      var Model = Model.extend({
        validate: function (attr) {
          if (attr.x > 1) {
            error++;
            return "this is an error";
          }
        }
      });
      var model = new Model({x:0});
      model.on('change:x', function () { attr++; });
      model.on('change', function () { main++; });
      model.set({x:2}, {validate:true});
      model.set({x:1}, {validate:true});
      deepEqual([attr, main, error], [1, 1, 1]);

      start();
    });
  });

  asyncTest("set triggers changes in the correct order", function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var value = null;
      var model = new Model;
      model.on('last', function(){ value = 'last'; });
      model.on('first', function(){ value = 'first'; });
      model.trigger('first');
      model.trigger('last');
      equal(value, 'last');

      start();
    });
  });

  asyncTest("set falsy values in the correct order", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({result: 'result'});
      model.on('change', function() {
        equal(model.changed.result, void 0);
        equal(model.previous('result'), false);
      });
      model.set({result: void 0}, {silent: true});
      model.set({result: null}, {silent: true});
      model.set({result: false}, {silent: true});
      model.set({result: void 0});

      start();
    });
  });

  asyncTest("multiple unsets", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var i = 0;
      var counter = function(){ i++; };
      var model = new Model({a: 1});
      model.on("change:a", counter);
      model.set({a: 2});
      model.unset('a');
      model.unset('a');
      equal(i, 2, 'Unset does not fire an event for missing attributes.');

      start();
    });
  });

  asyncTest("unset and changedAttributes", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({a: 1});
      model.on('change', function() {
        ok('a' in model.changedAttributes(), 'changedAttributes should contain unset properties');
      });
      model.unset('a');

      start();
    });
  });

  asyncTest("using a non-default id attribute.", 5, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var MongoModel = Model.extend({idAttribute : '_id'});
      var model = new MongoModel({id: 'eye-dee', _id: 25, title: 'Model'});
      equal(model.get('id'), 'eye-dee');
      equal(model.id, 25);
      equal(model.isNew(), false);
      model.unset('_id');
      equal(model.id, undefined);
      equal(model.isNew(), true);

      start();
    });
  });

  asyncTest("set an empty string", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({name : "Model"});
      model.set({name : ''});
      equal(model.get('name'), '');

      start();
    });
  });

  asyncTest("setting an object", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({
        custom: { foo: 1 }
      });
      model.on('change', function() {
        ok(1);
      });
      model.set({
        custom: { foo: 1 } // no change should be fired
      });
      model.set({
        custom: { foo: 2 } // change event should be fired
      });

      start();
    });
  });

  asyncTest("clear", 3, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var changed;
      var model = new Model({id: 1, name : "Model"});
      model.on("change:name", function(){ changed = true; });
      model.on("change", function() {
        var changedAttrs = model.changedAttributes();
        ok('name' in changedAttrs);
      });
      model.clear();
      equal(changed, true);
      equal(model.get('name'), undefined);

      start();
    });
  });

  asyncTest("defaults", 4, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Defaulted = Model.extend({
        defaults: {
          "one": 1,
          "two": 2
        }
      });
      var model = new Defaulted({two: undefined});
      equal(model.get('one'), 1);
      equal(model.get('two'), 2);
      Defaulted = Model.extend({
        defaults: function() {
          return {
            "one": 3,
            "two": 4
          };
        }
      });
      model = new Defaulted({two: undefined});
      equal(model.get('one'), 3);
      equal(model.get('two'), 4);

      start();
    });
  });

  asyncTest("change, hasChanged, changedAttributes, previous, previousAttributes", 9, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({name: "Tim", age: 10});
      deepEqual(model.changedAttributes(), false);
      model.on('change', function() {
        ok(model.hasChanged('name'), 'name changed');
        ok(!model.hasChanged('age'), 'age did not');
        ok(_.isEqual(model.changedAttributes(), {name : 'Rob'}), 'changedAttributes returns the changed attrs');
        equal(model.previous('name'), 'Tim');
        ok(_.isEqual(model.previousAttributes(), {name : "Tim", age : 10}), 'previousAttributes is correct');
      });
      equal(model.hasChanged(), false);
      equal(model.hasChanged(undefined), false);
      model.set({name : 'Rob'});
      equal(model.get('name'), 'Rob');

      start();
    });
  });

  asyncTest("changedAttributes", 3, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({a: 'a', b: 'b'});
      deepEqual(model.changedAttributes(), false);
      equal(model.changedAttributes({a: 'a'}), false);
      equal(model.changedAttributes({a: 'b'}).a, 'b');

      start();
    });
  });

  asyncTest("change with options", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var value;
      var model = new Model({name: 'Rob'});
      model.on('change', function(model, options) {
        value = options.prefix + model.get('name');
      });
      model.set({name: 'Bob'}, {prefix: 'Mr. '});
      equal(value, 'Mr. Bob');
      model.set({name: 'Sue'}, {prefix: 'Ms. '});
      equal(value, 'Ms. Sue');

      start();
    });
  });

  asyncTest("change after initialize", 1, function () {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var changed = 0;
      var attrs = {id: 1, label: 'c'};
      var obj = new Model(attrs);
      obj.on('change', function() { changed += 1; });
      obj.set(attrs);
      equal(changed, 0);

      start();
    });
  });

  asyncTest("save within change event", 1, function () {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({firstName : "Taylor", lastName: "Swift"});
      model.url = '/asyncTest';
      model.on('change', function () {
        model.save();
        ok(_.isEqual(env.syncArgs.model, model));
      });
      model.set({lastName: 'Hicks'});

      start();
    });
  });

  asyncTest("validate after save", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var lastError, model = new Model();
      model.validate = function(attrs) {
        if (attrs.admin) return "Can't change admin status.";
      };
      model.sync = function(method, model, options) {
        options.success.call(this, {admin: true});
      };
      model.on('invalid', function(model, error) {
        lastError = error;
      });
      model.save(null);

      equal(lastError, "Can't change admin status.");
      equal(model.validationError, "Can't change admin status.");

      start();
    });
  });

  asyncTest("save", 2, function() {
    var env = this;
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      doc.save({title : "Henry V"});
      equal(env.syncArgs.method, 'update');
      ok(_.isEqual(env.syncArgs.model, doc));

      start();
    });
  });

  asyncTest("save, fetch, destroy triggers error event when an error occurs", 3, function () {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.on('error', function () {
        ok(true);
      });
      model.sync = function (method, model, options) {
        options.error();
      };
      model.save({data: 2, id: 1});
      model.fetch();
      model.destroy();

      start();
    });
  });

  asyncTest("save with PATCH", function() {
    var env = this;
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      doc.clear().set({id: 1, a: 1, b: 2, c: 3, d: 4});
      doc.save();
      equal(env.syncArgs.method, 'update');
      equal(env.syncArgs.options.attrs, undefined);

      doc.save({b: 2, d: 4}, {patch: true});
      equal(env.syncArgs.method, 'patch');
      equal(_.size(env.syncArgs.options.attrs), 2);
      equal(env.syncArgs.options.attrs.d, 4);
      equal(env.syncArgs.options.attrs.a, undefined);
      equal(env.ajaxSettings.data, "{\"b\":2,\"d\":4}");

      start();
    });
  });

  asyncTest("save in positional style", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.sync = function(method, model, options) {
        options.success();
      };
      model.save('title', 'Twelfth Night');
      equal(model.get('title'), 'Twelfth Night');

      start();
    });
  });

  asyncTest("save with non-object success response", 2, function () {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.sync = function(method, model, options) {
        options.success('', options);
        options.success(null, options);
      };
      model.save({asyncTesting:'empty'}, {
        success: function (model) {
          deepEqual(model.attributes, {asyncTesting:'empty'});
        }
      });

      start();
    });
  });

  asyncTest("fetch", 2, function() {
    var env = this;
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      doc.fetch();
      equal(env.syncArgs.method, 'read');
      ok(_.isEqual(env.syncArgs.model, doc))

      start();
    });
  });

  asyncTest("destroy", 3, function() {
    var env = this;
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      doc.destroy();
      equal(env.syncArgs.method, 'delete');
      ok(_.isEqual(env.syncArgs.model, doc));

      var newModel = new Model;
      equal(newModel.destroy(), false);

      start();
    });
  });

  asyncTest("non-persisted destroy", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var a = new Model({ 'foo': 1, 'bar': 2, 'baz': 3});
      a.sync = function() { throw "should not be called"; };
      a.destroy();
      ok(true, "non-persisted model should not call sync");

      start();
    });
  });

  asyncTest("validate", function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var lastError;
      var model = new Model();
      model.validate = function(attrs) {
        if (attrs.admin != this.get('admin')) return "Can't change admin status.";
      };
      model.on('invalid', function(model, error) {
        lastError = error;
      });
      var result = model.set({a: 100});
      equal(result, model);
      equal(model.get('a'), 100);
      equal(lastError, undefined);
      result = model.set({admin: true});
      equal(model.get('admin'), true);
      result = model.set({a: 200, admin: false}, {validate:true});
      equal(lastError, "Can't change admin status.");
      equal(result, false);
      equal(model.get('a'), 100);

      start();
    });
  });

  asyncTest("validate on unset and clear", 6, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var error;
      var model = new Model({name: "One"});
      model.validate = function(attrs) {
        if (!attrs.name) {
          error = true;
          return "No thanks.";
        }
      };
      model.set({name: "Two"});
      equal(model.get('name'), 'Two');
      equal(error, undefined);
      model.unset('name', {validate: true});
      equal(error, true);
      equal(model.get('name'), 'Two');
      model.clear({validate:true});
      equal(model.get('name'), 'Two');
      delete model.validate;
      model.clear();
      equal(model.get('name'), undefined);

      start();
    });
  });

  asyncTest("validate with error callback", 8, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var lastError, boundError;
      var model = new Model();
      model.validate = function(attrs) {
        if (attrs.admin) return "Can't change admin status.";
      };
      model.on('invalid', function(model, error) {
        boundError = true;
      });
      var result = model.set({a: 100}, {validate:true});
      equal(result, model);
      equal(model.get('a'), 100);
      equal(model.validationError, null);
      equal(boundError, undefined);
      result = model.set({a: 200, admin: true}, {validate:true});
      equal(result, false);
      equal(model.get('a'), 100);
      equal(model.validationError, "Can't change admin status.");
      equal(boundError, true);

      start();
    });
  });

  asyncTest("defaults always extend attrs (#459)", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Defaulted = Model.extend({
        defaults: {one: 1},
        initialize : function(attrs, opts) {
          equal(this.attributes.one, 1);
        }
      });
      var providedattrs = new Defaulted({});
      var emptyattrs = new Defaulted();

      start();
    });
  });

  asyncTest("Inherit class properties", 6, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Parent = Model.extend({
        instancePropSame: function() {},
        instancePropDiff: function() {}
      }, {
        classProp: function() {}
      });
      var Child = Parent.extend({
        instancePropDiff: function() {}
      });

      var adult = new Parent;
      var kid   = new Child;

      equal(Child.classProp, Parent.classProp);
      notEqual(Child.classProp, undefined);

      equal(kid.instancePropSame, adult.instancePropSame);
      notEqual(kid.instancePropSame, undefined);

      notEqual(Child.prototype.instancePropDiff, Parent.prototype.instancePropDiff);
      notEqual(Child.prototype.instancePropDiff, undefined);

      start();
    });
  });

  asyncTest("Nested change events don't clobber previous attributes", 4, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      new Model()
        .on('change:state', function(model, newState) {
          equal(model.previous('state'), undefined);
          equal(newState, 'hello');
          // Fire a nested change event.
          model.set({other: 'whatever'});
        })
        .on('change:state', function(model, newState) {
          equal(model.previous('state'), undefined);
          equal(newState, 'hello');
        })
        .set({state: 'hello'});

      start();
    });
  });

  asyncTest("hasChanged/set should use same comparison", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var changed = 0, model = new Model({a: null});
      model.on('change', function() {
        ok(this.hasChanged('a'));
      })
        .on('change:a', function() {
          changed++;
        })
        .set({a: undefined});
      equal(changed, 1);

      start();
    });
  });

  asyncTest("#582, #425, change:attribute callbacks should fire after all changes have occurred", 9, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model;

      var assertion = function() {
        equal(model.get('a'), 'a');
        equal(model.get('b'), 'b');
        equal(model.get('c'), 'c');
      };

      model.on('change:a', assertion);
      model.on('change:b', assertion);
      model.on('change:c', assertion);

      model.set({a: 'a', b: 'b', c: 'c'});

      start();
    });
  });

  asyncTest("#871, set with attributes property", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.set({attributes: true});
      ok(model.has('attributes'));

      start();
    });
  });

  asyncTest("set value regardless of equality/change", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({x: []});
      var a = [];
      model.set({x: a});
      ok(model.get('x') === a);

      start();
    });
  });

  asyncTest("set same value does not trigger change", 0, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({x: 1});
      model.on('change change:x', function() { ok(false); });
      model.set({x: 1});
      model.set({x: 1});

      start();
    });
  });

  asyncTest("unset does not fire a change for undefined attributes", 0, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({x: undefined});
      model.on('change:x', function(){ ok(false); });
      model.unset('x');

      start();
    });
  });

  asyncTest("set: undefined values", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({x: undefined});
      ok('x' in model.attributes);

      start();
    });
  });

  asyncTest("hasChanged works outside of change events, and true within", 6, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({x: 1});
      model.on('change:x', function() {
        ok(model.hasChanged('x'));
        equal(model.get('x'), 1);
      });
      model.set({x: 2}, {silent: true});
      ok(model.hasChanged());
      equal(model.hasChanged('x'), true);
      model.set({x: 1});
      ok(model.hasChanged());
      equal(model.hasChanged('x'), true);

      start();
    });
  });

  asyncTest("hasChanged gets cleared on the following set", 4, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model;
      model.set({x: 1});
      ok(model.hasChanged());
      model.set({x: 1});
      ok(!model.hasChanged());
      model.set({x: 2});
      ok(model.hasChanged());
      model.set({});
      ok(!model.hasChanged());

      start();
    });
  });

  asyncTest("save with `wait` succeeds without `validate`", 1, function() {
    var env = this;
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.url = '/asyncTest';
      model.save({x: 1}, {wait: true});
      ok(env.syncArgs.model === model);

      start();
    });
  });

  asyncTest("save without `wait` doesn't set invalid attributes", function () {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.validate = function () { return 1; }
      model.save({a: 1});
      equal(model.get('a'), void 0);

      start();
    });
  });

  asyncTest("save doesn't validate twice", function () {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      var times = 0;
      model.sync = function () {};
      model.validate = function () { ++times; }
      model.save({});
      equal(times, 1);

      start();
    });
  });

  asyncTest("`hasChanged` for falsey keys", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.set({x: true}, {silent: true});
      ok(!model.hasChanged(0));
      ok(!model.hasChanged(''));

      start();
    });
  });

  asyncTest("`previous` for falsey keys", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({0: true, '': true});
      model.set({0: false, '': false}, {silent: true});
      equal(model.previous(0), true);
      equal(model.previous(''), true);

      start();
    });
  });

  asyncTest("`save` with `wait` sends correct attributes", 5, function() {
    var env = this;
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var changed = 0;
      var model = new Model({x: 1, y: 2});
      model.url = '/asyncTest';
      model.on('change:x', function() { changed++; });
      model.save({x: 3}, {wait: true});
      deepEqual(JSON.parse(env.ajaxSettings.data), {x: 3, y: 2});
      equal(model.get('x'), 1);
      equal(changed, 0);
      env.syncArgs.options.success({});
      equal(model.get('x'), 3);
      equal(changed, 1);

      start();
    });
  });

  asyncTest("a failed `save` with `wait` doesn't leave attributes behind", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model;
      model.url = '/asyncTest';
      model.save({x: 1}, {wait: true});
      equal(model.get('x'), void 0);

      start();
    });
  });

  asyncTest("#1030 - `save` with `wait` results in correct attributes if success is called during sync", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({x: 1, y: 2});
      model.sync = function(method, model, options) {
        options.success();
      };
      model.on("change:x", function() { ok(true); });
      model.save({x: 3}, {wait: true});
      equal(model.get('x'), 3);

      start();
    });
  });

  asyncTest("save with wait validates attributes", function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.url = '/asyncTest';
      model.validate = function() { ok(true); };
      model.save({x: 1}, {wait: true});

      start();
    });
  });

  asyncTest("save turns on parse flag", function () {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        sync: function(method, model, options) { ok(options.parse); }
      });
      new Model().save();

      start();
    });
  });

  asyncTest("nested `set` during `'change:attr'`", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var events = [];
      var model = new Model();
      model.on('all', function(event) { events.push(event); });
      model.on('change', function() {
        model.set({z: true}, {silent:true});
      });
      model.on('change:x', function() {
        model.set({y: true});
      });
      model.set({x: true});
      deepEqual(events, ['change:y', 'change:x', 'change']);
      events = [];
      model.set({z: true});
      deepEqual(events, []);

      start();
    });
  });

  asyncTest("nested `change` only fires once", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.on('change', function() {
        ok(true);
        model.set({x: true});
      });
      model.set({x: true});

      start();
    });
  });

  asyncTest("nested `set` during `'change'`", 6, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var count = 0;
      var model = new Model();
      model.on('change', function() {
        switch(count++) {
          case 0:
            deepEqual(this.changedAttributes(), {x: true});
            equal(model.previous('x'), undefined);
            model.set({y: true});
            break;
          case 1:
            deepEqual(this.changedAttributes(), {x: true, y: true});
            equal(model.previous('x'), undefined);
            model.set({z: true});
            break;
          case 2:
            deepEqual(this.changedAttributes(), {x: true, y: true, z: true});
            equal(model.previous('y'), undefined);
            break;
          default:
            ok(false);
        }
      });
      model.set({x: true});

      start();
    });
  });

  asyncTest("nested `change` with silent", 3, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var count = 0;
      var model = new Model();
      model.on('change:y', function() { ok(false); });
      model.on('change', function() {
        switch(count++) {
          case 0:
            deepEqual(this.changedAttributes(), {x: true});
            model.set({y: true}, {silent: true});
            model.set({z: true});
            break;
          case 1:
            deepEqual(this.changedAttributes(), {x: true, y: true, z: true});
            break;
          case 2:
            deepEqual(this.changedAttributes(), {z: false});
            break;
          default:
            ok(false);
        }
      });
      model.set({x: true});
      model.set({z: false});

      start();
    });
  });

  asyncTest("nested `change:attr` with silent", 0, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.on('change:y', function(){ ok(false); });
      model.on('change', function() {
        model.set({y: true}, {silent: true});
        model.set({z: true});
      });
      model.set({x: true});

      start();
    });
  });

  asyncTest("multiple nested changes with silent", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.on('change:x', function() {
        model.set({y: 1}, {silent: true});
        model.set({y: 2});
      });
      model.on('change:y', function(model, val) {
        equal(val, 2);
      });
      model.set({x: true});

      start();
    });
  });

  asyncTest("multiple nested changes with silent", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var changes = [];
      var model = new Model();
      model.on('change:b', function(model, val) { changes.push(val); });
      model.on('change', function() {
        model.set({b: 1});
      });
      model.set({b: 0});
      deepEqual(changes, [0, 1]);

      start();
    });
  });

  asyncTest("basic silent change semantics", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model;
      model.set({x: 1});
      model.on('change', function(){ ok(true); });
      model.set({x: 2}, {silent: true});
      model.set({x: 1});

      start();
    });
  });

  asyncTest("nested set multiple times", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.on('change:b', function() {
        ok(true);
      });
      model.on('change:a', function() {
        model.set({b: true});
        model.set({b: true});
      });
      model.set({a: true});

      start();
    });
  });

  asyncTest("#1122 - clear does not alter options.", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      var options = {};
      model.clear(options);
      ok(!options.unset);

      start();
    });
  });

  asyncTest("#1122 - unset does not alter options.", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      var options = {};
      model.unset('x', options);
      ok(!options.unset);

      start();
    });
  });

  asyncTest("#1355 - `options` is passed to success callbacks", 3, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      var opts = {
        success: function( model, resp, options ) {
          ok(options);
        }
      };
      model.sync = function(method, model, options) {
        options.success();
      };
      model.save({id: 1}, opts);
      model.fetch(opts);
      model.destroy(opts);

      start();
    });
  });

  asyncTest("#1412 - Trigger 'sync' event.", 3, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({id: 1});
      model.sync = function (method, model, options) { options.success(); };
      model.on('sync', function(){ ok(true); });
      model.fetch();
      model.save();
      model.destroy();

      start();
    });
  });

  asyncTest("#1365 - Destroy: New models execute success callback.", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      new Model()
        .on('sync', function() { ok(false); })
        .on('destroy', function(){ ok(true); })
        .destroy({ success: function(){ ok(true); }});

      start();
    });
  });

  asyncTest("#1433 - Save: An invalid model cannot be persisted.", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model;
      model.validate = function(){ return 'invalid'; };
      model.sync = function(){ ok(false); };
      strictEqual(model.save(), false);

      start();
    });
  });

  asyncTest("#1377 - Save without attrs triggers 'error'.", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        url: '/asyncTest/',
        sync: function(method, model, options){ options.success(); },
        validate: function(){ return 'invalid'; }
      });
      var model = new Model({id: 1});
      model.on('invalid', function(){ ok(true); });
      model.save();

      start();
    });
  });

  asyncTest("#1545 - `undefined` can be passed to a model constructor without coersion", function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        defaults: { one: 1 },
        initialize : function(attrs, opts) {
          equal(attrs, undefined);
        }
      });
      var emptyattrs = new Model();
      var undefinedattrs = new Model(undefined);

      start();
    });
  });

  asyncTest("#1478 - Model `save` does not trigger change on unchanged attributes", 0, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        sync: function(method, model, options) {
          setTimeout(function(){
            options.success();
            start();
          }, 0);
        }
      });
      new Model({x: true})
        .on('change:x', function(){ ok(false); })
        .save(null, {wait: true});

    });
  });

  asyncTest("#1664 - Changing from one value, silently to another, back to original triggers a change.", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({x:1});
      model.on('change:x', function() { ok(true); });
      model.set({x:2},{silent:true});
      model.set({x:3},{silent:true});
      model.set({x:1});

      start();
    });
  });

  asyncTest("#1664 - multiple silent changes nested inside a change event", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var changes = [];
      var model = new Model();
      model.on('change', function() {
        model.set({a:'c'}, {silent:true});
        model.set({b:2}, {silent:true});
        model.unset('c', {silent:true});
      });
      model.on('change:a change:b change:c', function(model, val) { changes.push(val); });
      model.set({a:'a', b:1, c:'item'});
      deepEqual(changes, ['a',1,'item']);
      deepEqual(model.attributes, {a: 'c', b: 2});

      start();
    });
  });

  asyncTest("#1791 - `attributes` is available for `parse`", function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        parse: function() { this.has('a'); } // shouldn't throw an error
      });
      var model = new Model(null, {parse: true});
      expect(0);

      start();
    });
  });

  asyncTest("silent changes in last `change` event back to original triggers change", 2, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var changes = [];
      var model = new Model();
      model.on('change:a change:b change:c', function(model, val) { changes.push(val); });
      model.on('change', function() {
        model.set({a:'c'}, {silent:true});
      });
      model.set({a:'a'});
      deepEqual(changes, ['a']);
      model.set({a:'a'});
      deepEqual(changes, ['a', 'a']);

      start();
    });
  });

  asyncTest("#1943 change calculations should use _.isEqual", function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({a: {key: 'value'}});
      model.set('a', {key:'value'}, {silent:true});
      equal(model.changedAttributes(), false);

      start();
    });
  });

  asyncTest("#1964 - final `change` event is always fired, regardless of interim changes", 1, function () {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.on('change:property', function() {
        model.set('property', 'bar');
      });
      model.on('change', function() {
        ok(true);
      });
      model.set('property', 'foo');

      start();
    });
  });

  asyncTest("isValid", function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model({valid: true});
      model.validate = function(attrs) {
        if (!attrs.valid) return "invalid";
      };
      equal(model.isValid(), true);
      equal(model.set({valid: false}, {validate:true}), false);
      equal(model.isValid(), true);
      model.set({valid:false});
      equal(model.isValid(), false);
      ok(!model.set('valid', false, {validate: true}));

      start();
    });
  });

  asyncTest("#1179 - isValid returns true in the absence of validate.", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.validate = null;
      ok(model.isValid());

      start();
    });
  });

  asyncTest("#1961 - Creating a model with {validate:true} will call validate and use the error callback", function () {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        validate: function (attrs) {
          if (attrs.id === 1) return "This shouldn't happen";
        }
      });
      var model = new Model({id: 1}, {validate: true});
      equal(model.validationError, "This shouldn't happen");

      start();
    });
  });

  asyncTest("toJSON receives attrs during save(..., {wait: true})", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var Model = Model.extend({
        url: '/asyncTest',
        toJSON: function() {
          strictEqual(this.attributes.x, 1);
          return _.clone(this.attributes);
        }
      });
      var model = new Model;
      model.save({x: 1}, {wait: true});

      start();
    });
  });

  asyncTest("#2034 - nested set with silent only triggers one change", 1, function() {
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      model.on('change', function() {
        model.set({b: true}, {silent: true});
        ok(true);
      });
      model.set({a: true});

      start();
    });
  });

})();
