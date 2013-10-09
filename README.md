# Backbone Modules

The Backbone library as a set of Require modules. 

Loving Backbone but you don't need all its functionality? Working on mobile project and want to optimize load time? 
Backbone Modules can help you!

**Modules**
* Collection
* Events
* History
* Model
* Router
* View

**Helpers**
* ajax
* extend
* sync

### Changes to Backbone

Backbone.history is now Router.history

Backbone.noconflict is removed (no global scope == no conflict) as is its test case

Backbone.$ is removed. See how to specifc jQuery.

Backbone.emulateHTTP is now sync.emulateHTTP

Backbone.emulateJSON is now sync.emulateJSON

### Make things simple with paths

    require.config({
      paths: {
        view: 'backbone/View',
        model: 'backbone/Model',
        collection: 'backbone/Collection',
        router: 'backbone/Router',
        events: 'backbone/Events'
      }
    });

And now use

    define(['view'], function(View){
      var Widget = View.extend({
            ...
      });
    })

In addition to having dependencies that really reflects what your module use, you now have an abstraction of a view.
If you want to change / extend what a view is, is now as simple as updating the path.

    require.config({
      paths: {
        view: 'myCustomView'
      }
    });

### How to specify jQuery

If you use jQuery and it is matches the "jquery" path, then you don't have to do anything.

If you want to use a global jQuery replacement, you can update the "map" require config to point to the replacement 
of your choice.

    require.config({
      map: {
        '*': {
          jquery: 'zepto'
        }
      }
    });

If you want to specify only the version used for your Backone modules, you can use:

    require.config({
      map: {
        'backbone/View': {
          jquery: 'zepto'
        },
        'backbone/History': {
          jquery: 'zepto'
        },
        'backbone/helpers/ajax': {
          jquery: 'zepto'
        }
      }
    });
    
In a similar way, you can override the ajax implememtation. Instead of overriding Backbone.ajax, do:

    require.config({
      map: {
        'backbone/helpers/sync': {
          'backbone/helpers/ajax': 'myOwnAjaxImplementation'
        }
      }
    });
    
### Unit tests

The original test cases have been updated to support the new module definition.
