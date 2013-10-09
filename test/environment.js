QUnit.testStart(function() {

  require.config({
    baseUrl: '../src',
    paths: {
      underscore: '../test/vendor/underscore',
      jquery: '../test/vendor/jquery'
    },
    shim: {
      'jquery': {
        exports: 'jQuery'
      },
      'underscore': {
        exports: '_'
      }
    },
    map: {
      'helpers/sync': {
        'helpers/ajax': 'ajax'
      },
      'Model': {
        'helpers/sync': 'sync'
      },
      'Collection': {
        'helpers/sync': 'sync'
      }
    }
  });

  var env = this.config.current.testEnvironment;

  define('ajax', ['helpers/ajax'], function(){
    return function(settings) {
      env.ajaxSettings = settings;
    };
  });

  define('sync', ['helpers/sync'], function(sync){
    return function(method, model, options) {
      env.syncArgs = {
        method: method,
        model: model,
        options: options
      };
      sync.apply(this, arguments);
    };
  });

//  require(['helpers/ajax', 'helpers/sync'], function(ajax, sync) {
//
//    var sync = Backbone.sync;
//    var ajax = Backbone.ajax;
//    var emulateHTTP = Backbone.emulateHTTP;
//    var emulateJSON = Backbone.emulateJSON;
//
//
//    // Capture ajax settings for comparison.
//    Backbone.ajax = function(settings) {
//      env.ajaxSettings = settings;
//    };
//
//    // Capture the arguments to Backbone.sync for comparison.
//    Backbone.sync = function(method, model, options) {
//      env.syncArgs = {
//        method: method,
//        model: model,
//        options: options
//      };
//      sync.apply(this, arguments);
//    };
//
//  });


});

QUnit.testDone(function() {
  // Lets destroy every definition to ensure we start with a clean state. We could loop on the context, but I rather
  // not use a private API.
  require.undef('Collection');
  require.undef('Events');
  require.undef('History');
  require.undef('Model');
  require.undef('Router');
  require.undef('View');
  require.undef('helpers/ajax');
  require.undef('helpers/extend');
  require.undef('jquery');
  require.undef('helpers/sync');
  require.undef('helpers/urlError');
  require.undef('helpers/wrapError');

  require.undef('ajax');
  require.undef('sync');

  require.undef('jquery');
  require.undef('underscore');
});
