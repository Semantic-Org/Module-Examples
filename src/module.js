// # Semantic Modules
// This is a design pattern for creating UI modules in Semantic
//
// Semantic is unique in that all arbitrary data is a setting. Semantic modules also are self documenting, with module.debug calls serving to explain state, and log performance data.
/*
 * # Semantic UI - Module
 * http://github.com/quirkyinc/semantic
 *
 *
 * Copyright 2013 Contributors
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 */

;(function ( $, window, document, undefined ) {

$.fn.example = function(parameters) {

  // ## Group
  // Some properties remain constant across all instances of a module.
  var
    // Store a reference to the module group, this can be useful to refer to other modules inside each module
    $allModules     = $(this),

    // store references to elements that are consistent across all instances
    $document       = $(document),

    // Preserve selector from outside each scope and mark current time for performance tracking
    moduleSelector  = $allModules.selector || '',

    time            = new Date().getTime(),
    performance     = [],

    // Preserve original arguments to determine if a method is being invoked
    query           = arguments[0],
    methodInvoked   = (typeof query == 'string'),
    queryArguments  = [].slice.call(arguments, 1),
    returnedValue
  ;

  // ## Singular
  // Iterate over all elements to initialize module
  $allModules
    .each(function() {
      var

        // Extend settings to merge run-time settings with defaults
        settings        = ( $.isPlainObject(parameters) )
          ? $.extend(true, {}, $.fn.example.settings, parameters)
          : $.extend({}, $.fn.example.settings),

        // Alias settings object for convenience and performance
        namespace      = settings.namespace,
        error          = settings.error,
        className      = settings.className,

        // You may also find it useful to alias your own settings
        text           = settings.text,

        // Define namespaces for storing module instance and binding events
        eventNamespace  = '.' + namespace,
        moduleNamespace = 'module-' + namespace,

        // Instance is stored and retreived in namespaced DOM metadata
        instance        = $(this).data(moduleNamespace),
        element         = this,

        // Cache selectors using selector settings object for access inside instance of module
        $module        = $(this),
        $text          = $module.find(settings.selector.text),

        // Define private variables which can be used to maintain internal state, these cannot be changed from outside the module closure so use conservatively. Default values are set using `a || b` syntax
        observer,
        module
      ;

      // ## Module Behavior
      module = {

        // ### Required

        // #### Initialize
        // Initialize attaches events and preserves each instance in html metadata
        initialize: function() {
          module.debug('Initializing module for', element);
          module.bind.events();
          module.instantiate();
        },

        instantiate: function() {
          module.verbose('Storing instance of module');
          // The instance is just a copy of the module definition, we store it in metadata so we can use it outside of scope, but also define it for immediate use
          instance = module;
          $module
            .data(moduleNamespace, instance)
          ;
        },


        // ### Observe Changes
        // This is a common pattern used to watch for changes to an element using [DOM Mutation Observers](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
        // This allows you recalculate cached values, or update the selector cache when sub-elements of a module change
        observeChanges: function() {
          if('MutationObserver' in window) {
            observer = new MutationObserver(function(mutations) {
              module.debug('Element updated refreshing selectors');
              module.refresh();
            });
            observer.observe(element, {
              childList : true,
              subtree   : true
            });
            module.debug('Setting up mutation observer', observer);
          }
        },

        // #### Destroy
        // Removes all events and the instance copy from metadata
        destroy: function() {
          module.verbose('Destroying previous module for', element);
          $module
            .removeData(moduleNamespace)
            .off(eventNamespace)
          ;
        },

        // #### Refresh
        // Selectors or cached values sometimes need to refreshed
        refresh: function() {
          module.verbose('Refreshing elements', element);
          $module = $(element);
          $text   = $(this).find(settings.selector.text);
        },

        // ### Bind events
        // Bind events to element
        bind: {
          events: function() {
            $module
              .on('click' + eventNamespace, module.exampleBehavior)
            ;
          }
        },

        // ### Custom
        // #### By Event
        // Sometimes it makes sense to call an event handler by its type if it is dependent on the event to behave properly
        event: {
          click: function(event) {
            module.verbose('Preventing default action');
            if( !$module.hasClass(className.disabled) ) {
              module.behavior();
            }
            event.preventDefault();
          }
        },

        // #### By Function
        // Other times events make more sense for methods to be called by their function if it is ambivalent to how it is invoked
        behavior: function() {
          module.debug('Changing the text to a new value', text);
          if( !module.has.text() ) {
            module.set.text( text);
          }
        },

        // #### Behaviors
        // Custom methods should be defined with consistent word usage, some useful terms: "has", "set", "get", "change", "add", "remove"
        // Make sure method names read in sentence order, "set text" not "text set"
        has: {
          text: function(state) {
            module.verbose('Checking whether text state exists', state);
            if( text[state] === undefined ) {
              module.error(error.noText);
              return false;
            }
            return true;
          }
        },

        set: {
          text: function(state) {
            module.verbose('Setting text to new state', state);
            if( module.has.text(state) ) {
              $text
                .text( text[state] )
              ;
              settings.onChange();
            }
          }
        },

        // ### Standard

        // #### Setting
        // Module settings can be read or set using this method
        //
        // Settings can either be specified by modifying the module defaults, by initializing the module with a settings object, or by changing a setting by invoking this method
        // `$(.foo').example('setting', 'moduleName');`
        setting: function(name, value) {
          module.debug('Changing setting', name, value);
          if( $.isPlainObject(name) ) {
            $.extend(true, settings, name);
          }
          else if(value !== undefined) {
            settings[name] = value;
          }
          else {
            return settings[name];
          }
        },

        // #### Internal
        // Module internals can be set or retrieved as well
        // `$(.foo').example('internal', 'behavior', function() { // do something });`
        internal: function(name, value) {
          if( $.isPlainObject(name) ) {
            $.extend(true, module, name);
          }
          else if(value !== undefined) {
            module[name] = value;
          }
          else {
            return module[name];
          }
        },

        // #### Debug
        // Debug pushes arguments to the console formatted as a debug statement
        debug: function() {
          if(settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.debug = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.debug.apply(console, arguments);
            }
          }
        },

        // #### Verbose
        // Calling verbose internally allows for additional data to be logged which can assist in debugging
        verbose: function() {
          if(settings.verbose && settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.verbose = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.verbose.apply(console, arguments);
            }
          }
        },

        // #### Error
        // Error allows for the module to report named error messages, it may be useful to modify this to push error messages to the user. Error messages are defined in the modules settings object.
        error: function() {
          module.error = Function.prototype.bind.call(console.error, console, settings.name + ':');
          module.error.apply(console, arguments);
        },

        // #### Performance
        // This is called on each debug statement and logs the time since the last debug statement.
performance: {
          log: function(message) {
            var
              currentTime,
              executionTime,
              previousTime
            ;
            if(settings.performance) {
              currentTime   = new Date().getTime();
              previousTime  = time || currentTime;
              executionTime = currentTime - previousTime;
              time          = currentTime;
              performance.push({
                'Name'           : message[0],
                'Arguments'      : [].slice.call(message, 1) || '',
                'Element'        : element,
                'Execution Time' : executionTime
              });
            }
            clearTimeout(module.performance.timer);
            module.performance.timer = setTimeout(module.performance.display, 500);
          },
          display: function() {
            var
              title = settings.name + ':',
              totalTime = 0
            ;
            time = false;
            clearTimeout(module.performance.timer);
            $.each(performance, function(index, data) {
              totalTime += data['Execution Time'];
            });
            title += ' ' + totalTime + 'ms';
            if(moduleSelector) {
              title += ' \'' + moduleSelector + '\'';
            }
            if( (console.group !== undefined || console.table !== undefined) && performance.length > 0) {
              console.groupCollapsed(title);
              if(console.table) {
                console.table(performance);
              }
              else {
                $.each(performance, function(index, data) {
                  console.log(data['Name'] + ': ' + data['Execution Time']+'ms');
                });
              }
              console.groupEnd();
            }
            performance = [];
          }
        },

        // #### Invoke
        // Invoke is used to match internal functions to string lookups.
        // `$('.foo').example('invoke', 'set text', 'Foo')`
        // Method lookups are lazy, looking for many variations of a search string
        // For example 'set text', will look for both `setText : function(){}`, `set: { text: function(){} }`
        // Invoke attempts to preserve the 'this' chaining unless a value is returned.
        // If multiple values are returned an array of values matching up to the length of the selector is returned

        invoke: function(query, passedArguments, context) {
          var
            object = instance,
            maxDepth,
            found,
            response
          ;
          passedArguments = passedArguments || queryArguments;
          context         = element         || context;
          if(typeof query == 'string' && object !== undefined) {
            query    = query.split(/[\. ]/);
            maxDepth = query.length - 1;
            $.each(query, function(depth, value) {
              var camelCaseValue = (depth != maxDepth)
                ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                : query
              ;
              if( $.isPlainObject( object[camelCaseValue] ) && (depth != maxDepth) ) {
                object = object[camelCaseValue];
              }
              else if( object[camelCaseValue] !== undefined ) {
                found = object[camelCaseValue];
                return false;
              }
              else if( $.isPlainObject( object[value] ) && (depth != maxDepth) ) {
                object = object[value];
              }
              else if( object[value] !== undefined ) {
                found = object[value];
                return false;
              }
              else {
                module.error(error.method, query);
                return false;
              }
            });
          }
          if ( $.isFunction( found ) ) {
            response = found.apply(context, passedArguments);
          }
          else if(found !== undefined) {
            response = found;
          }
          if($.isArray(returnedValue)) {
            returnedValue.push(response);
          }
          else if(returnedValue !== undefined) {
            returnedValue = [returnedValue, response];
          }
          else if(response !== undefined) {
            returnedValue = response;
          }
          return found;
        }
      };

      // ### Determining Intent

      // This is where the actual action occurs.
      //     $('.foo').module('set text', 'Ho hum');
      // If you call a module with a string parameter you are most likely trying to invoke a function
      if(methodInvoked) {
        // Make sure if a method is invoked immediately that it is initialized first
        if(instance === undefined) {
          module.initialize();
        }
        module.invoke(query);
      }
      // if no method call is required we simply initialize the plugin, destroying it if it exists already
      else {
        // when re-initializing an element make sure the previous one is torn down first
        if(instance !== undefined) {
          instance.invoke('destroy');
        }
        module.initialize();
      }
    })
  ;
  return (returnedValue !== undefined)
    ? returnedValue
    : $allModules
  ;
};

