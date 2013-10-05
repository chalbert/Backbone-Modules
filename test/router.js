(function() {

  var router = null;
  var location = null;
  var lastRoute = null;
  var lastArgs = [];
  var history;
  var MyRouter;

  function onRoute(router, route, args) {
    lastRoute = route;
    lastArgs = args;
  }

  var Location;
  var ExternalObject;

  module("Router", {

    setup: function() {
      define('setup', ['underscore', 'jquery', 'Router', 'History'], function(_, $, Router, History){
        Location = function(href) {
          this.replace(href);
        };

        _.extend(Location.prototype, {

          replace: function(href) {
            _.extend(this, _.pick($('<a></a>', {href: href})[0],
              'href',
              'hash',
              'host',
              'search',
              'fragment',
              'pathname',
              'protocol'
            ));
            // In IE, anchor.pathname does not contain a leading slash though
            // window.location.pathname does.
            if (!/^\//.test(this.pathname)) this.pathname = '/' + this.pathname;
          },

          toString: function() {
            return this.href;
          }

        });

        ExternalObject = {
          value: 'unset',

          routingFunction: function(value) {
            this.value = value;
          }
        };
        _.bindAll(ExternalObject);

        history = Router.history;

        MyRouter = Router.extend({

          count: 0,

          routes: {
            "noCallback":                 "noCallback",
            "counter":                    "counter",
            "search/:query":              "search",
            "search/:query/p:page":       "search",
            "contacts":                   "contacts",
            "contacts/new":               "newContact",
            "contacts/:id":               "loadContact",
            "route-event/:arg":           "routeEvent",
            "optional(/:item)":           "optionalItem",
            "named/optional/(y:z)":       "namedOptional",
            "splat/*args/end":            "splat",
            ":repo/compare/*from...*to":  "github",
            "decode/:named/*splat":       "decode",
            "*first/complex-*part/*rest": "complex",
            ":entity?*args":              "query",
            "function/:value":            ExternalObject.routingFunction,
            "*anything":                  "anything"
          },

          initialize : function(options) {
            this.asyncTesting = options.asyncTesting;
            this.route('implicit', 'implicit');
          },

          counter: function() {
            this.count++;
          },

          implicit: function() {
            this.count++;
          },

          search : function(query, page) {
            this.query = query;
            this.page = page;
          },

          contacts: function(){
            this.contact = 'index';
          },

          newContact: function(){
            this.contact = 'new';
          },

          loadContact: function(){
            this.contact = 'load';
          },

          optionalItem: function(arg){
            this.arg = arg != void 0 ? arg : null;
          },

          splat: function(args) {
            this.args = args;
          },

          github: function(repo, from, to) {
            this.repo = repo;
            this.from = from;
            this.to = to;
          },

          complex: function(first, part, rest) {
            this.first = first;
            this.part = part;
            this.rest = rest;
          },

          query: function(entity, args) {
            this.entity    = entity;
            this.queryArgs = args;
          },

          anything: function(whatever) {
            this.anything = whatever;
          },

          namedOptional: function(z) {
            this.z = z;
          },

          decode: function(named, path) {
            this.named = named;
            this.path = path;
          },

          routeEvent: function(arg) {
          }

        });

        location = new Location('http://example.com');
        Router.history = _.extend(new History, {location: location});
        router = new MyRouter({asyncTesting: 101});
        Router.history.interval = 9;
        Router.history.start({pushState: false});
        lastRoute = null;
        lastArgs = [];
        Router.history.on('route', onRoute);

      });
    },

    teardown: function() {
      require.undef('setup');
      history.stop();
      history.off('route', onRoute);
    }

  });

  asyncTest("initialize", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      equal(router.asyncTesting, 101);
      start();
    });
  });

  asyncTest("routes (simple)", 4, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#search/news');
      Router.history.checkUrl();
      equal(router.query, 'news');
      equal(router.page, void 0);
      equal(lastRoute, 'search');
      equal(lastArgs[0], 'news');
      start();
    });
  });

  asyncTest("routes (simple, but unicode)", 4, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#search/тест');
      Router.history.checkUrl();
      equal(router.query, "тест");
      equal(router.page, void 0);
      equal(lastRoute, 'search');
      equal(lastArgs[0], "тест");
      start();
    });
  });

  asyncTest("routes (two part)", 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#search/nyc/p10');
      Router.history.checkUrl();
      equal(router.query, 'nyc');
      equal(router.page, '10');
      start();
    });
  });

  asyncTest("routes via navigate", 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.navigate('search/manhattan/p20', {trigger: true});
      equal(router.query, 'manhattan');
      equal(router.page, '20');
      start();
    });
  });

  asyncTest("routes via navigate for backwards-compatibility", 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.navigate('search/manhattan/p20', true);
      equal(router.query, 'manhattan');
      equal(router.page, '20');
      start();
    });
  });

  asyncTest("reports matched route via nagivate", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      ok(Router.history.navigate('search/manhattan/p20', true));
      start();
    });
  });

  asyncTest("route precedence via navigate", 6, function(){
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      // check both 0.9.x and backwards-compatibility options
      _.each([ { trigger: true }, true ], function( options ){
        Router.history.navigate('contacts', options);
        equal(router.contact, 'index');
        Router.history.navigate('contacts/new', options);
        equal(router.contact, 'new');
        Router.history.navigate('contacts/foo', options);
        equal(router.contact, 'load');
      });
      start();
    });
  });

  asyncTest("loadUrl is not called for identical routes.", 0, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.loadUrl = function(){ ok(false); };
      location.replace('http://example.com#route');
      Router.history.navigate('route');
      Router.history.navigate('/route');
      Router.history.navigate('/route');
      start();
    });
  });

  asyncTest("use implicit callback if none provided", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      router.count = 0;
      router.navigate('implicit', {trigger: true});
      equal(router.count, 1);
      start();
    });
  });

  asyncTest("routes via navigate with {replace: true}", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#start_here');
      Router.history.checkUrl();
      location.replace = function(href) {
        strictEqual(href, new Location('http://example.com#end_here').href);
      };
      Router.history.navigate('end_here', {replace: true});
      start();
    });
  });

  asyncTest("routes (splats)", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#splat/long-list/of/splatted_99args/end');
      Router.history.checkUrl();
      equal(router.args, 'long-list/of/splatted_99args');
      start();
    });
  });

  asyncTest("routes (github)", 3, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#backbone/compare/1.0...braddunbar:with/slash');
      Router.history.checkUrl();
      equal(router.repo, 'backbone');
      equal(router.from, '1.0');
      equal(router.to, 'braddunbar:with/slash');
      start();
    });
  });

  asyncTest("routes (optional)", 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#optional');
      Router.history.checkUrl();
      ok(!router.arg);
      location.replace('http://example.com#optional/thing');
      Router.history.checkUrl();
      equal(router.arg, 'thing');
      start();
    });
  });

  asyncTest("routes (complex)", 3, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#one/two/three/complex-part/four/five/six/seven');
      Router.history.checkUrl();
      equal(router.first, 'one/two/three');
      equal(router.part, 'part');
      equal(router.rest, 'four/five/six/seven');
      start();
    });
  });

  asyncTest("routes (query)", 5, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#mandel?a=b&c=d');
      Router.history.checkUrl();
      equal(router.entity, 'mandel');
      equal(router.queryArgs, 'a=b&c=d');
      equal(lastRoute, 'query');
      equal(lastArgs[0], 'mandel');
      equal(lastArgs[1], 'a=b&c=d');
      start();
    });
  });

  asyncTest("routes (anything)", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#doesnt-match-a-route');
      Router.history.checkUrl();
      equal(router.anything, 'doesnt-match-a-route');
      start();
    });
  });

  asyncTest("routes (function)", 3, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      router.on('route', function(name) {
        ok(name === '');
      });
      equal(ExternalObject.value, 'unset');
      location.replace('http://example.com#function/set');
      Router.history.checkUrl();
      equal(ExternalObject.value, 'set');
      start();
    });
  });

  asyncTest("Decode named parameters, not splats.", 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#decode/a%2Fb/c%2Fd/e');
      Router.history.checkUrl();
      strictEqual(router.named, 'a/b');
      strictEqual(router.path, 'c/d/e');
      start();
    });
  });

  asyncTest("fires event when router doesn't have callback on it", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      router.on("route:noCallback", function(){ ok(true); });
      location.replace('http://example.com#noCallback');
      Router.history.checkUrl();
      start();
    });
  });

  asyncTest("#933, #908 - leading slash", 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com/root/foo');

      Router.history.stop();
      Router.history = _.extend(new History, {location: location});
      Router.history.start({root: '/root', hashChange: false, silent: true});
      strictEqual(Router.history.getFragment(), 'foo');

      Router.history.stop();
      Router.history = _.extend(new History, {location: location});
      Router.history.start({root: '/root/', hashChange: false, silent: true});
      strictEqual(Router.history.getFragment(), 'foo');
      start();
    });
  });

  asyncTest("#1003 - History is started before navigate is called", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      Router.history.navigate = function(){ ok(History.started); };
      Router.history.start();
      // If this is not an old IE navigate will not be called.
      if (!Router.history.iframe) ok(true);
      start();
    });
  });

  asyncTest("#967 - Route callback gets passed encoded values.", 3, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      var route = 'has%2Fslash/complex-has%23hash/has%20space';
      Router.history.navigate(route, {trigger: true});
      strictEqual(router.first, 'has/slash');
      strictEqual(router.part, 'has#hash');
      strictEqual(router.rest, 'has space');
      start();
    });
  });

  asyncTest("correctly handles URLs with % (#868)", 3, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#search/fat%3A1.5%25');
      Router.history.checkUrl();
      location.replace('http://example.com#search/fat');
      Router.history.checkUrl();
      equal(router.query, 'fat');
      equal(router.page, void 0);
      equal(lastRoute, 'search');
      start();
    });
  });

  asyncTest("#1185 - Use pathname when hashChange is not wanted.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/path/name#hash');
      Router.history = _.extend(new History, {location: location});
      Router.history.start({hashChange: false});
      var fragment = Router.history.getFragment();
      strictEqual(fragment, location.pathname.replace(/^\//, ''));
      start();
    });
  });

  asyncTest("#1206 - Strip leading slash before location.assign.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root/');
      Router.history = _.extend(new History, {location: location});
      Router.history.start({hashChange: false, root: '/root/'});
      location.assign = function(pathname) {
        strictEqual(pathname, '/root/fragment');
      };
      Router.history.navigate('/fragment');
      start();
    });
  });

  asyncTest("#1387 - Root fragment without trailing slash.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root');
      Router.history = _.extend(new History, {location: location});
      Router.history.start({hashChange: false, root: '/root/', silent: true});
      strictEqual(Router.history.getFragment(), '');
      start();
    });
  });

  asyncTest("#1366 - History does not prepend root to fragment.", 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root/');
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(state, title, url) {
            strictEqual(url, '/root/x');
          }
        }
      });
      Router.history.start({
        root: '/root/',
        pushState: true,
        hashChange: false
      });
      Router.history.navigate('x');
      strictEqual(Router.history.fragment, 'x');
      start();
    });
  });

  asyncTest("Normalize root.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root');
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(state, title, url) {
            strictEqual(url, '/root/fragment');
          }
        }
      });
      Router.history.start({
        pushState: true,
        root: '/root',
        hashChange: false
      });
      Router.history.navigate('fragment');
      start();
    });
  });

  asyncTest("Normalize root.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root#fragment');
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(state, title, url) {},
          replaceState: function(state, title, url) {
            strictEqual(url, '/root/fragment');
          }
        }
      });
      Router.history.start({
        pushState: true,
        root: '/root'
      });
      start();
    });
  });

  asyncTest("Normalize root.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root');
      Router.history = _.extend(new History, {location: location});
      Router.history.loadUrl = function() { ok(true); };
      Router.history.start({
        pushState: true,
        root: '/root'
      });
      start();
    });
  });

  asyncTest("Normalize root - leading slash.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root');
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(){},
          replaceState: function(){}
        }
      });
      Router.history.start({root: 'root'});
      strictEqual(Router.history.root, '/root/');
      start();
    });
  });

  asyncTest("Transition from hashChange to pushState.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root#x/y');
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(){},
          replaceState: function(state, title, url){
            strictEqual(url, '/root/x/y');
          }
        }
      });
      Router.history.start({
        root: 'root',
        pushState: true
      });
      start();
    });
  });

  asyncTest("#1619: Router: Normalize empty root", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/');
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(){},
          replaceState: function(){}
        }
      });
      Router.history.start({root: ''});
      strictEqual(Router.history.root, '/');
      start();
    });
  });

  asyncTest("#1619: Router: nagivate with empty root", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/');
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(state, title, url) {
            strictEqual(url, '/fragment');
          }
        }
      });
      Router.history.start({
        pushState: true,
        root: '',
        hashChange: false
      });
      Router.history.navigate('fragment');
      start();
    });
  });

  asyncTest("Transition from pushState to hashChange.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root/x/y?a=b');
      location.replace = function(url) {
        strictEqual(url, '/root/?a=b#x/y');
      };
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: null,
          replaceState: null
        }
      });
      Router.history.start({
        root: 'root',
        pushState: true
      });
      start();
    });
  });

  asyncTest("#1695 - hashChange to pushState with search.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root?a=b#x/y');
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(){},
          replaceState: function(state, title, url){
            strictEqual(url, '/root/x/y?a=b');
          }
        }
      });
      Router.history.start({
        root: 'root',
        pushState: true
      });
      start();
    });
  });

  asyncTest("#1746 - Router allows empty route.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      var Router = Router.extend({
        routes: {'': 'empty'},
        empty: function(){},
        route: function(route){
          strictEqual(route, '');
        }
      });
      new Router;
      start();
    });
  });

  asyncTest("#1794 - Trailing space in fragments.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      var history = new History;
      strictEqual(history.getFragment('fragment   '), 'fragment');
      start();
    });
  });

  asyncTest("#1820 - Leading slash and trailing space.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      var history = new History;
      strictEqual(history.getFragment('/fragment '), 'fragment');
      start();
    });
  });

  asyncTest("#1980 - Optional parameters.", 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      location.replace('http://example.com#named/optional/y');
      Router.history.checkUrl();
      strictEqual(router.z, undefined);
      location.replace('http://example.com#named/optional/y123');
      Router.history.checkUrl();
      strictEqual(router.z, '123');
      start();
    });
  });

  asyncTest("#2062 - Trigger 'route' event on router instance.", 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      router.on('route', function(name, args) {
        strictEqual(name, 'routeEvent');
        deepEqual(args, ['x']);
      });
      location.replace('http://example.com#route-event/x');
      Router.history.checkUrl();
      start();
    });
  });

  asyncTest("#2255 - Extend routes by making routes a function.", 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      var RouterBase = Router.extend({
        routes: function() {
          return {
            home:  "root",
            index: "index.html"
          };
        }
      });

      var RouterExtended = RouterBase.extend({
        routes: function() {
          var _super = RouterExtended.__super__.routes;
          return _.extend(_super(),
            { show:   "show",
              search: "search" });
        }
      });

      var router = new RouterExtended();
      deepEqual({home: "root", index: "index.html", show: "show", search: "search"}, router.routes);
      start();
    });
  });

  asyncTest("#2538 - hashChange to pushState only if both requested.", 0, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      location.replace('http://example.com/root?a=b#x/y');
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(){},
          replaceState: function(){ ok(false); }
        }
      });
      Router.history.start({
        root: 'root',
        pushState: true,
        hashChange: false
      });
      start();
    });
  });

  asyncTest('No hash fallback.', 0, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(){},
          replaceState: function(){}
        }
      });

      var Router = Router.extend({
        routes: {
          hash: function() { ok(false); }
        }
      });
      var router = new Router;

      location.replace('http://example.com/');
      Router.history.start({
        pushState: true,
        hashChange: false
      });
      location.replace('http://example.com/nomatch#hash');
      Router.history.checkUrl();
      start();
    });
  });

  asyncTest('#2656 - No trailing slash on root.', 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(state, title, url){
            strictEqual(url, '/root');
          }
        }
      });
      location.replace('http://example.com/root/path');
      Router.history.start({pushState: true, root: 'root'});
      Router.history.navigate('');
      start();
    });
  });

  asyncTest('#2656 - No trailing slash on root.', 1, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(state, title, url) {
            strictEqual(url, '/');
          }
        }
      });
      location.replace('http://example.com/path');
      Router.history.start({pushState: true});
      Router.history.navigate('');
      start();
    });
  });

  asyncTest('#2765 - Fragment matching sans query/hash.', 2, function() {
    require(['underscore', 'Router', 'History', 'setup'], function (_, Router, History) {
      Router.history.stop();
      Router.history = _.extend(new History, {
        location: location,
        history: {
          pushState: function(state, title, url) {
            strictEqual(url, '/path?query#hash');
          }
        }
      });

      var Router = Router.extend({
        routes: {
          path: function() { ok(true); }
        }
      });
      var router = new Router;

      location.replace('http://example.com/');
      Router.history.start({pushState: true});
      Router.history.navigate('path?query#hash', true);
      start();
    });
  });

})();
