(function() {

  var Library;
  var library;

  var attrs = {
    title  : "The Tempest",
    author : "Bill Shakespeare",
    length : 123
  };

  module("sync", {

    setup: function() {
      define('setup', ['Collection'], function(Collection) {
        Library = Collection.extend({
          url : function() { return '/library'; }
        });

        library = new Library;
        library.create(attrs, {wait: false});

      });
    },
    teardown: function(){
      require.undef('setup');
    }

  });

  asyncTest("read", 4, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      library.fetch();
      equal(env.ajaxSettings.url, '/library');
      equal(env.ajaxSettings.type, 'GET');
      equal(env.ajaxSettings.dataType, 'json');
      ok(_.isEmpty(env.ajaxSettings.data));

      start();
    });
  });

  asyncTest("passing data", 3, function() {
    var env = this;
    require(['underscore', 'Model', 'setup'], function (_, Model) {
      library.fetch({data: {a: 'a', one: 1}});
      equal(env.ajaxSettings.url, '/library');
      equal(env.ajaxSettings.data.a, 'a');
      equal(env.ajaxSettings.data.one, 1);

      start();
    });
  });

  asyncTest("create", 6, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      equal(env.ajaxSettings.url, '/library');
      equal(env.ajaxSettings.type, 'POST');
      equal(env.ajaxSettings.dataType, 'json');
      var data = JSON.parse(env.ajaxSettings.data);
      equal(data.title, 'The Tempest');
      equal(data.author, 'Bill Shakespeare');
      equal(data.length, 123);

      start();
    });
  });

  asyncTest("update", 7, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      library.first().save({id: '1-the-tempest', author: 'William Shakespeare'});
      equal(env.ajaxSettings.url, '/library/1-the-tempest');
      equal(env.ajaxSettings.type, 'PUT');
      equal(env.ajaxSettings.dataType, 'json');
      var data = JSON.parse(env.ajaxSettings.data);
      equal(data.id, '1-the-tempest');
      equal(data.title, 'The Tempest');
      equal(data.author, 'William Shakespeare');
      equal(data.length, 123);

      start();
    });
  });

  asyncTest("update with emulateHTTP and emulateJSON", 7, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'}, {
        emulateHTTP: true,
        emulateJSON: true
      });
      equal(env.ajaxSettings.url, '/library/2-the-tempest');
      equal(env.ajaxSettings.type, 'POST');
      equal(env.ajaxSettings.dataType, 'json');
      equal(env.ajaxSettings.data._method, 'PUT');
      var data = JSON.parse(env.ajaxSettings.data.model);
      equal(data.id, '2-the-tempest');
      equal(data.author, 'Tim Shakespeare');
      equal(data.length, 123);

      start();
    });
  });

  asyncTest("update with just emulateHTTP", 6, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'}, {
        emulateHTTP: true
      });
      equal(env.ajaxSettings.url, '/library/2-the-tempest');
      equal(env.ajaxSettings.type, 'POST');
      equal(env.ajaxSettings.contentType, 'application/json');
      var data = JSON.parse(env.ajaxSettings.data);
      equal(data.id, '2-the-tempest');
      equal(data.author, 'Tim Shakespeare');
      equal(data.length, 123);

      start();
    });
  });

  asyncTest("update with just emulateJSON", 6, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'}, {
        emulateJSON: true
      });
      equal(env.ajaxSettings.url, '/library/2-the-tempest');
      equal(env.ajaxSettings.type, 'PUT');
      equal(env.ajaxSettings.contentType, 'application/x-www-form-urlencoded');
      var data = JSON.parse(env.ajaxSettings.data.model);
      equal(data.id, '2-the-tempest');
      equal(data.author, 'Tim Shakespeare');
      equal(data.length, 123);

      start();
    });
  });

  asyncTest("read model", 3, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
      library.first().fetch();
      equal(env.ajaxSettings.url, '/library/2-the-tempest');
      equal(env.ajaxSettings.type, 'GET');
      ok(_.isEmpty(env.ajaxSettings.data));

      start();
    });
  });

  asyncTest("destroy", 3, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
      library.first().destroy({wait: true});
      equal(env.ajaxSettings.url, '/library/2-the-tempest');
      equal(env.ajaxSettings.type, 'DELETE');
      equal(env.ajaxSettings.data, null);

      start();
    });
  });

  asyncTest("destroy with emulateHTTP", 3, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
      library.first().destroy({
        emulateHTTP: true,
        emulateJSON: true
      });
      equal(env.ajaxSettings.url, '/library/2-the-tempest');
      equal(env.ajaxSettings.type, 'POST');
      equal(JSON.stringify(env.ajaxSettings.data), '{"_method":"DELETE"}');

      start();
    });
  });

  asyncTest("urlError", 2, function() {
    var env = this;

    require(['underscore', 'Model', 'setup'], function (_, Model) {
      var model = new Model();
      raises(function() {
        model.fetch();
      });
      model.fetch({url: '/one/two'});
      equal(env.ajaxSettings.url, '/one/two');

      start();
    });
  });

  asyncTest("#1052 - `options` is optional.", 0, function() {
    require(['underscore', 'Model', 'helpers/sync', 'setup'], function (_, Model, sync) {
      var model = new Model();
      model.url = '/asyncTest';
      sync('create', model);

      start();
    });
  });

  asyncTest("Backbone.ajax", 1, function() {

    require(['setup'], function(){

      // Override ajax
      require.undef('helpers/sync');
      require.config({
        map: {
          'helpers/sync': {
            'helpers/ajax': 'newajax'
          }
        }
      });

      define('newajax', ['helpers/ajax'], function(){
        return function(settings){
          strictEqual(settings.url, '/asyncTest');
        };
      });

      require(['underscore', 'Model', 'helpers/sync'], function (_, Model, sync) {
        var model = new Model();
        model.url = '/asyncTest';
        sync('create', model);
        start();
      });

    });

  });

  asyncTest("Call provided error callback on error.", 1, function() {
    var env = this;

    require(['underscore', 'Model', 'helpers/sync', 'setup'], function (_, Model, sync) {
      var model = new Model;
      model.url = '/asyncTest';
      sync('read', model, {
        error: function() { ok(true); }
      });
      env.ajaxSettings.error();

      start();
    });
  });

  asyncTest('Use Backbone.emulateHTTP as default.', 2, function() {
    var env = this;

      require(['underscore', 'Model', 'helpers/sync', 'setup'], function (_, Model, sync) {
      var model = new Model;
      model.url = '/asyncTest';

      sync.emulateHTTP = true;
      model.sync('create', model);
      strictEqual(env.ajaxSettings.emulateHTTP, true);

      sync.emulateHTTP = false;
      model.sync('create', model);
      strictEqual(env.ajaxSettings.emulateHTTP, false);

      start();
    });
  });

  asyncTest('Use sync as default.', 2, function() {
    var env = this;

    require(['underscore', 'Model', 'helpers/sync', 'setup'], function (_, Model, sync) {

      var model = new Model;
      model.url = '/asyncTest';

      sync.emulateJSON = true;
      model.sync('create', model);
      strictEqual(env.ajaxSettings.emulateJSON, true);

      sync.emulateJSON = false;
      model.sync('create', model);
      strictEqual(env.ajaxSettings.emulateJSON, false);

      start();
    });
  });

  asyncTest("#1756 - Call user provided beforeSend function.", 4, function() {
    var env = this;

    require(['underscore', 'Model', 'helpers/sync', 'setup'], function (_, Model, sync) {
      sync.emulateHTTP = true;

      var model = new Model;
      model.url = '/asyncTest';
      var xhr = {
        setRequestHeader: function(header, value) {
          strictEqual(header, 'X-HTTP-Method-Override');
          strictEqual(value, 'DELETE');
        }
      };
      model.sync('delete', model, {
        beforeSend: function(_xhr) {
          ok(_xhr === xhr);
          return false;
        }
      });
      strictEqual(env.ajaxSettings.beforeSend(xhr), false);

      start();
    });
  });

})();
