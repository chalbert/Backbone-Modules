(function() {

  var view;

  module("View", {

    setup: function() {
      define('setup', ['View'], function(View) {
        view = new View({
          id        : 'asyncTest-view',
          className : 'asyncTest-view',
          other     : 'non-special-option'
        });

      });
    },
    teardown: function(){
      require.undef('setup');
    }

  });

  asyncTest("constructor", 3, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      equal(view.el.id, 'asyncTest-view');
      equal(view.el.className, 'asyncTest-view');
      equal(view.el.other, void 0);
      start();
    });
  });

  asyncTest("jQuery", 1, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var view = new View;
      view.setElement('<p><a><b>asyncTest</b></a></p>');
      strictEqual(view.$('a b').html(), 'asyncTest');
      start();
    });
  });

  asyncTest("initialize", 1, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var View = View.extend({
        initialize: function() {
          this.one = 1;
        }
      });

      strictEqual(new View().one, 1);
      start();
    });
  });

  asyncTest("delegateEvents", 6, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var counter1 = 0, counter2 = 0;

      var view = new View({el: '<p><a id="asyncTest"></a></p>'});
      view.increment = function(){ counter1++; };
      view.$el.on('click', function(){ counter2++; });

      var events = {'click #asyncTest': 'increment'};

      view.delegateEvents(events);
      view.$('#asyncTest').trigger('click');
      equal(counter1, 1);
      equal(counter2, 1);

      view.$('#asyncTest').trigger('click');
      equal(counter1, 2);
      equal(counter2, 2);

      view.delegateEvents(events);
      view.$('#asyncTest').trigger('click');
      equal(counter1, 3);
      equal(counter2, 3);
      start();
    });
  });

  asyncTest("delegateEvents allows functions for callbacks", 3, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var view = new View({el: '<p></p>'});
      view.counter = 0;

      var events = {
        click: function() {
          this.counter++;
        }
      };

      view.delegateEvents(events);
      view.$el.trigger('click');
      equal(view.counter, 1);

      view.$el.trigger('click');
      equal(view.counter, 2);

      view.delegateEvents(events);
      view.$el.trigger('click');
      equal(view.counter, 3);
      start();
    });
  });


  asyncTest("delegateEvents ignore undefined methods", 0, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var view = new View({el: '<p></p>'});
      view.delegateEvents({'click': 'undefinedMethod'});
      view.$el.trigger('click');
      start();
    });
  });

  asyncTest("undelegateEvents", 6, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var counter1 = 0, counter2 = 0;

      var view = new View({el: '<p><a id="asyncTest"></a></p>'});
      view.increment = function(){ counter1++; };
      view.$el.on('click', function(){ counter2++; });

      var events = {'click #asyncTest': 'increment'};

      view.delegateEvents(events);
      view.$('#asyncTest').trigger('click');
      equal(counter1, 1);
      equal(counter2, 1);

      view.undelegateEvents();
      view.$('#asyncTest').trigger('click');
      equal(counter1, 1);
      equal(counter2, 2);

      view.delegateEvents(events);
      view.$('#asyncTest').trigger('click');
      equal(counter1, 2);
      equal(counter2, 3);
      start();
    });
  });

  asyncTest("_ensureElement with DOM node el", 1, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var View = View.extend({
        el: document.body
      });

      equal(new View().el, document.body);
      start();
    });
  });

  asyncTest("_ensureElement with string el", 3, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var View = View.extend({
        el: "body"
      });
      strictEqual(new View().el, document.body);

      View = View.extend({
        el: "#asyncTestElement > h1"
      });
      strictEqual(new View().el, $("#asyncTestElement > h1").get(0));

      View = View.extend({
        el: "#nonexistent"
      });
      ok(!new View().el);
      start();
    });
  });

  asyncTest("with className and id functions", 2, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var View = View.extend({
        className: function() {
          return 'className';
        },
        id: function() {
          return 'id';
        }
      });

      strictEqual(new View().el.className, 'className');
      strictEqual(new View().el.id, 'id');
      start();
    });
  });

  asyncTest("with attributes", 2, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var View = View.extend({
        attributes: {
          id: 'id',
          'class': 'class'
        }
      });

      strictEqual(new View().el.className, 'class');
      strictEqual(new View().el.id, 'id');
      start();
    });
  });

  asyncTest("with attributes as a function", 1, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var View = View.extend({
        attributes: function() {
          return {'class': 'dynamic'};
        }
      });

      strictEqual(new View().el.className, 'dynamic');
      start();
    });
  });

  asyncTest("multiple views per element", 3, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var count = 0;
      var $el = $('<p></p>');

      var View = View.extend({
        el: $el,
        events: {
          click: function() {
            count++;
          }
        }
      });

      var view1 = new View;
      $el.trigger("click");
      equal(1, count);

      var view2 = new View;
      $el.trigger("click");
      equal(3, count);

      view1.delegateEvents();
      $el.trigger("click");
      equal(5, count);
      start();
    });
  });

  asyncTest("custom events, with namespaces", 2, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var count = 0;

      var View = View.extend({
        el: $('body'),
        events: function() {
          return {"fake$event.namespaced": "run"};
        },
        run: function() {
          count++;
        }
      });

      var view = new View;
      $('body').trigger('fake$event').trigger('fake$event');
      equal(count, 2);

      $('body').unbind('.namespaced');
      $('body').trigger('fake$event');
      equal(count, 2);
      start();
    });
  });

  asyncTest("#1048 - setElement uses provided object.", 2, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var $el = $('body');

      var view = new View({el: $el});
      ok(view.$el === $el);

      view.setElement($el = $($el));
      ok(view.$el === $el);
      start();
    });
  });

  asyncTest("#986 - Undelegate before changing element.", 1, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var button1 = $('<button></button>');
      var button2 = $('<button></button>');

      var View = View.extend({
        events: {
          click: function(e) {
            ok(view.el === e.target);
          }
        }
      });

      var view = new View({el: button1});
      view.setElement(button2);

      button1.trigger('click');
      button2.trigger('click');
      start();
    });
  });

  asyncTest("#1172 - Clone attributes object", 2, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var View = View.extend({
        attributes: {foo: 'bar'}
      });

      var view1 = new View({id: 'foo'});
      strictEqual(view1.el.id, 'foo');

      var view2 = new View();
      ok(!view2.el.id);
      start();
    });
  });

  asyncTest("#1228 - tagName can be provided as a function", 1, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var View = View.extend({
        tagName: function() {
          return 'p';
        }
      });

      ok(new View().$el.is('p'));
      start();
    });
  });

  asyncTest("views stopListening", 0, function() {
    require(['underscore', 'View', 'Model', 'Collection', 'setup'], function (_, View, Model, Collection) {
      var View = View.extend({
        initialize: function() {
          this.listenTo(this.model, 'all x', function(){ ok(false); }, this);
          this.listenTo(this.collection, 'all x', function(){ ok(false); }, this);
        }
      });

      var view = new View({
        model: new Model,
        collection: new Collection
      });

      view.stopListening();
      view.model.trigger('x');
      view.collection.trigger('x');
      start();
    });
  });

  asyncTest("Provide function for el.", 2, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var View = View.extend({
        el: function() {
          return "<p><a></a></p>";
        }
      });

      var view = new View;
      ok(view.$el.is('p'));
      ok(view.$el.has('a'));
      start();
    });
  });

  asyncTest("events passed in options", 2, function() {
    require(['underscore', 'View', 'setup'], function (_, View) {
      var counter = 0;

      var View = View.extend({
        el: '<p><a id="asyncTest"></a></p>',
        increment: function() {
          counter++;
        }
      });

      var view = new View({events:{'click #asyncTest':'increment'}});
      var view2 = new View({events:function(){
        return {'click #asyncTest':'increment'};
      }});

      view.$('#asyncTest').trigger('click');
      view2.$('#asyncTest').trigger('click');
      equal(counter, 2);

      view.$('#asyncTest').trigger('click');
      view2.$('#asyncTest').trigger('click');
      equal(counter, 4);
      start();
    });
  });

})();