// ## Settings
// It is necessary to include a settings object which specifies the defaults for your module
$.fn.example.settings = {

  // ### Required
  // Used in debug statements to refer to the module itself
  name  : 'Example Module',

  // Whether debug content should be outputted to console
  debug       : true,
  // Whether extra debug content should be outputted
  verbose     : false,
  // Whether to track performance data
  performance : false,
  // A unique identifier used to namespace events,and preserve the module instance
  namespace   : 'example',

  // ### Module Specific
  // You may want to include settings specific to your module's function
  text: {
    hover : 'You are hovering me now',
    click : 'You clicked on me'
  },

  // ## Callbacks
  // Callbacks are often useful to include in your settings object. Be sure to use the convention `onName`
  onChange     : function() {},

  // ### Optional

  // Selectors used by your module
  selector    : {
    example : '.example'
  },

  // Regular expressions used by your module
  regExp      : {
    text: /\s\S*/
  },

  // Error messages returned by the module
  error: {
    noText : 'The text you tried to display has not been defined.',
    method : 'The method you called is not defined.'
  },

  // Class names which your module refers to
  className   : {
    disabled : 'disabled'
  },

  // Metadata attributes stored or retrieved by your module. `$('.foo').data('value');`
  metadata: {
    text: 'text'
  },

  // ## Templates
  // If your module needs to generate html structures, be sure to include them as setting templates
  // This will allow users of your module to alter the structure.
  templates: {
    text: function(text) {
      return '<span>' + text + '</span>';
    }
  }

};

})( jQuery, window , document );