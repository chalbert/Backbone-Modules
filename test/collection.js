(function() {

  var a, b, c, d, e, col, otherCol;

  module("Collection", {

    setup: function() {
      define('setup', ['Model', 'Collection'], function(Model, Collection) {
        a         = new Model({id: 3, label: 'a'});
        b         = new Model({id: 2, label: 'b'});
        c         = new Model({id: 1, label: 'c'});
        d         = new Model({id: 0, label: 'd'});
        e         = null;
        col       = new Collection([a,b,c,d]);
        otherCol  = new Collection();

      });
    },
    teardown: function(){
      require.undef('setup');
    }

  });

  asyncTest("new and sort", 9, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var counter = 0;
      col.on('sort', function(){ counter++; });
      equal(col.first(), a, "a should be first");
      equal(col.last(), d, "d should be last");
      col.comparator = function(a, b) {
        return a.id > b.id ? -1 : 1;
      };
      col.sort();
      equal(counter, 1);
      equal(col.first(), a, "a should be first");
      equal(col.last(), d, "d should be last");
      col.comparator = function(model) { return model.id; };
      col.sort();
      equal(counter, 2);
      equal(col.first(), d, "d should be first");
      equal(col.last(), a, "a should be last");
      equal(col.length, 4);

      start();
    });
  });

  asyncTest("String comparator.", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection([
        {id: 3},
        {id: 1},
        {id: 2}
      ], {comparator: 'id'});
      deepEqual(collection.pluck('id'), [1, 2, 3]);

      start();
    });
  });

  asyncTest("new and parse", 3, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var Collection = Collection.extend({
        parse : function(data) {
          return _.filter(data, function(datum) {
            return datum.a % 2 === 0;
          });
        }
      });
      var models = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
      var collection = new Collection(models, {parse: true});
      strictEqual(collection.length, 2);
      strictEqual(collection.first().get('a'), 2);
      strictEqual(collection.last().get('a'), 4);

      start();
    });
  });

  asyncTest("get", 6, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      equal(col.get(0), d);
      equal(col.get(d.clone()), d);
      equal(col.get(2), b);
      equal(col.get({id: 1}), c);
      equal(col.get(c.clone()), c);
      equal(col.get(col.first().cid), col.first());

      start();
    });
  });

  asyncTest("get with non-default ids", 5, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var col = new Collection();
      var MongoModel = Model.extend({idAttribute: '_id'});
      var model = new MongoModel({_id: 100});
      col.add(model);
      equal(col.get(100), model);
      equal(col.get(model.cid), model);
      equal(col.get(model), model);
      equal(col.get(101), void 0);

      var col2 = new Collection();
      col2.model = MongoModel;
      col2.add(model.attributes);
      equal(col2.get(model.clone()), col2.first());

      start();
    });
  });

  asyncTest("update index when id changes", 4, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection();
      col.add([
        {id : 0, name : 'one'},
        {id : 1, name : 'two'}
      ]);
      var one = col.get(0);
      equal(one.get('name'), 'one');
      col.on('change:name', function (model) { ok(this.get(model)); });
      one.set({name: 'dalmatians', id : 101});
      equal(col.get(0), null);
      equal(col.get(101).get('name'), 'dalmatians');

      start();
    });
  });

  asyncTest("at", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      equal(col.at(2), c);

      start();
    });
  });

  asyncTest("pluck", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      equal(col.pluck('label').join(' '), 'a b c d');

      start();
    });
  });

  asyncTest("add", 10, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var added, opts, secondAdded;
      added = opts = secondAdded = null;
      e = new Model({id: 10, label : 'e'});
      otherCol.add(e);
      otherCol.on('add', function() {
        secondAdded = true;
      });
      col.on('add', function(model, collection, options){
        added = model.get('label');
        opts = options;
      });
      col.add(e, {amazing: true});
      equal(added, 'e');
      equal(col.length, 5);
      equal(col.last(), e);
      equal(otherCol.length, 1);
      equal(secondAdded, null);
      ok(opts.amazing);

      var f = new Model({id: 20, label : 'f'});
      var g = new Model({id: 21, label : 'g'});
      var h = new Model({id: 22, label : 'h'});
      var atCol = new Collection([f, g, h]);
      equal(atCol.length, 3);
      atCol.add(e, {at: 1});
      equal(atCol.length, 4);
      equal(atCol.at(1), e);
      equal(atCol.last(), h);

      start();
    });
  });

  asyncTest("add multiple models", 6, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection([{at: 0}, {at: 1}, {at: 9}]);
      col.add([{at: 2}, {at: 3}, {at: 4}, {at: 5}, {at: 6}, {at: 7}, {at: 8}], {at: 2});
      for (var i = 0; i <= 5; i++) {
        equal(col.at(i).get('at'), i);
      }

      start();
    });
  });

  asyncTest("add; at should have preference over comparator", 1, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var Col = Collection.extend({
        comparator: function(a,b) {
          return a.id > b.id ? -1 : 1;
        }
      });

      var col = new Col([{id: 2}, {id: 3}]);
      col.add(new Model({id: 1}), {at:   1});

      equal(col.pluck('id').join(' '), '3 1 2');

      start();
    });
  });

  asyncTest("can't add model to collection twice", function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection([{id: 1}, {id: 2}, {id: 1}, {id: 2}, {id: 3}]);
      equal(col.pluck('id').join(' '), '1 2 3');

      start();
    });
  });

  asyncTest("can't add different model with same id to collection twice", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection;
      col.unshift({id: 101});
      col.add({id: 101});
      equal(col.length, 1);

      start();
    });
  });

  asyncTest("merge in duplicate models with {merge: true}", 3, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection;
      col.add([{id: 1, name: 'Moe'}, {id: 2, name: 'Curly'}, {id: 3, name: 'Larry'}]);
      col.add({id: 1, name: 'Moses'});
      equal(col.first().get('name'), 'Moe');
      col.add({id: 1, name: 'Moses'}, {merge: true});
      equal(col.first().get('name'), 'Moses');
      col.add({id: 1, name: 'Tim'}, {merge: true, silent: true});
      equal(col.first().get('name'), 'Tim');

      start();
    });
  });

  asyncTest("add model to multiple collections", 10, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var counter = 0;
      var e = new Model({id: 10, label : 'e'});
      e.on('add', function(model, collection) {
        counter++;
        equal(e, model);
        if (counter > 1) {
          equal(collection, colF);
        } else {
          equal(collection, colE);
        }
      });
      var colE = new Collection([]);
      colE.on('add', function(model, collection) {
        equal(e, model);
        equal(colE, collection);
      });
      var colF = new Collection([]);
      colF.on('add', function(model, collection) {
        equal(e, model);
        equal(colF, collection);
      });
      colE.add(e);
      equal(e.collection, colE);
      colF.add(e);
      equal(e.collection, colE);

      start();
    });
  });

  asyncTest("add model with parse", 1, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var Model = Model.extend({
        parse: function(obj) {
          obj.value += 1;
          return obj;
        }
      });

      var Col = Collection.extend({model: Model});
      var col = new Col;
      col.add({value: 1}, {parse: true});
      equal(col.at(0).get('value'), 2);

      start();
    });
  });

  asyncTest("add with parse and merge", function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection();
      collection.parse = function(attrs) {
        return _.map(attrs, function(model) {
          if (model.model) return model.model;
          return model;
        });
      };
      collection.add({id: 1});
      collection.add({model: {id: 1, name: 'Alf'}}, {parse: true, merge: true});
      equal(collection.first().get('name'), 'Alf');

      start();
    });
  });

  asyncTest("add model to collection with sort()-style comparator", 3, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var col = new Collection;
      col.comparator = function(a, b) {
        return a.get('name') < b.get('name') ? -1 : 1;
      };
      var tom = new Model({name: 'Tom'});
      var rob = new Model({name: 'Rob'});
      var tim = new Model({name: 'Tim'});
      col.add(tom);
      col.add(rob);
      col.add(tim);
      equal(col.indexOf(rob), 0);
      equal(col.indexOf(tim), 1);
      equal(col.indexOf(tom), 2);

      start();
    });
  });

  asyncTest("comparator that depends on `this`", 2, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection;
      col.negative = function(num) {
        return -num;
      };
      col.comparator = function(a) {
        return this.negative(a.id);
      };
      col.add([{id: 1}, {id: 2}, {id: 3}]);
      deepEqual(col.pluck('id'), [3, 2, 1]);
      col.comparator = function(a, b) {
        return this.negative(b.id) - this.negative(a.id);
      };
      col.sort();
      deepEqual(col.pluck('id'), [1, 2, 3]);

      start();
    });
  });

  asyncTest("remove", 5, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var removed = null;
      var otherRemoved = null;
      col.on('remove', function(model, col, options) {
        removed = model.get('label');
        equal(options.index, 3);
      });
      otherCol.on('remove', function(model, col, options) {
        otherRemoved = true;
      });
      col.remove(d);
      equal(removed, 'd');
      equal(col.length, 3);
      equal(col.first(), a);
      equal(otherRemoved, null);

      start();
    });
  });

  asyncTest("shift and pop", 2, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection([{a: 'a'}, {b: 'b'}, {c: 'c'}]);
      equal(col.shift().get('a'), 'a');
      equal(col.pop().get('c'), 'c');

      start();
    });
  });

  asyncTest("slice", 2, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection([{a: 'a'}, {b: 'b'}, {c: 'c'}]);
      var array = col.slice(1, 3);
      equal(array.length, 2);
      equal(array[0].get('b'), 'b');

      start();
    });
  });

  asyncTest("events are unbound on remove", 3, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var counter = 0;
      var dj = new Model();
      var emcees = new Collection([dj]);
      emcees.on('change', function(){ counter++; });
      dj.set({name : 'Kool'});
      equal(counter, 1);
      emcees.reset([]);
      equal(dj.collection, undefined);
      dj.set({name : 'Shadow'});
      equal(counter, 1);

      start();
    });
  });

  asyncTest("remove in multiple collections", 7, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var modelData = {
        id : 5,
        title : 'Othello'
      };
      var passed = false;
      var e = new Model(modelData);
      var f = new Model(modelData);
      f.on('remove', function() {
        passed = true;
      });
      var colE = new Collection([e]);
      var colF = new Collection([f]);
      ok(e != f);
      ok(colE.length === 1);
      ok(colF.length === 1);
      colE.remove(e);
      equal(passed, false);
      ok(colE.length === 0);
      colF.remove(e);
      ok(colF.length === 0);
      equal(passed, true);

      start();
    });
  });

  asyncTest("remove same model in multiple collection", 16, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var counter = 0;
      var e = new Model({id: 5, title: 'Othello'});
      e.on('remove', function(model, collection) {
        counter++;
        equal(e, model);
        if (counter > 1) {
          equal(collection, colE);
        } else {
          equal(collection, colF);
        }
      });
      var colE = new Collection([e]);
      colE.on('remove', function(model, collection) {
        equal(e, model);
        equal(colE, collection);
      });
      var colF = new Collection([e]);
      colF.on('remove', function(model, collection) {
        equal(e, model);
        equal(colF, collection);
      });
      equal(colE, e.collection);
      colF.remove(e);
      ok(colF.length === 0);
      ok(colE.length === 1);
      equal(counter, 1);
      equal(colE, e.collection);
      colE.remove(e);
      equal(null, e.collection);
      ok(colE.length === 0);
      equal(counter, 2);

      start();
    });
  });

  asyncTest("model destroy removes from all collections", 3, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var e = new Model({id: 5, title: 'Othello'});
      e.sync = function(method, model, options) { options.success(); };
      var colE = new Collection([e]);
      var colF = new Collection([e]);
      e.destroy();
      ok(colE.length === 0);
      ok(colF.length === 0);
      equal(undefined, e.collection);

      start();
    });
  });

  asyncTest("Colllection: non-persisted model destroy removes from all collections", 3, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var e = new Model({title: 'Othello'});
      e.sync = function(method, model, options) { throw "should not be called"; };
      var colE = new Collection([e]);
      var colF = new Collection([e]);
      e.destroy();
      ok(colE.length === 0);
      ok(colF.length === 0);
      equal(undefined, e.collection);

      start();
    });
  });

  asyncTest("fetch", 4, function() {
    var env = this;

    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection;
      collection.url = '/asyncTest';
      collection.fetch();
      equal(env.syncArgs.method, 'read');
      equal(env.syncArgs.model, collection);
      equal(env.syncArgs.options.parse, true);

      collection.fetch({parse: false});
      equal(env.syncArgs.options.parse, false);

      start();
    });
  });

  asyncTest("fetch with an error response triggers an error event", 1, function () {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection();
      collection.on('error', function () {
        ok(true);
      });
      collection.sync = function (method, model, options) { options.error(); };
      collection.fetch();

      start();
    });
  });

  asyncTest("ensure fetch only parses once", 1, function() {
    var env = this;

    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection;
      var counter = 0;
      collection.parse = function(models) {
        counter++;
        return models;
      };
      collection.url = '/asyncTest';
      collection.fetch();
      env.syncArgs.options.success();
      equal(counter, 1);

      start();
    });
  });

  asyncTest("create", 4, function() {
    var env = this;
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection;
      collection.url = '/asyncTest';
      var model = collection.create({label: 'f'}, {wait: true});
      equal(env.syncArgs.method, 'create');
      equal(env.syncArgs.model, model);
      equal(model.get('label'), 'f');
      equal(model.collection, collection);

      start();
    });
  });

  asyncTest("create with validate:true enforces validation", 3, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var ValidatingModel = Model.extend({
        validate: function(attrs) {
          return "fail";
        }
      });
      var ValidatingCollection = Collection.extend({
        model: ValidatingModel
      });
      var col = new ValidatingCollection();
      col.on('invalid', function (collection, error, options) {
        equal(error, "fail");
        equal(options.validationError, 'fail');
      });
      equal(col.create({"foo":"bar"}, {validate:true}), false);

      start();
    });
  });

  asyncTest("a failing create returns model with errors", function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var ValidatingModel = Model.extend({
        validate: function(attrs) {
          return "fail";
        }
      });
      var ValidatingCollection = Collection.extend({
        model: ValidatingModel
      });
      var col = new ValidatingCollection();
      var m = col.create({"foo":"bar"});
      equal(m.validationError, 'fail');
      equal(col.length, 1);

      start();
    });
  });

  asyncTest("initialize", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var Collection = Collection.extend({
        initialize: function() {
          this.one = 1;
        }
      });
      var coll = new Collection;
      equal(coll.one, 1);

      start();
    });
  });

  asyncTest("toJSON", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      equal(JSON.stringify(col), '[{"id":3,"label":"a"},{"id":2,"label":"b"},{"id":1,"label":"c"},{"id":0,"label":"d"}]');

      start();
    });
  });

  asyncTest("where and findWhere", 8, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var model = new Model({a: 1});
      var coll = new Collection([
        model,
        {a: 1},
        {a: 1, b: 2},
        {a: 2, b: 2},
        {a: 3}
      ]);
      equal(coll.where({a: 1}).length, 3);
      equal(coll.where({a: 2}).length, 1);
      equal(coll.where({a: 3}).length, 1);
      equal(coll.where({b: 1}).length, 0);
      equal(coll.where({b: 2}).length, 2);
      equal(coll.where({a: 1, b: 2}).length, 1);
      equal(coll.findWhere({a: 1}), model);
      equal(coll.findWhere({a: 4}), void 0);

      start();
    });
  });

  asyncTest("Underscore methods", 14, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      equal(col.map(function(model){ return model.get('label'); }).join(' '), 'a b c d');
      equal(col.any(function(model){ return model.id === 100; }), false);
      equal(col.any(function(model){ return model.id === 0; }), true);
      equal(col.indexOf(b), 1);
      equal(col.size(), 4);
      equal(col.rest().length, 3);
      ok(!_.include(col.rest(), a));
      ok(_.include(col.rest(), d));
      ok(!col.isEmpty());
      ok(!_.include(col.without(d), d));
      equal(col.max(function(model){ return model.id; }).id, 3);
      equal(col.min(function(model){ return model.id; }).id, 0);
      deepEqual(col.chain()
        .filter(function(o){ return o.id % 2 === 0; })
        .map(function(o){ return o.id * 2; })
        .value(),
        [4, 0]);
      deepEqual(col.difference([c, d]), [a, b]);

      start();
    });
  });

  asyncTest("reset", 12, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var resetCount = 0;
      var models = col.models;
      col.on('reset', function() { resetCount += 1; });
      col.reset([]);
      equal(resetCount, 1);
      equal(col.length, 0);
      equal(col.last(), null);
      col.reset(models);
      equal(resetCount, 2);
      equal(col.length, 4);
      equal(col.last(), d);
      col.reset(_.map(models, function(m){ return m.attributes; }));
      equal(resetCount, 3);
      equal(col.length, 4);
      ok(col.last() !== d);
      ok(_.isEqual(col.last().attributes, d.attributes));
      col.reset();
      equal(col.length, 0);
      equal(resetCount, 4);

      start();
    });
  });

  asyncTest ("reset with different values", function(){
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection({id: 1});
      col.reset({id: 1, a: 1});
      equal(col.get(1).get('a'), 1);

      start();
    });
  });

  asyncTest("same references in reset", function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var model = new Model({id: 1});
      var collection = new Collection({id: 1});
      collection.reset(model);
      equal(collection.get(1), model);

      start();
    });
  });

  asyncTest("reset passes caller options", 3, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var Model = Model.extend({
        initialize: function(attrs, options) {
          this.model_parameter = options.model_parameter;
        }
      });
      var col = new (Collection.extend({ model: Model }))();
      col.reset([{ astring: "green", anumber: 1 }, { astring: "blue", anumber: 2 }], { model_parameter: 'model parameter' });
      equal(col.length, 2);
      col.each(function(model) {
        equal(model.model_parameter, 'model parameter');
      });

      start();
    });
  });

  asyncTest("trigger custom events on models", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var fired = null;
      a.on("custom", function() { fired = true; });
      a.trigger("custom");
      equal(fired, true);

      start();
    });
  });

  asyncTest("add does not alter arguments", 2, function(){
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var attrs = {};
      var models = [attrs];
      new Collection().add(models);
      equal(models.length, 1);
      ok(attrs === models[0]);

      start();
    });
  });

  asyncTest("#714: access `model.collection` in a brand new model.", 2, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var collection = new Collection;
      collection.url = '/asyncTest';
      var Model = Model.extend({
        set: function(attrs) {
          equal(attrs.prop, 'value');
          equal(this.collection, collection);
          return this;
        }
      });
      collection.model = Model;
      collection.create({prop: 'value'});

      start();
    });
  });

  asyncTest("#574, remove its own reference to the .models array.", 2, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var col = new Collection([
        {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}
      ]);
      equal(col.length, 6);
      col.remove(col.models);
      equal(col.length, 0);

      start();
    });
  });

  asyncTest("#861, adding models to a collection which do not pass validation, with validate:true", function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var Model = Model.extend({
        validate: function(attrs) {
          if (attrs.id == 3) return "id can't be 3";
        }
      });

      var Collection = Collection.extend({
        model: Model
      });

      var collection = new Collection;
      collection.on("error", function() { ok(true); });

      collection.add([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}], {validate:true});
      deepEqual(collection.pluck('id'), [1, 2, 4, 5, 6]);

      start();
    });
  });

  asyncTest("Invalid models are discarded with validate:true.", 5, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var collection = new Collection;
      collection.on('asyncTest', function() { ok(true); });
      collection.model = Model.extend({
        validate: function(attrs){ if (!attrs.valid) return 'invalid'; }
      });
      var model = new collection.model({id: 1, valid: true});
      collection.add([model, {id: 2}], {validate:true});
      model.trigger('asyncTest');
      ok(collection.get(model.cid));
      ok(collection.get(1));
      ok(!collection.get(2));
      equal(collection.length, 1);

      start();
    });
  });

  asyncTest("multiple copies of the same model", 3, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var col = new Collection();
      var model = new Model();
      col.add([model, model]);
      equal(col.length, 1);
      col.add([{id: 1}, {id: 1}]);
      equal(col.length, 2);
      equal(col.last().id, 1);

      start();
    });
  });

  asyncTest("#964 - collection.get return inconsistent", 2, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var c = new Collection();
      ok(c.get(null) === undefined);
      ok(c.get() === undefined);

      start();
    });
  });

  asyncTest("#1112 - passing options.model sets collection.model", 2, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var Model = Model.extend({});
      var c = new Collection([{id: 1}], {model: Model});
      ok(c.model === Model);
      ok(c.at(0) instanceof Model);

      start();
    });
  });

  asyncTest("null and undefined are invalid ids.", 2, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var model = new Model({id: 1});
      var collection = new Collection([model]);
      model.set({id: null});
      ok(!collection.get('null'));
      model.set({id: 1});
      model.set({id: undefined});
      ok(!collection.get('undefined'));

      start();
    });
  });

  asyncTest("falsy comparator", 4, function(){
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var Col = Collection.extend({
        comparator: function(model){ return model.id; }
      });
      var col = new Col();
      var colFalse = new Col(null, {comparator: false});
      var colNull = new Col(null, {comparator: null});
      var colUndefined = new Col(null, {comparator: undefined});
      ok(col.comparator);
      ok(!colFalse.comparator);
      ok(!colNull.comparator);
      ok(colUndefined.comparator);

      start();
    });
  });

  asyncTest("#1355 - `options` is passed to success callbacks", 2, function(){
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var m = new Model({x:1});
      var col = new Collection();
      var opts = {
        success: function(collection, resp, options){
          ok(options);
        }
      };
      col.sync = m.sync = function( method, collection, options ){
        options.success(collection, [], options);
      };
      col.fetch(opts);
      col.create(m, opts);

      start();
    });
  });

  asyncTest("#1412 - Trigger 'request' and 'sync' events.", 4, function() {

    // Override ajax
    require.config({
      map: {
        'helpers/sync': {
          'helpers/ajax': 'newajax'
        }
      }
    });

    define('newajax', ['helpers/ajax'], function(){
      return function(settings){ settings.success(); }
    });

    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection;
      collection.url = '/asyncTest';

      collection.on('request', function(obj, xhr, options) {
        ok(obj === collection, "collection has correct 'request' event after fetching");
      });
      collection.on('sync', function(obj, response, options) {
        ok(obj === collection, "collection has correct 'sync' event after fetching");
      });
      collection.fetch();
      collection.off();

      collection.on('request', function(obj, xhr, options) {
        ok(obj === collection.get(1), "collection has correct 'request' event after one of its models save");
      });
      collection.on('sync', function(obj, response, options) {
        ok(obj === collection.get(1), "collection has correct 'sync' event after one of its models save");
      });
      collection.create({id: 1});
      collection.off();

      start();
      require.undef('newajax');
    });
  });

  asyncTest("#1447 - create with wait adds model.", 1, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var collection = new Collection;
      var model = new Model;
      model.sync = function(method, model, options){ options.success(); };
      collection.on('add', function(){ ok(true); });
      collection.create(model, {wait: true});

      start();
    });
  });

  asyncTest("#1448 - add sorts collection after merge.", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection([
        {id: 1, x: 1},
        {id: 2, x: 2}
      ]);
      collection.comparator = function(model){ return model.get('x'); };
      collection.add({id: 1, x: 3}, {merge: true});
      deepEqual(collection.pluck('id'), [2, 1]);

      start();
    });
  });

  asyncTest("#1655 - groupBy can be used with a string argument.", 3, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection([{x: 1}, {x: 2}]);
      var grouped = collection.groupBy('x');
      strictEqual(_.keys(grouped).length, 2);
      strictEqual(grouped[1][0].get('x'), 1);
      strictEqual(grouped[2][0].get('x'), 2);

      start();
    });
  });

  asyncTest("#1655 - sortBy can be used with a string argument.", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection([{x: 3}, {x: 1}, {x: 2}]);
      var values = _.map(collection.sortBy('x'), function(model) {
        return model.get('x');
      });
      deepEqual(values, [1, 2, 3]);

      start();
    });
  });

  asyncTest("#1604 - Removal during iteration.", 0, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection([{}, {}]);
      collection.on('add', function() {
        collection.at(0).destroy();
      });
      collection.add({}, {at: 0});

      start();
    });
  });

  asyncTest("#1638 - `sort` during `add` triggers correctly.", function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection;
      collection.comparator = function(model) { return model.get('x'); };
      var added = [];
      collection.on('add', function(model) {
        model.set({x: 3});
        collection.sort();
        added.push(model.id);
      });
      collection.add([{id: 1, x: 1}, {id: 2, x: 2}]);
      deepEqual(added, [1, 2]);

      start();
    });
  });

  asyncTest("fetch parses models by default", 1, function() {
    var env = this;
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var model = {};
      var Collection = Collection.extend({
        url: 'asyncTest',
        model: Model.extend({
          parse: function(resp) {
            strictEqual(resp, model);
          }
        })
      });
      new Collection().fetch();
      env.ajaxSettings.success([model]);

      start();
    });
  });

  asyncTest("`sort` shouldn't always fire on `add`", 1, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var c = new Collection([{id: 1}, {id: 2}, {id: 3}], {
        comparator: 'id'
      });
      c.sort = function(){ ok(true); };
      c.add([]);
      c.add({id: 1});
      c.add([{id: 2}, {id: 3}]);
      c.add({id: 4});

      start();
    });
  });

  asyncTest("#1407 parse option on constructor parses collection and models", 2, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var model = {
        namespace : [{id: 1}, {id:2}]
      };
      var Collection = Collection.extend({
        model: Model.extend({
          parse: function(model) {
            model.name = 'asyncTest';
            return model;
          }
        }),
        parse: function(model) {
          return model.namespace;
        }
      });
      var c = new Collection(model, {parse:true});

      equal(c.length, 2);
      equal(c.at(0).get('name'), 'asyncTest');

      start();
    });
  });

  asyncTest("#1407 parse option on reset parses collection and models", 2, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var model = {
        namespace : [{id: 1}, {id:2}]
      };
      var Collection = Collection.extend({
        model: Model.extend({
          parse: function(model) {
            model.name = 'asyncTest';
            return model;
          }
        }),
        parse: function(model) {
          return model.namespace;
        }
      });
      var c = new Collection();
      c.reset(model, {parse:true});

      equal(c.length, 2);
      equal(c.at(0).get('name'), 'asyncTest');

      start();
    });
  });


  asyncTest("Reset includes previous models in triggered event.", 1, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var model = new Model();
      var collection = new Collection([model])
        .on('reset', function(collection, options) {
          deepEqual(options.previousModels, [model]);
        });
      collection.reset([]);

      start();
    });
  });

  asyncTest("set", function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var m1 = new Model();
      var m2 = new Model({id: 2});
      var m3 = new Model();
      var c = new Collection([m1, m2]);

      // asyncTest add/change/remove events
      c.on('add', function(model) {
        strictEqual(model, m3);
      });
      c.on('change', function(model) {
        strictEqual(model, m2);
      });
      c.on('remove', function(model) {
        strictEqual(model, m1);
      });

      // remove: false doesn't remove any models
      c.set([], {remove: false});
      strictEqual(c.length, 2);

      // add: false doesn't add any models
      c.set([m1, m2, m3], {add: false});
      strictEqual(c.length, 2);

      // merge: false doesn't change any models
      c.set([m1, {id: 2, a: 1}], {merge: false});
      strictEqual(m2.get('a'), void 0);

      // add: false, remove: false only merges existing models
      c.set([m1, {id: 2, a: 0}, m3, {id: 4}], {add: false, remove: false});
      strictEqual(c.length, 2);
      strictEqual(m2.get('a'), 0);

      // default options add/remove/merge as appropriate
      c.set([{id: 2, a: 1}, m3]);
      strictEqual(c.length, 2);
      strictEqual(m2.get('a'), 1);

      // asyncTest removing models not passing an argument
      c.off('remove').on('remove', function(model) {
        ok(model === m2 || model === m3);
      });
      c.set([]);
      strictEqual(c.length, 0);

      start();
    });
  });

  asyncTest("set with many models does not overflow the stack", function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var n = 150000;
      var collection = new Collection();
      var models = [];
      for (var i = 0; i < n; i++) {
        models.push({id: i});
      }
      collection.set(models);
      equal(collection.length, n);
      collection.reset().set(models, {at: 0});
      equal(collection.length, n);

      start();
    });
  });

  asyncTest("set with only cids", 3, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var m1 = new Model;
      var m2 = new Model;
      var c = new Collection;
      c.set([m1, m2]);
      equal(c.length, 2);
      c.set([m1]);
      equal(c.length, 1);
      c.set([m1, m1, m1, m2, m2], {remove: false});
      equal(c.length, 2);

      start();
    });
  });

  asyncTest("set with only idAttribute", 3, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var m1 = { _id: 1 };
      var m2 = { _id: 2 };
      var col = Collection.extend({
        model: Model.extend({
          idAttribute: '_id'
        })
      });
      var c = new col;
      c.set([m1, m2]);
      equal(c.length, 2);
      c.set([m1]);
      equal(c.length, 1);
      c.set([m1, m1, m1, m2, m2], {remove: false});
      equal(c.length, 2);

      start();
    });
  });

  asyncTest("set + merge with default values defined", function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var Model = Model.extend({
        defaults: {
          key: 'value'
        }
      });
      var m = new Model({id: 1});
      var col = new Collection([m], {model: Model});
      equal(col.first().get('key'), 'value');

      col.set({id: 1, key: 'other'});
      equal(col.first().get('key'), 'other');

      col.set({id: 1, other: 'value'});
      equal(col.first().get('key'), 'other');
      equal(col.length, 1);

      start();
    });
  });

  asyncTest('merge without mutation', function () {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var Model = Model.extend({
        initialize: function (attrs, options) {
          if (attrs.child) {
            this.set('child', new Model(attrs.child, options), options);
          }
        }
      });
      var Collection = Collection.extend({model: Model});
      var data = [{id: 1, child: {id: 2}}];
      var collection = new Collection(data);
      equal(collection.first().id, 1);
      collection.set(data);
      equal(collection.first().id, 1);
      collection.set([{id: 2, child: {id: 2}}].concat(data));
      deepEqual(collection.pluck('id'), [2, 1]);

      start();
    });
  });

  asyncTest("`set` and model level `parse`", function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var Model = Model.extend({});
      var Collection = Collection.extend({
        model: Model,
        parse: function (res) { return _.pluck(res.models, 'model'); }
      });
      var model = new Model({id: 1});
      var collection = new Collection(model);
      collection.set({models: [
        {model: {id: 1}},
        {model: {id: 2}}
      ]}, {parse: true});
      equal(collection.first(), model);

      start();
    });
  });

  asyncTest("`set` data is only parsed once", function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var collection = new Collection();
      collection.model = Model.extend({
        parse: function (data) {
          equal(data.parsed, void 0);
          data.parsed = true;
          return data;
        }
      });
      collection.set({}, {parse: true});

      start();
    });
  });

  asyncTest('`set` matches input order in the absence of a comparator', function () {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var one = new Model({id: 1});
      var two = new Model({id: 2});
      var three = new Model({id: 3});
      var collection = new Collection([one, two, three]);
      collection.set([{id: 3}, {id: 2}, {id: 1}]);
      deepEqual(collection.models, [three, two, one]);
      collection.set([{id: 1}, {id: 2}]);
      deepEqual(collection.models, [one, two]);
      collection.set([two, three, one]);
      deepEqual(collection.models, [two, three, one]);
      collection.set([{id: 1}, {id: 2}], {remove: false});
      deepEqual(collection.models, [two, three, one]);
      collection.set([{id: 1}, {id: 2}, {id: 3}], {merge: false});
      deepEqual(collection.models, [one, two, three]);
      collection.set([three, two, one, {id: 4}], {add: false});
      deepEqual(collection.models, [one, two, three]);

      start();
    });
  });

  asyncTest("#1894 - Push should not trigger a sort", 0, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var Collection = Collection.extend({
        comparator: 'id',
        sort: function() {
          ok(false);
        }
      });
      new Collection().push({id: 1});

      start();
    });
  });

  asyncTest("`set` with non-normal id", function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var Collection = Collection.extend({
        model: Model.extend({idAttribute: '_id'})
      });
      var collection = new Collection({_id: 1});
      collection.set([{_id: 1, a: 1}], {add: false});
      equal(collection.first().get('a'), 1);

      start();
    });
  });

  asyncTest("#1894 - `sort` can optionally be turned off", 0, function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var Collection = Collection.extend({
        comparator: 'id',
        sort: function() { ok(true); }
      });
      new Collection().add({id: 1}, {sort: false});

      start();
    });
  });

  asyncTest("#1915 - `parse` data in the right order in `set`", function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new (Collection.extend({
        parse: function (data) {
          strictEqual(data.status, 'ok');
          return data.data;
        }
      }));
      var res = {status: 'ok', data:[{id: 1}]};
      collection.set(res, {parse: true});

      start();
    });
  });

  asyncTest("#1939 - `parse` is passed `options`", 1, function () {
    // Override ajax
    require.config({
      map: {
        'helpers/sync': {
          'helpers/ajax': 'newajax'
        }
      }
    });

    define('newajax', ['helpers/ajax'], function(){
      return function (params) {
        _.defer(params.success);
        return {someHeader: 'headerValue'};
      };
    });

    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new (Collection.extend({
        url: '/',
        parse: function (data, options) {
          strictEqual(options.xhr.someHeader, 'headerValue');
          return data;
        }
      }));
      collection.fetch({
        success: function () { start(); }
      });

      require.undef('newajax');
    });
  });

  asyncTest("`add` only `sort`s when necessary", 2, function () {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new (Collection.extend({
        comparator: 'a'
      }))([{id: 1}, {id: 2}, {id: 3}]);
      collection.on('sort', function () { ok(true); });
      collection.add({id: 4}); // do sort, new model
      collection.add({id: 1, a: 1}, {merge: true}); // do sort, comparator change
      collection.add({id: 1, b: 1}, {merge: true}); // don't sort, no comparator change
      collection.add({id: 1, a: 1}, {merge: true}); // don't sort, no comparator change
      collection.add(collection.models); // don't sort, nothing new
      collection.add(collection.models, {merge: true}); // don't sort

      start();
    });
  });

  asyncTest("`add` only `sort`s when necessary with comparator function", 3, function () {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new (Collection.extend({
        comparator: function(a, b) {
          return a.get('a') > b.get('a') ? 1 : (a.get('a') < b.get('a') ? -1 : 0);
        }
      }))([{id: 1}, {id: 2}, {id: 3}]);
      collection.on('sort', function () { ok(true); });
      collection.add({id: 4}); // do sort, new model
      collection.add({id: 1, a: 1}, {merge: true}); // do sort, model change
      collection.add({id: 1, b: 1}, {merge: true}); // do sort, model change
      collection.add({id: 1, a: 1}, {merge: true}); // don't sort, no model change
      collection.add(collection.models); // don't sort, nothing new
      collection.add(collection.models, {merge: true}); // don't sort

      start();
    });
  });

  asyncTest("Attach options to collection.", 2, function() {
    require(['underscore', 'Collection', 'Model', 'setup'], function (_, Collection, Model) {
      var model = new Model;
      var comparator = function(){};

      var collection = new Collection([], {
        model: model,
        comparator: comparator
      });

      ok(collection.model === model);
      ok(collection.comparator === comparator);

      start();
    });
  });

  asyncTest("`add` overrides `set` flags", function () {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection();
      collection.once('add', function (model, collection, options) {
        collection.add({id: 2}, options);
      });
      collection.set({id: 1});
      equal(collection.length, 2);

      start();
    });
  });

  asyncTest("#2606 - Collection#create, success arguments", 1, function() {
    var env = this;
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {
      var collection = new Collection;
      collection.url = 'asyncTest';
      collection.create({}, {
        success: function(model, resp, options) {
          strictEqual(resp, 'response');
        }
      });
      env.ajaxSettings.success('response');

      start();
    });
  });

  asyncTest("#2612 - nested `parse` works with `Collection#set`", function() {
    require(['underscore', 'Collection', 'Model',  'setup'], function (_, Collection, Model) {

      var Job = Model.extend({
        constructor: function() {
          this.items = new Items();
          Model.apply(this, arguments);
        },
        parse: function(attrs) {
          this.items.set(attrs.items, {parse: true});
          return _.omit(attrs, 'items');
        }
      });

      var Item = Model.extend({
        constructor: function() {
          this.subItems = new Collection();
          Model.apply(this, arguments);
        },
        parse: function(attrs) {
          this.subItems.set(attrs.subItems, {parse: true});
          return _.omit(attrs, 'subItems');
        }
      });

      var Items = Collection.extend({
        model: Item
      });

      var data = {
        name: 'JobName',
        id: 1,
        items: [{
          id: 1,
          name: 'Sub1',
          subItems: [
            {id: 1, subName: 'One'},
            {id: 2, subName: 'Two'}
          ]
        }, {
          id: 2,
          name: 'Sub2',
          subItems: [
            {id: 3, subName: 'Three'},
            {id: 4, subName: 'Four'}
          ]
        }]
      };

      var newData = {
        name: 'NewJobName',
        id: 1,
        items: [{
          id: 1,
          name: 'NewSub1',
          subItems: [
            {id: 1,subName: 'NewOne'},
            {id: 2,subName: 'NewTwo'}
          ]
        }, {
          id: 2,
          name: 'NewSub2',
          subItems: [
            {id: 3,subName: 'NewThree'},
            {id: 4,subName: 'NewFour'}
          ]
        }]
      };

      var job = new Job(data, {parse: true});
      equal(job.get('name'), 'JobName');
      equal(job.items.at(0).get('name'), 'Sub1');
      equal(job.items.length, 2);
      equal(job.items.get(1).subItems.get(1).get('subName'), 'One');
      equal(job.items.get(2).subItems.get(3).get('subName'), 'Three');
      job.set(job.parse(newData, {parse: true}));
      equal(job.get('name'), 'NewJobName');
      equal(job.items.at(0).get('name'), 'NewSub1');
      equal(job.items.length, 2);
      equal(job.items.get(1).subItems.get(1).get('subName'), 'NewOne');
      equal(job.items.get(2).subItems.get(3).get('subName'), 'NewThree');

      start();
    });
  });

})();
