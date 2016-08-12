(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var kscope = {};window.kscope = kscope;kscope.keyboardShortcuts = require('modules/keyboardShortcuts');require('widgets/customReport');
},{"modules/keyboardShortcuts":4,"widgets/customReport":6}],2:[function(require,module,exports){
//     keymaster.js
//     (c) 2011-2013 Thomas Fuchs
//     keymaster.js may be freely distributed under the MIT license.

;(function(global){
  var k,
    _handlers = {},
    _mods = { 16: false, 18: false, 17: false, 91: false },
    _scope = 'all',
    // modifier keys
    _MODIFIERS = {
      '⇧': 16, shift: 16,
      '⌥': 18, alt: 18, option: 18,
      '⌃': 17, ctrl: 17, control: 17,
      '⌘': 91, command: 91
    },
    // special keys
    _MAP = {
      backspace: 8, tab: 9, clear: 12,
      enter: 13, 'return': 13,
      esc: 27, escape: 27, space: 32,
      left: 37, up: 38,
      right: 39, down: 40,
      del: 46, 'delete': 46,
      home: 36, end: 35,
      pageup: 33, pagedown: 34,
      ',': 188, '.': 190, '/': 191,
      '`': 192, '-': 189, '=': 187,
      ';': 186, '\'': 222,
      '[': 219, ']': 221, '\\': 220
    },
    code = function(x){
      return _MAP[x] || x.toUpperCase().charCodeAt(0);
    },
    _downKeys = [];

  for(k=1;k<20;k++) _MAP['f'+k] = 111+k;

  // IE doesn't support Array#indexOf, so have a simple replacement
  function index(array, item){
    var i = array.length;
    while(i--) if(array[i]===item) return i;
    return -1;
  }

  // for comparing mods before unassignment
  function compareArray(a1, a2) {
    if (a1.length != a2.length) return false;
    for (var i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) return false;
    }
    return true;
  }

  var modifierMap = {
      16:'shiftKey',
      18:'altKey',
      17:'ctrlKey',
      91:'metaKey'
  };
  function updateModifierKey(event) {
      for(k in _mods) _mods[k] = event[modifierMap[k]];
  };

  // handle keydown event
  function dispatch(event) {
    var key, handler, k, i, modifiersMatch, scope;
    key = event.keyCode;

    if (index(_downKeys, key) == -1) {
        _downKeys.push(key);
    }

    // if a modifier key, set the key.<modifierkeyname> property to true and return
    if(key == 93 || key == 224) key = 91; // right command on webkit, command on Gecko
    if(key in _mods) {
      _mods[key] = true;
      // 'assignKey' from inside this closure is exported to window.key
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = true;
      return;
    }
    updateModifierKey(event);

    // see if we need to ignore the keypress (filter() can can be overridden)
    // by default ignore key presses if a select, textarea, or input is focused
    if(!assignKey.filter.call(this, event)) return;

    // abort if no potentially matching shortcuts found
    if (!(key in _handlers)) return;

    scope = getScope();

    // for each potential shortcut
    for (i = 0; i < _handlers[key].length; i++) {
      handler = _handlers[key][i];

      // see if it's in the current scope
      if(handler.scope == scope || handler.scope == 'all'){
        // check if modifiers match if any
        modifiersMatch = handler.mods.length > 0;
        for(k in _mods)
          if((!_mods[k] && index(handler.mods, +k) > -1) ||
            (_mods[k] && index(handler.mods, +k) == -1)) modifiersMatch = false;
        // call the handler and stop the event if neccessary
        if((handler.mods.length == 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91]) || modifiersMatch){
          if(handler.method(event, handler)===false){
            if(event.preventDefault) event.preventDefault();
              else event.returnValue = false;
            if(event.stopPropagation) event.stopPropagation();
            if(event.cancelBubble) event.cancelBubble = true;
          }
        }
      }
    }
  };

  // unset modifier keys on keyup
  function clearModifier(event){
    var key = event.keyCode, k,
        i = index(_downKeys, key);

    // remove key from _downKeys
    if (i >= 0) {
        _downKeys.splice(i, 1);
    }

    if(key == 93 || key == 224) key = 91;
    if(key in _mods) {
      _mods[key] = false;
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = false;
    }
  };

  function resetModifiers() {
    for(k in _mods) _mods[k] = false;
    for(k in _MODIFIERS) assignKey[k] = false;
  };

  // parse and assign shortcut
  function assignKey(key, scope, method){
    var keys, mods;
    keys = getKeys(key);
    if (method === undefined) {
      method = scope;
      scope = 'all';
    }

    // for each shortcut
    for (var i = 0; i < keys.length; i++) {
      // set modifier keys if any
      mods = [];
      key = keys[i].split('+');
      if (key.length > 1){
        mods = getMods(key);
        key = [key[key.length-1]];
      }
      // convert to keycode and...
      key = key[0]
      key = code(key);
      // ...store handler
      if (!(key in _handlers)) _handlers[key] = [];
      _handlers[key].push({ shortcut: keys[i], scope: scope, method: method, key: keys[i], mods: mods });
    }
  };

  // unbind all handlers for given key in current scope
  function unbindKey(key, scope) {
    var multipleKeys, keys,
      mods = [],
      i, j, obj;

    multipleKeys = getKeys(key);

    for (j = 0; j < multipleKeys.length; j++) {
      keys = multipleKeys[j].split('+');

      if (keys.length > 1) {
        mods = getMods(keys);
        key = keys[keys.length - 1];
      }

      key = code(key);

      if (scope === undefined) {
        scope = getScope();
      }
      if (!_handlers[key]) {
        return;
      }
      for (i = 0; i < _handlers[key].length; i++) {
        obj = _handlers[key][i];
        // only clear handlers if correct scope and mods match
        if (obj.scope === scope && compareArray(obj.mods, mods)) {
          _handlers[key][i] = {};
        }
      }
    }
  };

  // Returns true if the key with code 'keyCode' is currently down
  // Converts strings into key codes.
  function isPressed(keyCode) {
      if (typeof(keyCode)=='string') {
        keyCode = code(keyCode);
      }
      return index(_downKeys, keyCode) != -1;
  }

  function getPressedKeyCodes() {
      return _downKeys.slice(0);
  }

  function filter(event){
    var tagName = (event.target || event.srcElement).tagName;
    // ignore keypressed in any elements that support keyboard data input
    return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
  }

  // initialize key.<modifier> to false
  for(k in _MODIFIERS) assignKey[k] = false;

  // set current scope (default 'all')
  function setScope(scope){ _scope = scope || 'all' };
  function getScope(){ return _scope || 'all' };

  // delete all handlers for a given scope
  function deleteScope(scope){
    var key, handlers, i;

    for (key in _handlers) {
      handlers = _handlers[key];
      for (i = 0; i < handlers.length; ) {
        if (handlers[i].scope === scope) handlers.splice(i, 1);
        else i++;
      }
    }
  };

  // abstract key logic for assign and unassign
  function getKeys(key) {
    var keys;
    key = key.replace(/\s/g, '');
    keys = key.split(',');
    if ((keys[keys.length - 1]) == '') {
      keys[keys.length - 2] += ',';
    }
    return keys;
  }

  // abstract mods logic for assign and unassign
  function getMods(key) {
    var mods = key.slice(0, key.length - 1);
    for (var mi = 0; mi < mods.length; mi++)
    mods[mi] = _MODIFIERS[mods[mi]];
    return mods;
  }

  // cross-browser events
  function addEvent(object, event, method) {
    if (object.addEventListener)
      object.addEventListener(event, method, false);
    else if(object.attachEvent)
      object.attachEvent('on'+event, function(){ method(window.event) });
  };

  // set the handlers globally on document
  addEvent(document, 'keydown', function(event) { dispatch(event) }); // Passing _scope to a callback to ensure it remains the same by execution. Fixes #48
  addEvent(document, 'keyup', clearModifier);

  // reset modifiers to false whenever the window is (re)focused.
  addEvent(window, 'focus', resetModifiers);

  // store previously defined key
  var previousKey = global.key;

  // restore previously defined key and return reference to our key object
  function noConflict() {
    var k = global.key;
    global.key = previousKey;
    return k;
  }

  // set window.key and window.key.set/get/deleteScope, and the default filter
  global.key = assignKey;
  global.key.setScope = setScope;
  global.key.getScope = getScope;
  global.key.deleteScope = deleteScope;
  global.key.filter = filter;
  global.key.isPressed = isPressed;
  global.key.getPressedKeyCodes = getPressedKeyCodes;
  global.key.noConflict = noConflict;
  global.key.unbind = unbindKey;

  if(typeof module !== 'undefined') module.exports = assignKey;

})(this);

},{}],3:[function(require,module,exports){
(function (global){
/*
PNotify 3.0.0 sciactive.com/pnotify/
(C) 2015 Hunter Perrin; Google, Inc.
license Apache-2.0
*/
(function(b,k){"function"===typeof define&&define.amd?define("pnotify",["jquery"],function(q){return k(q,b)}):"object"===typeof exports&&"undefined"!==typeof module?module.exports=k((window.$),global||b):b.PNotify=k(b.jQuery,b)})(this,function(b,k){var q=function(l){var k={dir1:"down",dir2:"left",push:"bottom",spacing1:36,spacing2:36,context:b("body"),modal:!1},g,h,n=b(l),r=function(){h=b("body");d.prototype.options.stack.context=h;n=b(l);n.bind("resize",function(){g&&clearTimeout(g);g=setTimeout(function(){d.positionAll(!0)},
10)})},s=function(c){var a=b("<div />",{"class":"ui-pnotify-modal-overlay"});a.prependTo(c.context);c.overlay_close&&a.click(function(){d.removeStack(c)});return a},d=function(c){this.parseOptions(c);this.init()};b.extend(d.prototype,{version:"3.0.0",options:{title:!1,title_escape:!1,text:!1,text_escape:!1,styling:"brighttheme",addclass:"",cornerclass:"",auto_display:!0,width:"300px",min_height:"16px",type:"notice",icon:!0,animation:"fade",animate_speed:"normal",shadow:!0,hide:!0,delay:8E3,mouse_reset:!0,
remove:!0,insert_brs:!0,destroy:!0,stack:k},modules:{},runModules:function(c,a){var p,b;for(b in this.modules)p="object"===typeof a&&b in a?a[b]:a,"function"===typeof this.modules[b][c]&&(this.modules[b].notice=this,this.modules[b].options="object"===typeof this.options[b]?this.options[b]:{},this.modules[b][c](this,"object"===typeof this.options[b]?this.options[b]:{},p))},state:"initializing",timer:null,animTimer:null,styles:null,elem:null,container:null,title_container:null,text_container:null,animating:!1,
timerHide:!1,init:function(){var c=this;this.modules={};b.extend(!0,this.modules,d.prototype.modules);this.styles="object"===typeof this.options.styling?this.options.styling:d.styling[this.options.styling];this.elem=b("<div />",{"class":"ui-pnotify "+this.options.addclass,css:{display:"none"},"aria-live":"assertive","aria-role":"alertdialog",mouseenter:function(a){if(c.options.mouse_reset&&"out"===c.animating){if(!c.timerHide)return;c.cancelRemove()}c.options.hide&&c.options.mouse_reset&&c.cancelRemove()},
mouseleave:function(a){c.options.hide&&c.options.mouse_reset&&"out"!==c.animating&&c.queueRemove();d.positionAll()}});"fade"===this.options.animation&&this.elem.addClass("ui-pnotify-fade-"+this.options.animate_speed);this.container=b("<div />",{"class":this.styles.container+" ui-pnotify-container "+("error"===this.options.type?this.styles.error:"info"===this.options.type?this.styles.info:"success"===this.options.type?this.styles.success:this.styles.notice),role:"alert"}).appendTo(this.elem);""!==
this.options.cornerclass&&this.container.removeClass("ui-corner-all").addClass(this.options.cornerclass);this.options.shadow&&this.container.addClass("ui-pnotify-shadow");!1!==this.options.icon&&b("<div />",{"class":"ui-pnotify-icon"}).append(b("<span />",{"class":!0===this.options.icon?"error"===this.options.type?this.styles.error_icon:"info"===this.options.type?this.styles.info_icon:"success"===this.options.type?this.styles.success_icon:this.styles.notice_icon:this.options.icon})).prependTo(this.container);
this.title_container=b("<h4 />",{"class":"ui-pnotify-title"}).appendTo(this.container);!1===this.options.title?this.title_container.hide():this.options.title_escape?this.title_container.text(this.options.title):this.title_container.html(this.options.title);this.text_container=b("<div />",{"class":"ui-pnotify-text","aria-role":"alert"}).appendTo(this.container);!1===this.options.text?this.text_container.hide():this.options.text_escape?this.text_container.text(this.options.text):this.text_container.html(this.options.insert_brs?
String(this.options.text).replace(/\n/g,"<br />"):this.options.text);"string"===typeof this.options.width&&this.elem.css("width",this.options.width);"string"===typeof this.options.min_height&&this.container.css("min-height",this.options.min_height);d.notices="top"===this.options.stack.push?b.merge([this],d.notices):b.merge(d.notices,[this]);"top"===this.options.stack.push&&this.queuePosition(!1,1);this.options.stack.animation=!1;this.runModules("init");this.options.auto_display&&this.open();return this},
update:function(c){var a=this.options;this.parseOptions(a,c);this.elem.removeClass("ui-pnotify-fade-slow ui-pnotify-fade-normal ui-pnotify-fade-fast");"fade"===this.options.animation&&this.elem.addClass("ui-pnotify-fade-"+this.options.animate_speed);this.options.cornerclass!==a.cornerclass&&this.container.removeClass("ui-corner-all "+a.cornerclass).addClass(this.options.cornerclass);this.options.shadow!==a.shadow&&(this.options.shadow?this.container.addClass("ui-pnotify-shadow"):this.container.removeClass("ui-pnotify-shadow"));
!1===this.options.addclass?this.elem.removeClass(a.addclass):this.options.addclass!==a.addclass&&this.elem.removeClass(a.addclass).addClass(this.options.addclass);!1===this.options.title?this.title_container.slideUp("fast"):this.options.title!==a.title&&(this.options.title_escape?this.title_container.text(this.options.title):this.title_container.html(this.options.title),!1===a.title&&this.title_container.slideDown(200));!1===this.options.text?this.text_container.slideUp("fast"):this.options.text!==
a.text&&(this.options.text_escape?this.text_container.text(this.options.text):this.text_container.html(this.options.insert_brs?String(this.options.text).replace(/\n/g,"<br />"):this.options.text),!1===a.text&&this.text_container.slideDown(200));this.options.type!==a.type&&this.container.removeClass(this.styles.error+" "+this.styles.notice+" "+this.styles.success+" "+this.styles.info).addClass("error"===this.options.type?this.styles.error:"info"===this.options.type?this.styles.info:"success"===this.options.type?
this.styles.success:this.styles.notice);if(this.options.icon!==a.icon||!0===this.options.icon&&this.options.type!==a.type)this.container.find("div.ui-pnotify-icon").remove(),!1!==this.options.icon&&b("<div />",{"class":"ui-pnotify-icon"}).append(b("<span />",{"class":!0===this.options.icon?"error"===this.options.type?this.styles.error_icon:"info"===this.options.type?this.styles.info_icon:"success"===this.options.type?this.styles.success_icon:this.styles.notice_icon:this.options.icon})).prependTo(this.container);
this.options.width!==a.width&&this.elem.animate({width:this.options.width});this.options.min_height!==a.min_height&&this.container.animate({minHeight:this.options.min_height});this.options.hide?a.hide||this.queueRemove():this.cancelRemove();this.queuePosition(!0);this.runModules("update",a);return this},open:function(){this.state="opening";this.runModules("beforeOpen");var c=this;this.elem.parent().length||this.elem.appendTo(this.options.stack.context?this.options.stack.context:h);"top"!==this.options.stack.push&&
this.position(!0);this.animateIn(function(){c.queuePosition(!0);c.options.hide&&c.queueRemove();c.state="open";c.runModules("afterOpen")});return this},remove:function(c){this.state="closing";this.timerHide=!!c;this.runModules("beforeClose");var a=this;this.timer&&(l.clearTimeout(this.timer),this.timer=null);this.animateOut(function(){a.state="closed";a.runModules("afterClose");a.queuePosition(!0);a.options.remove&&a.elem.detach();a.runModules("beforeDestroy");if(a.options.destroy&&null!==d.notices){var c=
b.inArray(a,d.notices);-1!==c&&d.notices.splice(c,1)}a.runModules("afterDestroy")});return this},get:function(){return this.elem},parseOptions:function(c,a){this.options=b.extend(!0,{},d.prototype.options);this.options.stack=d.prototype.options.stack;for(var p=[c,a],m,f=0;f<p.length;f++){m=p[f];if("undefined"===typeof m)break;if("object"!==typeof m)this.options.text=m;else for(var e in m)this.modules[e]?b.extend(!0,this.options[e],m[e]):this.options[e]=m[e]}},animateIn:function(c){this.animating=
"in";var a=this;c=function(){a.animTimer&&clearTimeout(a.animTimer);"in"===a.animating&&(a.elem.is(":visible")?(this&&this.call(),a.animating=!1):a.animTimer=setTimeout(c,40))}.bind(c);"fade"===this.options.animation?(this.elem.one("webkitTransitionEnd mozTransitionEnd MSTransitionEnd oTransitionEnd transitionend",c).addClass("ui-pnotify-in"),this.elem.css("opacity"),this.elem.addClass("ui-pnotify-fade-in"),this.animTimer=setTimeout(c,650)):(this.elem.addClass("ui-pnotify-in"),c())},animateOut:function(c){this.animating=
"out";var a=this;c=function(){a.animTimer&&clearTimeout(a.animTimer);"out"===a.animating&&("0"!=a.elem.css("opacity")&&a.elem.is(":visible")?a.animTimer=setTimeout(c,40):(a.elem.removeClass("ui-pnotify-in"),this&&this.call(),a.animating=!1))}.bind(c);"fade"===this.options.animation?(this.elem.one("webkitTransitionEnd mozTransitionEnd MSTransitionEnd oTransitionEnd transitionend",c).removeClass("ui-pnotify-fade-in"),this.animTimer=setTimeout(c,650)):(this.elem.removeClass("ui-pnotify-in"),c())},position:function(c){var a=
this.options.stack,b=this.elem;"undefined"===typeof a.context&&(a.context=h);if(a){"number"!==typeof a.nextpos1&&(a.nextpos1=a.firstpos1);"number"!==typeof a.nextpos2&&(a.nextpos2=a.firstpos2);"number"!==typeof a.addpos2&&(a.addpos2=0);var d=!b.hasClass("ui-pnotify-in");if(!d||c){a.modal&&(a.overlay?a.overlay.show():a.overlay=s(a));b.addClass("ui-pnotify-move");var f;switch(a.dir1){case "down":f="top";break;case "up":f="bottom";break;case "left":f="right";break;case "right":f="left"}c=parseInt(b.css(f).replace(/(?:\..*|[^0-9.])/g,
""));isNaN(c)&&(c=0);"undefined"!==typeof a.firstpos1||d||(a.firstpos1=c,a.nextpos1=a.firstpos1);var e;switch(a.dir2){case "down":e="top";break;case "up":e="bottom";break;case "left":e="right";break;case "right":e="left"}c=parseInt(b.css(e).replace(/(?:\..*|[^0-9.])/g,""));isNaN(c)&&(c=0);"undefined"!==typeof a.firstpos2||d||(a.firstpos2=c,a.nextpos2=a.firstpos2);if("down"===a.dir1&&a.nextpos1+b.height()>(a.context.is(h)?n.height():a.context.prop("scrollHeight"))||"up"===a.dir1&&a.nextpos1+b.height()>
(a.context.is(h)?n.height():a.context.prop("scrollHeight"))||"left"===a.dir1&&a.nextpos1+b.width()>(a.context.is(h)?n.width():a.context.prop("scrollWidth"))||"right"===a.dir1&&a.nextpos1+b.width()>(a.context.is(h)?n.width():a.context.prop("scrollWidth")))a.nextpos1=a.firstpos1,a.nextpos2+=a.addpos2+("undefined"===typeof a.spacing2?25:a.spacing2),a.addpos2=0;"number"===typeof a.nextpos2&&(a.animation?b.css(e,a.nextpos2+"px"):(b.removeClass("ui-pnotify-move"),b.css(e,a.nextpos2+"px"),b.css(e),b.addClass("ui-pnotify-move")));
switch(a.dir2){case "down":case "up":b.outerHeight(!0)>a.addpos2&&(a.addpos2=b.height());break;case "left":case "right":b.outerWidth(!0)>a.addpos2&&(a.addpos2=b.width())}"number"===typeof a.nextpos1&&(a.animation?b.css(f,a.nextpos1+"px"):(b.removeClass("ui-pnotify-move"),b.css(f,a.nextpos1+"px"),b.css(f),b.addClass("ui-pnotify-move")));switch(a.dir1){case "down":case "up":a.nextpos1+=b.height()+("undefined"===typeof a.spacing1?25:a.spacing1);break;case "left":case "right":a.nextpos1+=b.width()+("undefined"===
typeof a.spacing1?25:a.spacing1)}}return this}},queuePosition:function(b,a){g&&clearTimeout(g);a||(a=10);g=setTimeout(function(){d.positionAll(b)},a);return this},cancelRemove:function(){this.timer&&l.clearTimeout(this.timer);this.animTimer&&l.clearTimeout(this.animTimer);"closing"===this.state&&(this.state="open",this.animating=!1,this.elem.addClass("ui-pnotify-in"),"fade"===this.options.animation&&this.elem.addClass("ui-pnotify-fade-in"));return this},queueRemove:function(){var b=this;this.cancelRemove();
this.timer=l.setTimeout(function(){b.remove(!0)},isNaN(this.options.delay)?0:this.options.delay);return this}});b.extend(d,{notices:[],reload:q,removeAll:function(){b.each(d.notices,function(){this.remove&&this.remove(!1)})},removeStack:function(c){b.each(d.notices,function(){this.remove&&this.options.stack===c&&this.remove(!1)})},positionAll:function(c){g&&clearTimeout(g);g=null;if(d.notices&&d.notices.length)b.each(d.notices,function(){var a=this.options.stack;a&&(a.overlay&&a.overlay.hide(),a.nextpos1=
a.firstpos1,a.nextpos2=a.firstpos2,a.addpos2=0,a.animation=c)}),b.each(d.notices,function(){this.position()});else{var a=d.prototype.options.stack;a&&(delete a.nextpos1,delete a.nextpos2)}},styling:{brighttheme:{container:"brighttheme",notice:"brighttheme-notice",notice_icon:"brighttheme-icon-notice",info:"brighttheme-info",info_icon:"brighttheme-icon-info",success:"brighttheme-success",success_icon:"brighttheme-icon-success",error:"brighttheme-error",error_icon:"brighttheme-icon-error"},jqueryui:{container:"ui-widget ui-widget-content ui-corner-all",
notice:"ui-state-highlight",notice_icon:"ui-icon ui-icon-info",info:"",info_icon:"ui-icon ui-icon-info",success:"ui-state-default",success_icon:"ui-icon ui-icon-circle-check",error:"ui-state-error",error_icon:"ui-icon ui-icon-alert"},bootstrap3:{container:"alert",notice:"alert-warning",notice_icon:"glyphicon glyphicon-exclamation-sign",info:"alert-info",info_icon:"glyphicon glyphicon-info-sign",success:"alert-success",success_icon:"glyphicon glyphicon-ok-sign",error:"alert-danger",error_icon:"glyphicon glyphicon-warning-sign"}}});
d.styling.fontawesome=b.extend({},d.styling.bootstrap3);b.extend(d.styling.fontawesome,{notice_icon:"fa fa-exclamation-circle",info_icon:"fa fa-info",success_icon:"fa fa-check",error_icon:"fa fa-warning"});l.document.body?r():b(r);return d};return q(k)});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],4:[function(require,module,exports){
var key = require("keymaster");
var message = require("modules/message");

// Add shortcut coe
var _addShortcut = function(selectedKey,cb) {
  key(selectedKey, cb);
}

var _clickButton = function(selector) {
  $(selector).trigger('click');
  return false;
}

// Add shortcuts for selectors
var defaultShortcuts = function() {
  _addShortcut('ctrl+s', function(event,handler){
    _clickButton('.t-Button[onclick*="\'CREATE\'"],.t-Button#CREATE');
  });
  _addShortcut('ctrl+s', function(event,handler){
    _clickButton('.t-Button[onclick*="\'SAVE\'"],.t-Button#SAVE');
  });
  _addShortcut('ctrl+d', function(event,handler){
    _clickButton('.t-Button[onclick*="\'DELETE\'"],.t-Button#DELETE');
  });
  _addShortcut('ctrl+m', function(event,handler){
    message.info({
      title: "A key was pressed",
      text: "ctrl+m"
    });
  });
};

module.exports = {
  defaultShortcuts: defaultShortcuts
}

},{"keymaster":2,"modules/message":5}],5:[function(require,module,exports){
var $ = (window.$); // being shimmed
var PNotify = require("pnotify");


// Button defaults
var defaults = {
  hide: false,
  closer: true,
  buttons: {
    closer_hover: false,
    sticker: false,
    labels: {
      close: 'Sluit melding'
    }
  }
};


var getSettings = function(options) {

  switch (typeof options) {
    case "string":
      return $.extend({
        title: options
      }, defaults);
    case "object":
      return $.extend(options, defaults);
    default:
      return defaults;
  };

};

var info = function(options) {
  return new PNotify($.extend(getSettings(options), {
    type: 'info',
    hide: true
  }));
};

var success = function(options) {
  return new PNotify($.extend(getSettings(options), {
    type: 'success',
    hide: true
  }));
};

var warning = function(options) {
  return new PNotify($.extend(getSettings(options), {
    type: 'warning'
  }));
};

var error = function(options) {
  return new PNotify($.extend(getSettings(options), {
    type: 'error'
  }));
};

module.exports = {
  info: info,
  success: success,
  warning: warning,
  error: error
};

},{"pnotify":3}],6:[function(require,module,exports){
$.widget("custom.customReport", {
  options: {
    exceptClass: 'no-row-link',
    activeClass: 'active',
    columns: [],
    rowclick: function(e, data) {
      $(this).customReport('openLink', e);
    }
  },

  _create: function() {
    var self = this;
    // Check if report may have a row link
    if (this._rowLinkAllowed) {
      this._initRowClick();
    }

    $(this.element).on('apexafterrefresh',function(e){
      self._apexafterrefresh();
    });

  },

  _apexafterrefresh: function() {
    // Check if report may have a row link
    if (this._rowLinkAllowed) {
      this._initRowClick();
    }
  },

  _initRowClick: function(cb) {

    var self = this;
    var data;
    cb = $.proxy(cb, self);

    // Remove previous handlers
    this._off(this.element, 'click tr td:not(:has(a))');
    this._off(this.element, 'hover tr td:not(:has(a))');

    // Add new handler
    this._on(this.element, {
      'mouseenter tr td:not(:has(a))': function(e) {
        $(e.target).css('cursor', 'pointer');
      }
    });

    // Add new handler
    this._on(this.element, {
      'click tr td:not(:has(a))': function(e) {
        self._trigger('rowclick', e, data);
        e.stopImmediatePropagation();
      }
    });

  },

  // Use an a href value to redirect on row click in report
  openLink: function(event, options) {

    var self = this;

    var defaults = {
      aPos: 0 // which "a" element contains the link
    }

    var settings = $.extend(options, defaults);

    // Get link
    var $linkElem = self._getLinkElement(settings, event.currentTarget);
    var href = $linkElem.attr('href');

    if (href != undefined) {
      window.location.href = href;
    }
  },

  _getLinkElement: function(options, target) {

    var links = $(target).closest('tr').find('td:has(a)');

    // Raise exception if position of a element is invalid
    if (links.length < options.aPos) {
      apex.debug.error('Exception: ', options.aPos + 'th "a" element is not found in report row.');
    } else {
      return $(links[options.aPos]).find('a');
    }

  },

  // _rowLinkAllowed returns boolean
  _rowLinkAllowed: function() {
    return !$(this.element).hasClass(this.options.exceptClass);
  },

  _setActiveRow: function($row) {
    $($row).closest('table').find('td.'+this.options.activeClass).removeClass(this.options.activeClass);
    $($row).find('td').addClass(this.options.activeClass);
  },

  activeRow: function() {
    return $(this.element).find('td.'+this.options.activeClass).closest('tr');
  }

});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJfc3RyZWFtXzAuanMiLCJub2RlX21vZHVsZXMva2V5bWFzdGVyL2tleW1hc3Rlci5qcyIsIm5vZGVfbW9kdWxlcy9wbm90aWZ5L2Rpc3QvcG5vdGlmeS5qcyIsInNyYy9qcy9tb2R1bGVzL2tleWJvYXJkU2hvcnRjdXRzLmpzIiwic3JjL2pzL21vZHVsZXMvbWVzc2FnZS5qcyIsInNyYy9qcy93aWRnZXRzL2N1c3RvbVJlcG9ydC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBrc2NvcGUgPSB7fTt3aW5kb3cua3Njb3BlID0ga3Njb3BlO2tzY29wZS5rZXlib2FyZFNob3J0Y3V0cyA9IHJlcXVpcmUoJ21vZHVsZXMva2V5Ym9hcmRTaG9ydGN1dHMnKTtyZXF1aXJlKCd3aWRnZXRzL2N1c3RvbVJlcG9ydCcpOyIsIi8vICAgICBrZXltYXN0ZXIuanNcbi8vICAgICAoYykgMjAxMS0yMDEzIFRob21hcyBGdWNoc1xuLy8gICAgIGtleW1hc3Rlci5qcyBtYXkgYmUgZnJlZWx5IGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuOyhmdW5jdGlvbihnbG9iYWwpe1xuICB2YXIgayxcbiAgICBfaGFuZGxlcnMgPSB7fSxcbiAgICBfbW9kcyA9IHsgMTY6IGZhbHNlLCAxODogZmFsc2UsIDE3OiBmYWxzZSwgOTE6IGZhbHNlIH0sXG4gICAgX3Njb3BlID0gJ2FsbCcsXG4gICAgLy8gbW9kaWZpZXIga2V5c1xuICAgIF9NT0RJRklFUlMgPSB7XG4gICAgICAn4oenJzogMTYsIHNoaWZ0OiAxNixcbiAgICAgICfijKUnOiAxOCwgYWx0OiAxOCwgb3B0aW9uOiAxOCxcbiAgICAgICfijIMnOiAxNywgY3RybDogMTcsIGNvbnRyb2w6IDE3LFxuICAgICAgJ+KMmCc6IDkxLCBjb21tYW5kOiA5MVxuICAgIH0sXG4gICAgLy8gc3BlY2lhbCBrZXlzXG4gICAgX01BUCA9IHtcbiAgICAgIGJhY2tzcGFjZTogOCwgdGFiOiA5LCBjbGVhcjogMTIsXG4gICAgICBlbnRlcjogMTMsICdyZXR1cm4nOiAxMyxcbiAgICAgIGVzYzogMjcsIGVzY2FwZTogMjcsIHNwYWNlOiAzMixcbiAgICAgIGxlZnQ6IDM3LCB1cDogMzgsXG4gICAgICByaWdodDogMzksIGRvd246IDQwLFxuICAgICAgZGVsOiA0NiwgJ2RlbGV0ZSc6IDQ2LFxuICAgICAgaG9tZTogMzYsIGVuZDogMzUsXG4gICAgICBwYWdldXA6IDMzLCBwYWdlZG93bjogMzQsXG4gICAgICAnLCc6IDE4OCwgJy4nOiAxOTAsICcvJzogMTkxLFxuICAgICAgJ2AnOiAxOTIsICctJzogMTg5LCAnPSc6IDE4NyxcbiAgICAgICc7JzogMTg2LCAnXFwnJzogMjIyLFxuICAgICAgJ1snOiAyMTksICddJzogMjIxLCAnXFxcXCc6IDIyMFxuICAgIH0sXG4gICAgY29kZSA9IGZ1bmN0aW9uKHgpe1xuICAgICAgcmV0dXJuIF9NQVBbeF0gfHwgeC50b1VwcGVyQ2FzZSgpLmNoYXJDb2RlQXQoMCk7XG4gICAgfSxcbiAgICBfZG93bktleXMgPSBbXTtcblxuICBmb3Ioaz0xO2s8MjA7aysrKSBfTUFQWydmJytrXSA9IDExMStrO1xuXG4gIC8vIElFIGRvZXNuJ3Qgc3VwcG9ydCBBcnJheSNpbmRleE9mLCBzbyBoYXZlIGEgc2ltcGxlIHJlcGxhY2VtZW50XG4gIGZ1bmN0aW9uIGluZGV4KGFycmF5LCBpdGVtKXtcbiAgICB2YXIgaSA9IGFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZShpLS0pIGlmKGFycmF5W2ldPT09aXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgLy8gZm9yIGNvbXBhcmluZyBtb2RzIGJlZm9yZSB1bmFzc2lnbm1lbnRcbiAgZnVuY3Rpb24gY29tcGFyZUFycmF5KGExLCBhMikge1xuICAgIGlmIChhMS5sZW5ndGggIT0gYTIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhMS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYTFbaV0gIT09IGEyW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdmFyIG1vZGlmaWVyTWFwID0ge1xuICAgICAgMTY6J3NoaWZ0S2V5JyxcbiAgICAgIDE4OidhbHRLZXknLFxuICAgICAgMTc6J2N0cmxLZXknLFxuICAgICAgOTE6J21ldGFLZXknXG4gIH07XG4gIGZ1bmN0aW9uIHVwZGF0ZU1vZGlmaWVyS2V5KGV2ZW50KSB7XG4gICAgICBmb3IoayBpbiBfbW9kcykgX21vZHNba10gPSBldmVudFttb2RpZmllck1hcFtrXV07XG4gIH07XG5cbiAgLy8gaGFuZGxlIGtleWRvd24gZXZlbnRcbiAgZnVuY3Rpb24gZGlzcGF0Y2goZXZlbnQpIHtcbiAgICB2YXIga2V5LCBoYW5kbGVyLCBrLCBpLCBtb2RpZmllcnNNYXRjaCwgc2NvcGU7XG4gICAga2V5ID0gZXZlbnQua2V5Q29kZTtcblxuICAgIGlmIChpbmRleChfZG93bktleXMsIGtleSkgPT0gLTEpIHtcbiAgICAgICAgX2Rvd25LZXlzLnB1c2goa2V5KTtcbiAgICB9XG5cbiAgICAvLyBpZiBhIG1vZGlmaWVyIGtleSwgc2V0IHRoZSBrZXkuPG1vZGlmaWVya2V5bmFtZT4gcHJvcGVydHkgdG8gdHJ1ZSBhbmQgcmV0dXJuXG4gICAgaWYoa2V5ID09IDkzIHx8IGtleSA9PSAyMjQpIGtleSA9IDkxOyAvLyByaWdodCBjb21tYW5kIG9uIHdlYmtpdCwgY29tbWFuZCBvbiBHZWNrb1xuICAgIGlmKGtleSBpbiBfbW9kcykge1xuICAgICAgX21vZHNba2V5XSA9IHRydWU7XG4gICAgICAvLyAnYXNzaWduS2V5JyBmcm9tIGluc2lkZSB0aGlzIGNsb3N1cmUgaXMgZXhwb3J0ZWQgdG8gd2luZG93LmtleVxuICAgICAgZm9yKGsgaW4gX01PRElGSUVSUykgaWYoX01PRElGSUVSU1trXSA9PSBrZXkpIGFzc2lnbktleVtrXSA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHVwZGF0ZU1vZGlmaWVyS2V5KGV2ZW50KTtcblxuICAgIC8vIHNlZSBpZiB3ZSBuZWVkIHRvIGlnbm9yZSB0aGUga2V5cHJlc3MgKGZpbHRlcigpIGNhbiBjYW4gYmUgb3ZlcnJpZGRlbilcbiAgICAvLyBieSBkZWZhdWx0IGlnbm9yZSBrZXkgcHJlc3NlcyBpZiBhIHNlbGVjdCwgdGV4dGFyZWEsIG9yIGlucHV0IGlzIGZvY3VzZWRcbiAgICBpZighYXNzaWduS2V5LmZpbHRlci5jYWxsKHRoaXMsIGV2ZW50KSkgcmV0dXJuO1xuXG4gICAgLy8gYWJvcnQgaWYgbm8gcG90ZW50aWFsbHkgbWF0Y2hpbmcgc2hvcnRjdXRzIGZvdW5kXG4gICAgaWYgKCEoa2V5IGluIF9oYW5kbGVycykpIHJldHVybjtcblxuICAgIHNjb3BlID0gZ2V0U2NvcGUoKTtcblxuICAgIC8vIGZvciBlYWNoIHBvdGVudGlhbCBzaG9ydGN1dFxuICAgIGZvciAoaSA9IDA7IGkgPCBfaGFuZGxlcnNba2V5XS5sZW5ndGg7IGkrKykge1xuICAgICAgaGFuZGxlciA9IF9oYW5kbGVyc1trZXldW2ldO1xuXG4gICAgICAvLyBzZWUgaWYgaXQncyBpbiB0aGUgY3VycmVudCBzY29wZVxuICAgICAgaWYoaGFuZGxlci5zY29wZSA9PSBzY29wZSB8fCBoYW5kbGVyLnNjb3BlID09ICdhbGwnKXtcbiAgICAgICAgLy8gY2hlY2sgaWYgbW9kaWZpZXJzIG1hdGNoIGlmIGFueVxuICAgICAgICBtb2RpZmllcnNNYXRjaCA9IGhhbmRsZXIubW9kcy5sZW5ndGggPiAwO1xuICAgICAgICBmb3IoayBpbiBfbW9kcylcbiAgICAgICAgICBpZigoIV9tb2RzW2tdICYmIGluZGV4KGhhbmRsZXIubW9kcywgK2spID4gLTEpIHx8XG4gICAgICAgICAgICAoX21vZHNba10gJiYgaW5kZXgoaGFuZGxlci5tb2RzLCAraykgPT0gLTEpKSBtb2RpZmllcnNNYXRjaCA9IGZhbHNlO1xuICAgICAgICAvLyBjYWxsIHRoZSBoYW5kbGVyIGFuZCBzdG9wIHRoZSBldmVudCBpZiBuZWNjZXNzYXJ5XG4gICAgICAgIGlmKChoYW5kbGVyLm1vZHMubGVuZ3RoID09IDAgJiYgIV9tb2RzWzE2XSAmJiAhX21vZHNbMThdICYmICFfbW9kc1sxN10gJiYgIV9tb2RzWzkxXSkgfHwgbW9kaWZpZXJzTWF0Y2gpe1xuICAgICAgICAgIGlmKGhhbmRsZXIubWV0aG9kKGV2ZW50LCBoYW5kbGVyKT09PWZhbHNlKXtcbiAgICAgICAgICAgIGlmKGV2ZW50LnByZXZlbnREZWZhdWx0KSBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICBlbHNlIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICBpZihldmVudC5zdG9wUHJvcGFnYXRpb24pIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgaWYoZXZlbnQuY2FuY2VsQnViYmxlKSBldmVudC5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyB1bnNldCBtb2RpZmllciBrZXlzIG9uIGtleXVwXG4gIGZ1bmN0aW9uIGNsZWFyTW9kaWZpZXIoZXZlbnQpe1xuICAgIHZhciBrZXkgPSBldmVudC5rZXlDb2RlLCBrLFxuICAgICAgICBpID0gaW5kZXgoX2Rvd25LZXlzLCBrZXkpO1xuXG4gICAgLy8gcmVtb3ZlIGtleSBmcm9tIF9kb3duS2V5c1xuICAgIGlmIChpID49IDApIHtcbiAgICAgICAgX2Rvd25LZXlzLnNwbGljZShpLCAxKTtcbiAgICB9XG5cbiAgICBpZihrZXkgPT0gOTMgfHwga2V5ID09IDIyNCkga2V5ID0gOTE7XG4gICAgaWYoa2V5IGluIF9tb2RzKSB7XG4gICAgICBfbW9kc1trZXldID0gZmFsc2U7XG4gICAgICBmb3IoayBpbiBfTU9ESUZJRVJTKSBpZihfTU9ESUZJRVJTW2tdID09IGtleSkgYXNzaWduS2V5W2tdID0gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHJlc2V0TW9kaWZpZXJzKCkge1xuICAgIGZvcihrIGluIF9tb2RzKSBfbW9kc1trXSA9IGZhbHNlO1xuICAgIGZvcihrIGluIF9NT0RJRklFUlMpIGFzc2lnbktleVtrXSA9IGZhbHNlO1xuICB9O1xuXG4gIC8vIHBhcnNlIGFuZCBhc3NpZ24gc2hvcnRjdXRcbiAgZnVuY3Rpb24gYXNzaWduS2V5KGtleSwgc2NvcGUsIG1ldGhvZCl7XG4gICAgdmFyIGtleXMsIG1vZHM7XG4gICAga2V5cyA9IGdldEtleXMoa2V5KTtcbiAgICBpZiAobWV0aG9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG1ldGhvZCA9IHNjb3BlO1xuICAgICAgc2NvcGUgPSAnYWxsJztcbiAgICB9XG5cbiAgICAvLyBmb3IgZWFjaCBzaG9ydGN1dFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gc2V0IG1vZGlmaWVyIGtleXMgaWYgYW55XG4gICAgICBtb2RzID0gW107XG4gICAgICBrZXkgPSBrZXlzW2ldLnNwbGl0KCcrJyk7XG4gICAgICBpZiAoa2V5Lmxlbmd0aCA+IDEpe1xuICAgICAgICBtb2RzID0gZ2V0TW9kcyhrZXkpO1xuICAgICAgICBrZXkgPSBba2V5W2tleS5sZW5ndGgtMV1dO1xuICAgICAgfVxuICAgICAgLy8gY29udmVydCB0byBrZXljb2RlIGFuZC4uLlxuICAgICAga2V5ID0ga2V5WzBdXG4gICAgICBrZXkgPSBjb2RlKGtleSk7XG4gICAgICAvLyAuLi5zdG9yZSBoYW5kbGVyXG4gICAgICBpZiAoIShrZXkgaW4gX2hhbmRsZXJzKSkgX2hhbmRsZXJzW2tleV0gPSBbXTtcbiAgICAgIF9oYW5kbGVyc1trZXldLnB1c2goeyBzaG9ydGN1dDoga2V5c1tpXSwgc2NvcGU6IHNjb3BlLCBtZXRob2Q6IG1ldGhvZCwga2V5OiBrZXlzW2ldLCBtb2RzOiBtb2RzIH0pO1xuICAgIH1cbiAgfTtcblxuICAvLyB1bmJpbmQgYWxsIGhhbmRsZXJzIGZvciBnaXZlbiBrZXkgaW4gY3VycmVudCBzY29wZVxuICBmdW5jdGlvbiB1bmJpbmRLZXkoa2V5LCBzY29wZSkge1xuICAgIHZhciBtdWx0aXBsZUtleXMsIGtleXMsXG4gICAgICBtb2RzID0gW10sXG4gICAgICBpLCBqLCBvYmo7XG5cbiAgICBtdWx0aXBsZUtleXMgPSBnZXRLZXlzKGtleSk7XG5cbiAgICBmb3IgKGogPSAwOyBqIDwgbXVsdGlwbGVLZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICBrZXlzID0gbXVsdGlwbGVLZXlzW2pdLnNwbGl0KCcrJyk7XG5cbiAgICAgIGlmIChrZXlzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgbW9kcyA9IGdldE1vZHMoa2V5cyk7XG4gICAgICAgIGtleSA9IGtleXNba2V5cy5sZW5ndGggLSAxXTtcbiAgICAgIH1cblxuICAgICAga2V5ID0gY29kZShrZXkpO1xuXG4gICAgICBpZiAoc2NvcGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzY29wZSA9IGdldFNjb3BlKCk7XG4gICAgICB9XG4gICAgICBpZiAoIV9oYW5kbGVyc1trZXldKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBfaGFuZGxlcnNba2V5XS5sZW5ndGg7IGkrKykge1xuICAgICAgICBvYmogPSBfaGFuZGxlcnNba2V5XVtpXTtcbiAgICAgICAgLy8gb25seSBjbGVhciBoYW5kbGVycyBpZiBjb3JyZWN0IHNjb3BlIGFuZCBtb2RzIG1hdGNoXG4gICAgICAgIGlmIChvYmouc2NvcGUgPT09IHNjb3BlICYmIGNvbXBhcmVBcnJheShvYmoubW9kcywgbW9kcykpIHtcbiAgICAgICAgICBfaGFuZGxlcnNba2V5XVtpXSA9IHt9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybnMgdHJ1ZSBpZiB0aGUga2V5IHdpdGggY29kZSAna2V5Q29kZScgaXMgY3VycmVudGx5IGRvd25cbiAgLy8gQ29udmVydHMgc3RyaW5ncyBpbnRvIGtleSBjb2Rlcy5cbiAgZnVuY3Rpb24gaXNQcmVzc2VkKGtleUNvZGUpIHtcbiAgICAgIGlmICh0eXBlb2Yoa2V5Q29kZSk9PSdzdHJpbmcnKSB7XG4gICAgICAgIGtleUNvZGUgPSBjb2RlKGtleUNvZGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGluZGV4KF9kb3duS2V5cywga2V5Q29kZSkgIT0gLTE7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRQcmVzc2VkS2V5Q29kZXMoKSB7XG4gICAgICByZXR1cm4gX2Rvd25LZXlzLnNsaWNlKDApO1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyKGV2ZW50KXtcbiAgICB2YXIgdGFnTmFtZSA9IChldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudCkudGFnTmFtZTtcbiAgICAvLyBpZ25vcmUga2V5cHJlc3NlZCBpbiBhbnkgZWxlbWVudHMgdGhhdCBzdXBwb3J0IGtleWJvYXJkIGRhdGEgaW5wdXRcbiAgICByZXR1cm4gISh0YWdOYW1lID09ICdJTlBVVCcgfHwgdGFnTmFtZSA9PSAnU0VMRUNUJyB8fCB0YWdOYW1lID09ICdURVhUQVJFQScpO1xuICB9XG5cbiAgLy8gaW5pdGlhbGl6ZSBrZXkuPG1vZGlmaWVyPiB0byBmYWxzZVxuICBmb3IoayBpbiBfTU9ESUZJRVJTKSBhc3NpZ25LZXlba10gPSBmYWxzZTtcblxuICAvLyBzZXQgY3VycmVudCBzY29wZSAoZGVmYXVsdCAnYWxsJylcbiAgZnVuY3Rpb24gc2V0U2NvcGUoc2NvcGUpeyBfc2NvcGUgPSBzY29wZSB8fCAnYWxsJyB9O1xuICBmdW5jdGlvbiBnZXRTY29wZSgpeyByZXR1cm4gX3Njb3BlIHx8ICdhbGwnIH07XG5cbiAgLy8gZGVsZXRlIGFsbCBoYW5kbGVycyBmb3IgYSBnaXZlbiBzY29wZVxuICBmdW5jdGlvbiBkZWxldGVTY29wZShzY29wZSl7XG4gICAgdmFyIGtleSwgaGFuZGxlcnMsIGk7XG5cbiAgICBmb3IgKGtleSBpbiBfaGFuZGxlcnMpIHtcbiAgICAgIGhhbmRsZXJzID0gX2hhbmRsZXJzW2tleV07XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyApIHtcbiAgICAgICAgaWYgKGhhbmRsZXJzW2ldLnNjb3BlID09PSBzY29wZSkgaGFuZGxlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBlbHNlIGkrKztcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gYWJzdHJhY3Qga2V5IGxvZ2ljIGZvciBhc3NpZ24gYW5kIHVuYXNzaWduXG4gIGZ1bmN0aW9uIGdldEtleXMoa2V5KSB7XG4gICAgdmFyIGtleXM7XG4gICAga2V5ID0ga2V5LnJlcGxhY2UoL1xccy9nLCAnJyk7XG4gICAga2V5cyA9IGtleS5zcGxpdCgnLCcpO1xuICAgIGlmICgoa2V5c1trZXlzLmxlbmd0aCAtIDFdKSA9PSAnJykge1xuICAgICAga2V5c1trZXlzLmxlbmd0aCAtIDJdICs9ICcsJztcbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICAvLyBhYnN0cmFjdCBtb2RzIGxvZ2ljIGZvciBhc3NpZ24gYW5kIHVuYXNzaWduXG4gIGZ1bmN0aW9uIGdldE1vZHMoa2V5KSB7XG4gICAgdmFyIG1vZHMgPSBrZXkuc2xpY2UoMCwga2V5Lmxlbmd0aCAtIDEpO1xuICAgIGZvciAodmFyIG1pID0gMDsgbWkgPCBtb2RzLmxlbmd0aDsgbWkrKylcbiAgICBtb2RzW21pXSA9IF9NT0RJRklFUlNbbW9kc1ttaV1dO1xuICAgIHJldHVybiBtb2RzO1xuICB9XG5cbiAgLy8gY3Jvc3MtYnJvd3NlciBldmVudHNcbiAgZnVuY3Rpb24gYWRkRXZlbnQob2JqZWN0LCBldmVudCwgbWV0aG9kKSB7XG4gICAgaWYgKG9iamVjdC5hZGRFdmVudExpc3RlbmVyKVxuICAgICAgb2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIG1ldGhvZCwgZmFsc2UpO1xuICAgIGVsc2UgaWYob2JqZWN0LmF0dGFjaEV2ZW50KVxuICAgICAgb2JqZWN0LmF0dGFjaEV2ZW50KCdvbicrZXZlbnQsIGZ1bmN0aW9uKCl7IG1ldGhvZCh3aW5kb3cuZXZlbnQpIH0pO1xuICB9O1xuXG4gIC8vIHNldCB0aGUgaGFuZGxlcnMgZ2xvYmFsbHkgb24gZG9jdW1lbnRcbiAgYWRkRXZlbnQoZG9jdW1lbnQsICdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHsgZGlzcGF0Y2goZXZlbnQpIH0pOyAvLyBQYXNzaW5nIF9zY29wZSB0byBhIGNhbGxiYWNrIHRvIGVuc3VyZSBpdCByZW1haW5zIHRoZSBzYW1lIGJ5IGV4ZWN1dGlvbi4gRml4ZXMgIzQ4XG4gIGFkZEV2ZW50KGRvY3VtZW50LCAna2V5dXAnLCBjbGVhck1vZGlmaWVyKTtcblxuICAvLyByZXNldCBtb2RpZmllcnMgdG8gZmFsc2Ugd2hlbmV2ZXIgdGhlIHdpbmRvdyBpcyAocmUpZm9jdXNlZC5cbiAgYWRkRXZlbnQod2luZG93LCAnZm9jdXMnLCByZXNldE1vZGlmaWVycyk7XG5cbiAgLy8gc3RvcmUgcHJldmlvdXNseSBkZWZpbmVkIGtleVxuICB2YXIgcHJldmlvdXNLZXkgPSBnbG9iYWwua2V5O1xuXG4gIC8vIHJlc3RvcmUgcHJldmlvdXNseSBkZWZpbmVkIGtleSBhbmQgcmV0dXJuIHJlZmVyZW5jZSB0byBvdXIga2V5IG9iamVjdFxuICBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuICAgIHZhciBrID0gZ2xvYmFsLmtleTtcbiAgICBnbG9iYWwua2V5ID0gcHJldmlvdXNLZXk7XG4gICAgcmV0dXJuIGs7XG4gIH1cblxuICAvLyBzZXQgd2luZG93LmtleSBhbmQgd2luZG93LmtleS5zZXQvZ2V0L2RlbGV0ZVNjb3BlLCBhbmQgdGhlIGRlZmF1bHQgZmlsdGVyXG4gIGdsb2JhbC5rZXkgPSBhc3NpZ25LZXk7XG4gIGdsb2JhbC5rZXkuc2V0U2NvcGUgPSBzZXRTY29wZTtcbiAgZ2xvYmFsLmtleS5nZXRTY29wZSA9IGdldFNjb3BlO1xuICBnbG9iYWwua2V5LmRlbGV0ZVNjb3BlID0gZGVsZXRlU2NvcGU7XG4gIGdsb2JhbC5rZXkuZmlsdGVyID0gZmlsdGVyO1xuICBnbG9iYWwua2V5LmlzUHJlc3NlZCA9IGlzUHJlc3NlZDtcbiAgZ2xvYmFsLmtleS5nZXRQcmVzc2VkS2V5Q29kZXMgPSBnZXRQcmVzc2VkS2V5Q29kZXM7XG4gIGdsb2JhbC5rZXkubm9Db25mbGljdCA9IG5vQ29uZmxpY3Q7XG4gIGdsb2JhbC5rZXkudW5iaW5kID0gdW5iaW5kS2V5O1xuXG4gIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSBtb2R1bGUuZXhwb3J0cyA9IGFzc2lnbktleTtcblxufSkodGhpcyk7XG4iLCIvKlxuUE5vdGlmeSAzLjAuMCBzY2lhY3RpdmUuY29tL3Bub3RpZnkvXG4oQykgMjAxNSBIdW50ZXIgUGVycmluOyBHb29nbGUsIEluYy5cbmxpY2Vuc2UgQXBhY2hlLTIuMFxuKi9cbihmdW5jdGlvbihiLGspe1wiZnVuY3Rpb25cIj09PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQ/ZGVmaW5lKFwicG5vdGlmeVwiLFtcImpxdWVyeVwiXSxmdW5jdGlvbihxKXtyZXR1cm4gayhxLGIpfSk6XCJvYmplY3RcIj09PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT09dHlwZW9mIG1vZHVsZT9tb2R1bGUuZXhwb3J0cz1rKCh3aW5kb3cuJCksZ2xvYmFsfHxiKTpiLlBOb3RpZnk9ayhiLmpRdWVyeSxiKX0pKHRoaXMsZnVuY3Rpb24oYixrKXt2YXIgcT1mdW5jdGlvbihsKXt2YXIgaz17ZGlyMTpcImRvd25cIixkaXIyOlwibGVmdFwiLHB1c2g6XCJib3R0b21cIixzcGFjaW5nMTozNixzcGFjaW5nMjozNixjb250ZXh0OmIoXCJib2R5XCIpLG1vZGFsOiExfSxnLGgsbj1iKGwpLHI9ZnVuY3Rpb24oKXtoPWIoXCJib2R5XCIpO2QucHJvdG90eXBlLm9wdGlvbnMuc3RhY2suY29udGV4dD1oO249YihsKTtuLmJpbmQoXCJyZXNpemVcIixmdW5jdGlvbigpe2cmJmNsZWFyVGltZW91dChnKTtnPXNldFRpbWVvdXQoZnVuY3Rpb24oKXtkLnBvc2l0aW9uQWxsKCEwKX0sXG4xMCl9KX0scz1mdW5jdGlvbihjKXt2YXIgYT1iKFwiPGRpdiAvPlwiLHtcImNsYXNzXCI6XCJ1aS1wbm90aWZ5LW1vZGFsLW92ZXJsYXlcIn0pO2EucHJlcGVuZFRvKGMuY29udGV4dCk7Yy5vdmVybGF5X2Nsb3NlJiZhLmNsaWNrKGZ1bmN0aW9uKCl7ZC5yZW1vdmVTdGFjayhjKX0pO3JldHVybiBhfSxkPWZ1bmN0aW9uKGMpe3RoaXMucGFyc2VPcHRpb25zKGMpO3RoaXMuaW5pdCgpfTtiLmV4dGVuZChkLnByb3RvdHlwZSx7dmVyc2lvbjpcIjMuMC4wXCIsb3B0aW9uczp7dGl0bGU6ITEsdGl0bGVfZXNjYXBlOiExLHRleHQ6ITEsdGV4dF9lc2NhcGU6ITEsc3R5bGluZzpcImJyaWdodHRoZW1lXCIsYWRkY2xhc3M6XCJcIixjb3JuZXJjbGFzczpcIlwiLGF1dG9fZGlzcGxheTohMCx3aWR0aDpcIjMwMHB4XCIsbWluX2hlaWdodDpcIjE2cHhcIix0eXBlOlwibm90aWNlXCIsaWNvbjohMCxhbmltYXRpb246XCJmYWRlXCIsYW5pbWF0ZV9zcGVlZDpcIm5vcm1hbFwiLHNoYWRvdzohMCxoaWRlOiEwLGRlbGF5OjhFMyxtb3VzZV9yZXNldDohMCxcbnJlbW92ZTohMCxpbnNlcnRfYnJzOiEwLGRlc3Ryb3k6ITAsc3RhY2s6a30sbW9kdWxlczp7fSxydW5Nb2R1bGVzOmZ1bmN0aW9uKGMsYSl7dmFyIHAsYjtmb3IoYiBpbiB0aGlzLm1vZHVsZXMpcD1cIm9iamVjdFwiPT09dHlwZW9mIGEmJmIgaW4gYT9hW2JdOmEsXCJmdW5jdGlvblwiPT09dHlwZW9mIHRoaXMubW9kdWxlc1tiXVtjXSYmKHRoaXMubW9kdWxlc1tiXS5ub3RpY2U9dGhpcyx0aGlzLm1vZHVsZXNbYl0ub3B0aW9ucz1cIm9iamVjdFwiPT09dHlwZW9mIHRoaXMub3B0aW9uc1tiXT90aGlzLm9wdGlvbnNbYl06e30sdGhpcy5tb2R1bGVzW2JdW2NdKHRoaXMsXCJvYmplY3RcIj09PXR5cGVvZiB0aGlzLm9wdGlvbnNbYl0/dGhpcy5vcHRpb25zW2JdOnt9LHApKX0sc3RhdGU6XCJpbml0aWFsaXppbmdcIix0aW1lcjpudWxsLGFuaW1UaW1lcjpudWxsLHN0eWxlczpudWxsLGVsZW06bnVsbCxjb250YWluZXI6bnVsbCx0aXRsZV9jb250YWluZXI6bnVsbCx0ZXh0X2NvbnRhaW5lcjpudWxsLGFuaW1hdGluZzohMSxcbnRpbWVySGlkZTohMSxpbml0OmZ1bmN0aW9uKCl7dmFyIGM9dGhpczt0aGlzLm1vZHVsZXM9e307Yi5leHRlbmQoITAsdGhpcy5tb2R1bGVzLGQucHJvdG90eXBlLm1vZHVsZXMpO3RoaXMuc3R5bGVzPVwib2JqZWN0XCI9PT10eXBlb2YgdGhpcy5vcHRpb25zLnN0eWxpbmc/dGhpcy5vcHRpb25zLnN0eWxpbmc6ZC5zdHlsaW5nW3RoaXMub3B0aW9ucy5zdHlsaW5nXTt0aGlzLmVsZW09YihcIjxkaXYgLz5cIix7XCJjbGFzc1wiOlwidWktcG5vdGlmeSBcIit0aGlzLm9wdGlvbnMuYWRkY2xhc3MsY3NzOntkaXNwbGF5Olwibm9uZVwifSxcImFyaWEtbGl2ZVwiOlwiYXNzZXJ0aXZlXCIsXCJhcmlhLXJvbGVcIjpcImFsZXJ0ZGlhbG9nXCIsbW91c2VlbnRlcjpmdW5jdGlvbihhKXtpZihjLm9wdGlvbnMubW91c2VfcmVzZXQmJlwib3V0XCI9PT1jLmFuaW1hdGluZyl7aWYoIWMudGltZXJIaWRlKXJldHVybjtjLmNhbmNlbFJlbW92ZSgpfWMub3B0aW9ucy5oaWRlJiZjLm9wdGlvbnMubW91c2VfcmVzZXQmJmMuY2FuY2VsUmVtb3ZlKCl9LFxubW91c2VsZWF2ZTpmdW5jdGlvbihhKXtjLm9wdGlvbnMuaGlkZSYmYy5vcHRpb25zLm1vdXNlX3Jlc2V0JiZcIm91dFwiIT09Yy5hbmltYXRpbmcmJmMucXVldWVSZW1vdmUoKTtkLnBvc2l0aW9uQWxsKCl9fSk7XCJmYWRlXCI9PT10aGlzLm9wdGlvbnMuYW5pbWF0aW9uJiZ0aGlzLmVsZW0uYWRkQ2xhc3MoXCJ1aS1wbm90aWZ5LWZhZGUtXCIrdGhpcy5vcHRpb25zLmFuaW1hdGVfc3BlZWQpO3RoaXMuY29udGFpbmVyPWIoXCI8ZGl2IC8+XCIse1wiY2xhc3NcIjp0aGlzLnN0eWxlcy5jb250YWluZXIrXCIgdWktcG5vdGlmeS1jb250YWluZXIgXCIrKFwiZXJyb3JcIj09PXRoaXMub3B0aW9ucy50eXBlP3RoaXMuc3R5bGVzLmVycm9yOlwiaW5mb1wiPT09dGhpcy5vcHRpb25zLnR5cGU/dGhpcy5zdHlsZXMuaW5mbzpcInN1Y2Nlc3NcIj09PXRoaXMub3B0aW9ucy50eXBlP3RoaXMuc3R5bGVzLnN1Y2Nlc3M6dGhpcy5zdHlsZXMubm90aWNlKSxyb2xlOlwiYWxlcnRcIn0pLmFwcGVuZFRvKHRoaXMuZWxlbSk7XCJcIiE9PVxudGhpcy5vcHRpb25zLmNvcm5lcmNsYXNzJiZ0aGlzLmNvbnRhaW5lci5yZW1vdmVDbGFzcyhcInVpLWNvcm5lci1hbGxcIikuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNvcm5lcmNsYXNzKTt0aGlzLm9wdGlvbnMuc2hhZG93JiZ0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhcInVpLXBub3RpZnktc2hhZG93XCIpOyExIT09dGhpcy5vcHRpb25zLmljb24mJmIoXCI8ZGl2IC8+XCIse1wiY2xhc3NcIjpcInVpLXBub3RpZnktaWNvblwifSkuYXBwZW5kKGIoXCI8c3BhbiAvPlwiLHtcImNsYXNzXCI6ITA9PT10aGlzLm9wdGlvbnMuaWNvbj9cImVycm9yXCI9PT10aGlzLm9wdGlvbnMudHlwZT90aGlzLnN0eWxlcy5lcnJvcl9pY29uOlwiaW5mb1wiPT09dGhpcy5vcHRpb25zLnR5cGU/dGhpcy5zdHlsZXMuaW5mb19pY29uOlwic3VjY2Vzc1wiPT09dGhpcy5vcHRpb25zLnR5cGU/dGhpcy5zdHlsZXMuc3VjY2Vzc19pY29uOnRoaXMuc3R5bGVzLm5vdGljZV9pY29uOnRoaXMub3B0aW9ucy5pY29ufSkpLnByZXBlbmRUbyh0aGlzLmNvbnRhaW5lcik7XG50aGlzLnRpdGxlX2NvbnRhaW5lcj1iKFwiPGg0IC8+XCIse1wiY2xhc3NcIjpcInVpLXBub3RpZnktdGl0bGVcIn0pLmFwcGVuZFRvKHRoaXMuY29udGFpbmVyKTshMT09PXRoaXMub3B0aW9ucy50aXRsZT90aGlzLnRpdGxlX2NvbnRhaW5lci5oaWRlKCk6dGhpcy5vcHRpb25zLnRpdGxlX2VzY2FwZT90aGlzLnRpdGxlX2NvbnRhaW5lci50ZXh0KHRoaXMub3B0aW9ucy50aXRsZSk6dGhpcy50aXRsZV9jb250YWluZXIuaHRtbCh0aGlzLm9wdGlvbnMudGl0bGUpO3RoaXMudGV4dF9jb250YWluZXI9YihcIjxkaXYgLz5cIix7XCJjbGFzc1wiOlwidWktcG5vdGlmeS10ZXh0XCIsXCJhcmlhLXJvbGVcIjpcImFsZXJ0XCJ9KS5hcHBlbmRUbyh0aGlzLmNvbnRhaW5lcik7ITE9PT10aGlzLm9wdGlvbnMudGV4dD90aGlzLnRleHRfY29udGFpbmVyLmhpZGUoKTp0aGlzLm9wdGlvbnMudGV4dF9lc2NhcGU/dGhpcy50ZXh0X2NvbnRhaW5lci50ZXh0KHRoaXMub3B0aW9ucy50ZXh0KTp0aGlzLnRleHRfY29udGFpbmVyLmh0bWwodGhpcy5vcHRpb25zLmluc2VydF9icnM/XG5TdHJpbmcodGhpcy5vcHRpb25zLnRleHQpLnJlcGxhY2UoL1xcbi9nLFwiPGJyIC8+XCIpOnRoaXMub3B0aW9ucy50ZXh0KTtcInN0cmluZ1wiPT09dHlwZW9mIHRoaXMub3B0aW9ucy53aWR0aCYmdGhpcy5lbGVtLmNzcyhcIndpZHRoXCIsdGhpcy5vcHRpb25zLndpZHRoKTtcInN0cmluZ1wiPT09dHlwZW9mIHRoaXMub3B0aW9ucy5taW5faGVpZ2h0JiZ0aGlzLmNvbnRhaW5lci5jc3MoXCJtaW4taGVpZ2h0XCIsdGhpcy5vcHRpb25zLm1pbl9oZWlnaHQpO2Qubm90aWNlcz1cInRvcFwiPT09dGhpcy5vcHRpb25zLnN0YWNrLnB1c2g/Yi5tZXJnZShbdGhpc10sZC5ub3RpY2VzKTpiLm1lcmdlKGQubm90aWNlcyxbdGhpc10pO1widG9wXCI9PT10aGlzLm9wdGlvbnMuc3RhY2sucHVzaCYmdGhpcy5xdWV1ZVBvc2l0aW9uKCExLDEpO3RoaXMub3B0aW9ucy5zdGFjay5hbmltYXRpb249ITE7dGhpcy5ydW5Nb2R1bGVzKFwiaW5pdFwiKTt0aGlzLm9wdGlvbnMuYXV0b19kaXNwbGF5JiZ0aGlzLm9wZW4oKTtyZXR1cm4gdGhpc30sXG51cGRhdGU6ZnVuY3Rpb24oYyl7dmFyIGE9dGhpcy5vcHRpb25zO3RoaXMucGFyc2VPcHRpb25zKGEsYyk7dGhpcy5lbGVtLnJlbW92ZUNsYXNzKFwidWktcG5vdGlmeS1mYWRlLXNsb3cgdWktcG5vdGlmeS1mYWRlLW5vcm1hbCB1aS1wbm90aWZ5LWZhZGUtZmFzdFwiKTtcImZhZGVcIj09PXRoaXMub3B0aW9ucy5hbmltYXRpb24mJnRoaXMuZWxlbS5hZGRDbGFzcyhcInVpLXBub3RpZnktZmFkZS1cIit0aGlzLm9wdGlvbnMuYW5pbWF0ZV9zcGVlZCk7dGhpcy5vcHRpb25zLmNvcm5lcmNsYXNzIT09YS5jb3JuZXJjbGFzcyYmdGhpcy5jb250YWluZXIucmVtb3ZlQ2xhc3MoXCJ1aS1jb3JuZXItYWxsIFwiK2EuY29ybmVyY2xhc3MpLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jb3JuZXJjbGFzcyk7dGhpcy5vcHRpb25zLnNoYWRvdyE9PWEuc2hhZG93JiYodGhpcy5vcHRpb25zLnNoYWRvdz90aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhcInVpLXBub3RpZnktc2hhZG93XCIpOnRoaXMuY29udGFpbmVyLnJlbW92ZUNsYXNzKFwidWktcG5vdGlmeS1zaGFkb3dcIikpO1xuITE9PT10aGlzLm9wdGlvbnMuYWRkY2xhc3M/dGhpcy5lbGVtLnJlbW92ZUNsYXNzKGEuYWRkY2xhc3MpOnRoaXMub3B0aW9ucy5hZGRjbGFzcyE9PWEuYWRkY2xhc3MmJnRoaXMuZWxlbS5yZW1vdmVDbGFzcyhhLmFkZGNsYXNzKS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuYWRkY2xhc3MpOyExPT09dGhpcy5vcHRpb25zLnRpdGxlP3RoaXMudGl0bGVfY29udGFpbmVyLnNsaWRlVXAoXCJmYXN0XCIpOnRoaXMub3B0aW9ucy50aXRsZSE9PWEudGl0bGUmJih0aGlzLm9wdGlvbnMudGl0bGVfZXNjYXBlP3RoaXMudGl0bGVfY29udGFpbmVyLnRleHQodGhpcy5vcHRpb25zLnRpdGxlKTp0aGlzLnRpdGxlX2NvbnRhaW5lci5odG1sKHRoaXMub3B0aW9ucy50aXRsZSksITE9PT1hLnRpdGxlJiZ0aGlzLnRpdGxlX2NvbnRhaW5lci5zbGlkZURvd24oMjAwKSk7ITE9PT10aGlzLm9wdGlvbnMudGV4dD90aGlzLnRleHRfY29udGFpbmVyLnNsaWRlVXAoXCJmYXN0XCIpOnRoaXMub3B0aW9ucy50ZXh0IT09XG5hLnRleHQmJih0aGlzLm9wdGlvbnMudGV4dF9lc2NhcGU/dGhpcy50ZXh0X2NvbnRhaW5lci50ZXh0KHRoaXMub3B0aW9ucy50ZXh0KTp0aGlzLnRleHRfY29udGFpbmVyLmh0bWwodGhpcy5vcHRpb25zLmluc2VydF9icnM/U3RyaW5nKHRoaXMub3B0aW9ucy50ZXh0KS5yZXBsYWNlKC9cXG4vZyxcIjxiciAvPlwiKTp0aGlzLm9wdGlvbnMudGV4dCksITE9PT1hLnRleHQmJnRoaXMudGV4dF9jb250YWluZXIuc2xpZGVEb3duKDIwMCkpO3RoaXMub3B0aW9ucy50eXBlIT09YS50eXBlJiZ0aGlzLmNvbnRhaW5lci5yZW1vdmVDbGFzcyh0aGlzLnN0eWxlcy5lcnJvcitcIiBcIit0aGlzLnN0eWxlcy5ub3RpY2UrXCIgXCIrdGhpcy5zdHlsZXMuc3VjY2VzcytcIiBcIit0aGlzLnN0eWxlcy5pbmZvKS5hZGRDbGFzcyhcImVycm9yXCI9PT10aGlzLm9wdGlvbnMudHlwZT90aGlzLnN0eWxlcy5lcnJvcjpcImluZm9cIj09PXRoaXMub3B0aW9ucy50eXBlP3RoaXMuc3R5bGVzLmluZm86XCJzdWNjZXNzXCI9PT10aGlzLm9wdGlvbnMudHlwZT9cbnRoaXMuc3R5bGVzLnN1Y2Nlc3M6dGhpcy5zdHlsZXMubm90aWNlKTtpZih0aGlzLm9wdGlvbnMuaWNvbiE9PWEuaWNvbnx8ITA9PT10aGlzLm9wdGlvbnMuaWNvbiYmdGhpcy5vcHRpb25zLnR5cGUhPT1hLnR5cGUpdGhpcy5jb250YWluZXIuZmluZChcImRpdi51aS1wbm90aWZ5LWljb25cIikucmVtb3ZlKCksITEhPT10aGlzLm9wdGlvbnMuaWNvbiYmYihcIjxkaXYgLz5cIix7XCJjbGFzc1wiOlwidWktcG5vdGlmeS1pY29uXCJ9KS5hcHBlbmQoYihcIjxzcGFuIC8+XCIse1wiY2xhc3NcIjohMD09PXRoaXMub3B0aW9ucy5pY29uP1wiZXJyb3JcIj09PXRoaXMub3B0aW9ucy50eXBlP3RoaXMuc3R5bGVzLmVycm9yX2ljb246XCJpbmZvXCI9PT10aGlzLm9wdGlvbnMudHlwZT90aGlzLnN0eWxlcy5pbmZvX2ljb246XCJzdWNjZXNzXCI9PT10aGlzLm9wdGlvbnMudHlwZT90aGlzLnN0eWxlcy5zdWNjZXNzX2ljb246dGhpcy5zdHlsZXMubm90aWNlX2ljb246dGhpcy5vcHRpb25zLmljb259KSkucHJlcGVuZFRvKHRoaXMuY29udGFpbmVyKTtcbnRoaXMub3B0aW9ucy53aWR0aCE9PWEud2lkdGgmJnRoaXMuZWxlbS5hbmltYXRlKHt3aWR0aDp0aGlzLm9wdGlvbnMud2lkdGh9KTt0aGlzLm9wdGlvbnMubWluX2hlaWdodCE9PWEubWluX2hlaWdodCYmdGhpcy5jb250YWluZXIuYW5pbWF0ZSh7bWluSGVpZ2h0OnRoaXMub3B0aW9ucy5taW5faGVpZ2h0fSk7dGhpcy5vcHRpb25zLmhpZGU/YS5oaWRlfHx0aGlzLnF1ZXVlUmVtb3ZlKCk6dGhpcy5jYW5jZWxSZW1vdmUoKTt0aGlzLnF1ZXVlUG9zaXRpb24oITApO3RoaXMucnVuTW9kdWxlcyhcInVwZGF0ZVwiLGEpO3JldHVybiB0aGlzfSxvcGVuOmZ1bmN0aW9uKCl7dGhpcy5zdGF0ZT1cIm9wZW5pbmdcIjt0aGlzLnJ1bk1vZHVsZXMoXCJiZWZvcmVPcGVuXCIpO3ZhciBjPXRoaXM7dGhpcy5lbGVtLnBhcmVudCgpLmxlbmd0aHx8dGhpcy5lbGVtLmFwcGVuZFRvKHRoaXMub3B0aW9ucy5zdGFjay5jb250ZXh0P3RoaXMub3B0aW9ucy5zdGFjay5jb250ZXh0OmgpO1widG9wXCIhPT10aGlzLm9wdGlvbnMuc3RhY2sucHVzaCYmXG50aGlzLnBvc2l0aW9uKCEwKTt0aGlzLmFuaW1hdGVJbihmdW5jdGlvbigpe2MucXVldWVQb3NpdGlvbighMCk7Yy5vcHRpb25zLmhpZGUmJmMucXVldWVSZW1vdmUoKTtjLnN0YXRlPVwib3BlblwiO2MucnVuTW9kdWxlcyhcImFmdGVyT3BlblwiKX0pO3JldHVybiB0aGlzfSxyZW1vdmU6ZnVuY3Rpb24oYyl7dGhpcy5zdGF0ZT1cImNsb3NpbmdcIjt0aGlzLnRpbWVySGlkZT0hIWM7dGhpcy5ydW5Nb2R1bGVzKFwiYmVmb3JlQ2xvc2VcIik7dmFyIGE9dGhpczt0aGlzLnRpbWVyJiYobC5jbGVhclRpbWVvdXQodGhpcy50aW1lciksdGhpcy50aW1lcj1udWxsKTt0aGlzLmFuaW1hdGVPdXQoZnVuY3Rpb24oKXthLnN0YXRlPVwiY2xvc2VkXCI7YS5ydW5Nb2R1bGVzKFwiYWZ0ZXJDbG9zZVwiKTthLnF1ZXVlUG9zaXRpb24oITApO2Eub3B0aW9ucy5yZW1vdmUmJmEuZWxlbS5kZXRhY2goKTthLnJ1bk1vZHVsZXMoXCJiZWZvcmVEZXN0cm95XCIpO2lmKGEub3B0aW9ucy5kZXN0cm95JiZudWxsIT09ZC5ub3RpY2VzKXt2YXIgYz1cbmIuaW5BcnJheShhLGQubm90aWNlcyk7LTEhPT1jJiZkLm5vdGljZXMuc3BsaWNlKGMsMSl9YS5ydW5Nb2R1bGVzKFwiYWZ0ZXJEZXN0cm95XCIpfSk7cmV0dXJuIHRoaXN9LGdldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmVsZW19LHBhcnNlT3B0aW9uczpmdW5jdGlvbihjLGEpe3RoaXMub3B0aW9ucz1iLmV4dGVuZCghMCx7fSxkLnByb3RvdHlwZS5vcHRpb25zKTt0aGlzLm9wdGlvbnMuc3RhY2s9ZC5wcm90b3R5cGUub3B0aW9ucy5zdGFjaztmb3IodmFyIHA9W2MsYV0sbSxmPTA7ZjxwLmxlbmd0aDtmKyspe209cFtmXTtpZihcInVuZGVmaW5lZFwiPT09dHlwZW9mIG0pYnJlYWs7aWYoXCJvYmplY3RcIiE9PXR5cGVvZiBtKXRoaXMub3B0aW9ucy50ZXh0PW07ZWxzZSBmb3IodmFyIGUgaW4gbSl0aGlzLm1vZHVsZXNbZV0/Yi5leHRlbmQoITAsdGhpcy5vcHRpb25zW2VdLG1bZV0pOnRoaXMub3B0aW9uc1tlXT1tW2VdfX0sYW5pbWF0ZUluOmZ1bmN0aW9uKGMpe3RoaXMuYW5pbWF0aW5nPVxuXCJpblwiO3ZhciBhPXRoaXM7Yz1mdW5jdGlvbigpe2EuYW5pbVRpbWVyJiZjbGVhclRpbWVvdXQoYS5hbmltVGltZXIpO1wiaW5cIj09PWEuYW5pbWF0aW5nJiYoYS5lbGVtLmlzKFwiOnZpc2libGVcIik/KHRoaXMmJnRoaXMuY2FsbCgpLGEuYW5pbWF0aW5nPSExKTphLmFuaW1UaW1lcj1zZXRUaW1lb3V0KGMsNDApKX0uYmluZChjKTtcImZhZGVcIj09PXRoaXMub3B0aW9ucy5hbmltYXRpb24/KHRoaXMuZWxlbS5vbmUoXCJ3ZWJraXRUcmFuc2l0aW9uRW5kIG1velRyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmRcIixjKS5hZGRDbGFzcyhcInVpLXBub3RpZnktaW5cIiksdGhpcy5lbGVtLmNzcyhcIm9wYWNpdHlcIiksdGhpcy5lbGVtLmFkZENsYXNzKFwidWktcG5vdGlmeS1mYWRlLWluXCIpLHRoaXMuYW5pbVRpbWVyPXNldFRpbWVvdXQoYyw2NTApKToodGhpcy5lbGVtLmFkZENsYXNzKFwidWktcG5vdGlmeS1pblwiKSxjKCkpfSxhbmltYXRlT3V0OmZ1bmN0aW9uKGMpe3RoaXMuYW5pbWF0aW5nPVxuXCJvdXRcIjt2YXIgYT10aGlzO2M9ZnVuY3Rpb24oKXthLmFuaW1UaW1lciYmY2xlYXJUaW1lb3V0KGEuYW5pbVRpbWVyKTtcIm91dFwiPT09YS5hbmltYXRpbmcmJihcIjBcIiE9YS5lbGVtLmNzcyhcIm9wYWNpdHlcIikmJmEuZWxlbS5pcyhcIjp2aXNpYmxlXCIpP2EuYW5pbVRpbWVyPXNldFRpbWVvdXQoYyw0MCk6KGEuZWxlbS5yZW1vdmVDbGFzcyhcInVpLXBub3RpZnktaW5cIiksdGhpcyYmdGhpcy5jYWxsKCksYS5hbmltYXRpbmc9ITEpKX0uYmluZChjKTtcImZhZGVcIj09PXRoaXMub3B0aW9ucy5hbmltYXRpb24/KHRoaXMuZWxlbS5vbmUoXCJ3ZWJraXRUcmFuc2l0aW9uRW5kIG1velRyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmRcIixjKS5yZW1vdmVDbGFzcyhcInVpLXBub3RpZnktZmFkZS1pblwiKSx0aGlzLmFuaW1UaW1lcj1zZXRUaW1lb3V0KGMsNjUwKSk6KHRoaXMuZWxlbS5yZW1vdmVDbGFzcyhcInVpLXBub3RpZnktaW5cIiksYygpKX0scG9zaXRpb246ZnVuY3Rpb24oYyl7dmFyIGE9XG50aGlzLm9wdGlvbnMuc3RhY2ssYj10aGlzLmVsZW07XCJ1bmRlZmluZWRcIj09PXR5cGVvZiBhLmNvbnRleHQmJihhLmNvbnRleHQ9aCk7aWYoYSl7XCJudW1iZXJcIiE9PXR5cGVvZiBhLm5leHRwb3MxJiYoYS5uZXh0cG9zMT1hLmZpcnN0cG9zMSk7XCJudW1iZXJcIiE9PXR5cGVvZiBhLm5leHRwb3MyJiYoYS5uZXh0cG9zMj1hLmZpcnN0cG9zMik7XCJudW1iZXJcIiE9PXR5cGVvZiBhLmFkZHBvczImJihhLmFkZHBvczI9MCk7dmFyIGQ9IWIuaGFzQ2xhc3MoXCJ1aS1wbm90aWZ5LWluXCIpO2lmKCFkfHxjKXthLm1vZGFsJiYoYS5vdmVybGF5P2Eub3ZlcmxheS5zaG93KCk6YS5vdmVybGF5PXMoYSkpO2IuYWRkQ2xhc3MoXCJ1aS1wbm90aWZ5LW1vdmVcIik7dmFyIGY7c3dpdGNoKGEuZGlyMSl7Y2FzZSBcImRvd25cIjpmPVwidG9wXCI7YnJlYWs7Y2FzZSBcInVwXCI6Zj1cImJvdHRvbVwiO2JyZWFrO2Nhc2UgXCJsZWZ0XCI6Zj1cInJpZ2h0XCI7YnJlYWs7Y2FzZSBcInJpZ2h0XCI6Zj1cImxlZnRcIn1jPXBhcnNlSW50KGIuY3NzKGYpLnJlcGxhY2UoLyg/OlxcLi4qfFteMC05Ll0pL2csXG5cIlwiKSk7aXNOYU4oYykmJihjPTApO1widW5kZWZpbmVkXCIhPT10eXBlb2YgYS5maXJzdHBvczF8fGR8fChhLmZpcnN0cG9zMT1jLGEubmV4dHBvczE9YS5maXJzdHBvczEpO3ZhciBlO3N3aXRjaChhLmRpcjIpe2Nhc2UgXCJkb3duXCI6ZT1cInRvcFwiO2JyZWFrO2Nhc2UgXCJ1cFwiOmU9XCJib3R0b21cIjticmVhaztjYXNlIFwibGVmdFwiOmU9XCJyaWdodFwiO2JyZWFrO2Nhc2UgXCJyaWdodFwiOmU9XCJsZWZ0XCJ9Yz1wYXJzZUludChiLmNzcyhlKS5yZXBsYWNlKC8oPzpcXC4uKnxbXjAtOS5dKS9nLFwiXCIpKTtpc05hTihjKSYmKGM9MCk7XCJ1bmRlZmluZWRcIiE9PXR5cGVvZiBhLmZpcnN0cG9zMnx8ZHx8KGEuZmlyc3Rwb3MyPWMsYS5uZXh0cG9zMj1hLmZpcnN0cG9zMik7aWYoXCJkb3duXCI9PT1hLmRpcjEmJmEubmV4dHBvczErYi5oZWlnaHQoKT4oYS5jb250ZXh0LmlzKGgpP24uaGVpZ2h0KCk6YS5jb250ZXh0LnByb3AoXCJzY3JvbGxIZWlnaHRcIikpfHxcInVwXCI9PT1hLmRpcjEmJmEubmV4dHBvczErYi5oZWlnaHQoKT5cbihhLmNvbnRleHQuaXMoaCk/bi5oZWlnaHQoKTphLmNvbnRleHQucHJvcChcInNjcm9sbEhlaWdodFwiKSl8fFwibGVmdFwiPT09YS5kaXIxJiZhLm5leHRwb3MxK2Iud2lkdGgoKT4oYS5jb250ZXh0LmlzKGgpP24ud2lkdGgoKTphLmNvbnRleHQucHJvcChcInNjcm9sbFdpZHRoXCIpKXx8XCJyaWdodFwiPT09YS5kaXIxJiZhLm5leHRwb3MxK2Iud2lkdGgoKT4oYS5jb250ZXh0LmlzKGgpP24ud2lkdGgoKTphLmNvbnRleHQucHJvcChcInNjcm9sbFdpZHRoXCIpKSlhLm5leHRwb3MxPWEuZmlyc3Rwb3MxLGEubmV4dHBvczIrPWEuYWRkcG9zMisoXCJ1bmRlZmluZWRcIj09PXR5cGVvZiBhLnNwYWNpbmcyPzI1OmEuc3BhY2luZzIpLGEuYWRkcG9zMj0wO1wibnVtYmVyXCI9PT10eXBlb2YgYS5uZXh0cG9zMiYmKGEuYW5pbWF0aW9uP2IuY3NzKGUsYS5uZXh0cG9zMitcInB4XCIpOihiLnJlbW92ZUNsYXNzKFwidWktcG5vdGlmeS1tb3ZlXCIpLGIuY3NzKGUsYS5uZXh0cG9zMitcInB4XCIpLGIuY3NzKGUpLGIuYWRkQ2xhc3MoXCJ1aS1wbm90aWZ5LW1vdmVcIikpKTtcbnN3aXRjaChhLmRpcjIpe2Nhc2UgXCJkb3duXCI6Y2FzZSBcInVwXCI6Yi5vdXRlckhlaWdodCghMCk+YS5hZGRwb3MyJiYoYS5hZGRwb3MyPWIuaGVpZ2h0KCkpO2JyZWFrO2Nhc2UgXCJsZWZ0XCI6Y2FzZSBcInJpZ2h0XCI6Yi5vdXRlcldpZHRoKCEwKT5hLmFkZHBvczImJihhLmFkZHBvczI9Yi53aWR0aCgpKX1cIm51bWJlclwiPT09dHlwZW9mIGEubmV4dHBvczEmJihhLmFuaW1hdGlvbj9iLmNzcyhmLGEubmV4dHBvczErXCJweFwiKTooYi5yZW1vdmVDbGFzcyhcInVpLXBub3RpZnktbW92ZVwiKSxiLmNzcyhmLGEubmV4dHBvczErXCJweFwiKSxiLmNzcyhmKSxiLmFkZENsYXNzKFwidWktcG5vdGlmeS1tb3ZlXCIpKSk7c3dpdGNoKGEuZGlyMSl7Y2FzZSBcImRvd25cIjpjYXNlIFwidXBcIjphLm5leHRwb3MxKz1iLmhlaWdodCgpKyhcInVuZGVmaW5lZFwiPT09dHlwZW9mIGEuc3BhY2luZzE/MjU6YS5zcGFjaW5nMSk7YnJlYWs7Y2FzZSBcImxlZnRcIjpjYXNlIFwicmlnaHRcIjphLm5leHRwb3MxKz1iLndpZHRoKCkrKFwidW5kZWZpbmVkXCI9PT1cbnR5cGVvZiBhLnNwYWNpbmcxPzI1OmEuc3BhY2luZzEpfX1yZXR1cm4gdGhpc319LHF1ZXVlUG9zaXRpb246ZnVuY3Rpb24oYixhKXtnJiZjbGVhclRpbWVvdXQoZyk7YXx8KGE9MTApO2c9c2V0VGltZW91dChmdW5jdGlvbigpe2QucG9zaXRpb25BbGwoYil9LGEpO3JldHVybiB0aGlzfSxjYW5jZWxSZW1vdmU6ZnVuY3Rpb24oKXt0aGlzLnRpbWVyJiZsLmNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTt0aGlzLmFuaW1UaW1lciYmbC5jbGVhclRpbWVvdXQodGhpcy5hbmltVGltZXIpO1wiY2xvc2luZ1wiPT09dGhpcy5zdGF0ZSYmKHRoaXMuc3RhdGU9XCJvcGVuXCIsdGhpcy5hbmltYXRpbmc9ITEsdGhpcy5lbGVtLmFkZENsYXNzKFwidWktcG5vdGlmeS1pblwiKSxcImZhZGVcIj09PXRoaXMub3B0aW9ucy5hbmltYXRpb24mJnRoaXMuZWxlbS5hZGRDbGFzcyhcInVpLXBub3RpZnktZmFkZS1pblwiKSk7cmV0dXJuIHRoaXN9LHF1ZXVlUmVtb3ZlOmZ1bmN0aW9uKCl7dmFyIGI9dGhpczt0aGlzLmNhbmNlbFJlbW92ZSgpO1xudGhpcy50aW1lcj1sLnNldFRpbWVvdXQoZnVuY3Rpb24oKXtiLnJlbW92ZSghMCl9LGlzTmFOKHRoaXMub3B0aW9ucy5kZWxheSk/MDp0aGlzLm9wdGlvbnMuZGVsYXkpO3JldHVybiB0aGlzfX0pO2IuZXh0ZW5kKGQse25vdGljZXM6W10scmVsb2FkOnEscmVtb3ZlQWxsOmZ1bmN0aW9uKCl7Yi5lYWNoKGQubm90aWNlcyxmdW5jdGlvbigpe3RoaXMucmVtb3ZlJiZ0aGlzLnJlbW92ZSghMSl9KX0scmVtb3ZlU3RhY2s6ZnVuY3Rpb24oYyl7Yi5lYWNoKGQubm90aWNlcyxmdW5jdGlvbigpe3RoaXMucmVtb3ZlJiZ0aGlzLm9wdGlvbnMuc3RhY2s9PT1jJiZ0aGlzLnJlbW92ZSghMSl9KX0scG9zaXRpb25BbGw6ZnVuY3Rpb24oYyl7ZyYmY2xlYXJUaW1lb3V0KGcpO2c9bnVsbDtpZihkLm5vdGljZXMmJmQubm90aWNlcy5sZW5ndGgpYi5lYWNoKGQubm90aWNlcyxmdW5jdGlvbigpe3ZhciBhPXRoaXMub3B0aW9ucy5zdGFjazthJiYoYS5vdmVybGF5JiZhLm92ZXJsYXkuaGlkZSgpLGEubmV4dHBvczE9XG5hLmZpcnN0cG9zMSxhLm5leHRwb3MyPWEuZmlyc3Rwb3MyLGEuYWRkcG9zMj0wLGEuYW5pbWF0aW9uPWMpfSksYi5lYWNoKGQubm90aWNlcyxmdW5jdGlvbigpe3RoaXMucG9zaXRpb24oKX0pO2Vsc2V7dmFyIGE9ZC5wcm90b3R5cGUub3B0aW9ucy5zdGFjazthJiYoZGVsZXRlIGEubmV4dHBvczEsZGVsZXRlIGEubmV4dHBvczIpfX0sc3R5bGluZzp7YnJpZ2h0dGhlbWU6e2NvbnRhaW5lcjpcImJyaWdodHRoZW1lXCIsbm90aWNlOlwiYnJpZ2h0dGhlbWUtbm90aWNlXCIsbm90aWNlX2ljb246XCJicmlnaHR0aGVtZS1pY29uLW5vdGljZVwiLGluZm86XCJicmlnaHR0aGVtZS1pbmZvXCIsaW5mb19pY29uOlwiYnJpZ2h0dGhlbWUtaWNvbi1pbmZvXCIsc3VjY2VzczpcImJyaWdodHRoZW1lLXN1Y2Nlc3NcIixzdWNjZXNzX2ljb246XCJicmlnaHR0aGVtZS1pY29uLXN1Y2Nlc3NcIixlcnJvcjpcImJyaWdodHRoZW1lLWVycm9yXCIsZXJyb3JfaWNvbjpcImJyaWdodHRoZW1lLWljb24tZXJyb3JcIn0sanF1ZXJ5dWk6e2NvbnRhaW5lcjpcInVpLXdpZGdldCB1aS13aWRnZXQtY29udGVudCB1aS1jb3JuZXItYWxsXCIsXG5ub3RpY2U6XCJ1aS1zdGF0ZS1oaWdobGlnaHRcIixub3RpY2VfaWNvbjpcInVpLWljb24gdWktaWNvbi1pbmZvXCIsaW5mbzpcIlwiLGluZm9faWNvbjpcInVpLWljb24gdWktaWNvbi1pbmZvXCIsc3VjY2VzczpcInVpLXN0YXRlLWRlZmF1bHRcIixzdWNjZXNzX2ljb246XCJ1aS1pY29uIHVpLWljb24tY2lyY2xlLWNoZWNrXCIsZXJyb3I6XCJ1aS1zdGF0ZS1lcnJvclwiLGVycm9yX2ljb246XCJ1aS1pY29uIHVpLWljb24tYWxlcnRcIn0sYm9vdHN0cmFwMzp7Y29udGFpbmVyOlwiYWxlcnRcIixub3RpY2U6XCJhbGVydC13YXJuaW5nXCIsbm90aWNlX2ljb246XCJnbHlwaGljb24gZ2x5cGhpY29uLWV4Y2xhbWF0aW9uLXNpZ25cIixpbmZvOlwiYWxlcnQtaW5mb1wiLGluZm9faWNvbjpcImdseXBoaWNvbiBnbHlwaGljb24taW5mby1zaWduXCIsc3VjY2VzczpcImFsZXJ0LXN1Y2Nlc3NcIixzdWNjZXNzX2ljb246XCJnbHlwaGljb24gZ2x5cGhpY29uLW9rLXNpZ25cIixlcnJvcjpcImFsZXJ0LWRhbmdlclwiLGVycm9yX2ljb246XCJnbHlwaGljb24gZ2x5cGhpY29uLXdhcm5pbmctc2lnblwifX19KTtcbmQuc3R5bGluZy5mb250YXdlc29tZT1iLmV4dGVuZCh7fSxkLnN0eWxpbmcuYm9vdHN0cmFwMyk7Yi5leHRlbmQoZC5zdHlsaW5nLmZvbnRhd2Vzb21lLHtub3RpY2VfaWNvbjpcImZhIGZhLWV4Y2xhbWF0aW9uLWNpcmNsZVwiLGluZm9faWNvbjpcImZhIGZhLWluZm9cIixzdWNjZXNzX2ljb246XCJmYSBmYS1jaGVja1wiLGVycm9yX2ljb246XCJmYSBmYS13YXJuaW5nXCJ9KTtsLmRvY3VtZW50LmJvZHk/cigpOmIocik7cmV0dXJuIGR9O3JldHVybiBxKGspfSk7XG4iLCJ2YXIga2V5ID0gcmVxdWlyZShcImtleW1hc3RlclwiKTtcclxudmFyIG1lc3NhZ2UgPSByZXF1aXJlKFwibW9kdWxlcy9tZXNzYWdlXCIpO1xyXG5cclxuLy8gQWRkIHNob3J0Y3V0IGNvZVxyXG52YXIgX2FkZFNob3J0Y3V0ID0gZnVuY3Rpb24oc2VsZWN0ZWRLZXksY2IpIHtcclxuICBrZXkoc2VsZWN0ZWRLZXksIGNiKTtcclxufVxyXG5cclxudmFyIF9jbGlja0J1dHRvbiA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgJChzZWxlY3RvcikudHJpZ2dlcignY2xpY2snKTtcclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8vIEFkZCBzaG9ydGN1dHMgZm9yIHNlbGVjdG9yc1xyXG52YXIgZGVmYXVsdFNob3J0Y3V0cyA9IGZ1bmN0aW9uKCkge1xyXG4gIF9hZGRTaG9ydGN1dCgnY3RybCtzJywgZnVuY3Rpb24oZXZlbnQsaGFuZGxlcil7XHJcbiAgICBfY2xpY2tCdXR0b24oJy50LUJ1dHRvbltvbmNsaWNrKj1cIlxcJ0NSRUFURVxcJ1wiXSwudC1CdXR0b24jQ1JFQVRFJyk7XHJcbiAgfSk7XHJcbiAgX2FkZFNob3J0Y3V0KCdjdHJsK3MnLCBmdW5jdGlvbihldmVudCxoYW5kbGVyKXtcclxuICAgIF9jbGlja0J1dHRvbignLnQtQnV0dG9uW29uY2xpY2sqPVwiXFwnU0FWRVxcJ1wiXSwudC1CdXR0b24jU0FWRScpO1xyXG4gIH0pO1xyXG4gIF9hZGRTaG9ydGN1dCgnY3RybCtkJywgZnVuY3Rpb24oZXZlbnQsaGFuZGxlcil7XHJcbiAgICBfY2xpY2tCdXR0b24oJy50LUJ1dHRvbltvbmNsaWNrKj1cIlxcJ0RFTEVURVxcJ1wiXSwudC1CdXR0b24jREVMRVRFJyk7XHJcbiAgfSk7XHJcbiAgX2FkZFNob3J0Y3V0KCdjdHJsK20nLCBmdW5jdGlvbihldmVudCxoYW5kbGVyKXtcclxuICAgIG1lc3NhZ2UuaW5mbyh7XHJcbiAgICAgIHRpdGxlOiBcIkEga2V5IHdhcyBwcmVzc2VkXCIsXHJcbiAgICAgIHRleHQ6IFwiY3RybCttXCJcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdFNob3J0Y3V0czogZGVmYXVsdFNob3J0Y3V0c1xyXG59XHJcbiIsInZhciAkID0gKHdpbmRvdy4kKTsgLy8gYmVpbmcgc2hpbW1lZFxyXG52YXIgUE5vdGlmeSA9IHJlcXVpcmUoXCJwbm90aWZ5XCIpO1xyXG5cclxuXHJcbi8vIEJ1dHRvbiBkZWZhdWx0c1xyXG52YXIgZGVmYXVsdHMgPSB7XHJcbiAgaGlkZTogZmFsc2UsXHJcbiAgY2xvc2VyOiB0cnVlLFxyXG4gIGJ1dHRvbnM6IHtcclxuICAgIGNsb3Nlcl9ob3ZlcjogZmFsc2UsXHJcbiAgICBzdGlja2VyOiBmYWxzZSxcclxuICAgIGxhYmVsczoge1xyXG4gICAgICBjbG9zZTogJ1NsdWl0IG1lbGRpbmcnXHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuXHJcbnZhciBnZXRTZXR0aW5ncyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuXHJcbiAgc3dpdGNoICh0eXBlb2Ygb3B0aW9ucykge1xyXG4gICAgY2FzZSBcInN0cmluZ1wiOlxyXG4gICAgICByZXR1cm4gJC5leHRlbmQoe1xyXG4gICAgICAgIHRpdGxlOiBvcHRpb25zXHJcbiAgICAgIH0sIGRlZmF1bHRzKTtcclxuICAgIGNhc2UgXCJvYmplY3RcIjpcclxuICAgICAgcmV0dXJuICQuZXh0ZW5kKG9wdGlvbnMsIGRlZmF1bHRzKTtcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiBkZWZhdWx0cztcclxuICB9O1xyXG5cclxufTtcclxuXHJcbnZhciBpbmZvID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgUE5vdGlmeSgkLmV4dGVuZChnZXRTZXR0aW5ncyhvcHRpb25zKSwge1xyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgaGlkZTogdHJ1ZVxyXG4gIH0pKTtcclxufTtcclxuXHJcbnZhciBzdWNjZXNzID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgUE5vdGlmeSgkLmV4dGVuZChnZXRTZXR0aW5ncyhvcHRpb25zKSwge1xyXG4gICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgaGlkZTogdHJ1ZVxyXG4gIH0pKTtcclxufTtcclxuXHJcbnZhciB3YXJuaW5nID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgUE5vdGlmeSgkLmV4dGVuZChnZXRTZXR0aW5ncyhvcHRpb25zKSwge1xyXG4gICAgdHlwZTogJ3dhcm5pbmcnXHJcbiAgfSkpO1xyXG59O1xyXG5cclxudmFyIGVycm9yID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgUE5vdGlmeSgkLmV4dGVuZChnZXRTZXR0aW5ncyhvcHRpb25zKSwge1xyXG4gICAgdHlwZTogJ2Vycm9yJ1xyXG4gIH0pKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGluZm86IGluZm8sXHJcbiAgc3VjY2Vzczogc3VjY2VzcyxcclxuICB3YXJuaW5nOiB3YXJuaW5nLFxyXG4gIGVycm9yOiBlcnJvclxyXG59O1xyXG4iLCIkLndpZGdldChcImN1c3RvbS5jdXN0b21SZXBvcnRcIiwge1xyXG4gIG9wdGlvbnM6IHtcclxuICAgIGV4Y2VwdENsYXNzOiAnbm8tcm93LWxpbmsnLFxyXG4gICAgYWN0aXZlQ2xhc3M6ICdhY3RpdmUnLFxyXG4gICAgY29sdW1uczogW10sXHJcbiAgICByb3djbGljazogZnVuY3Rpb24oZSwgZGF0YSkge1xyXG4gICAgICAkKHRoaXMpLmN1c3RvbVJlcG9ydCgnb3BlbkxpbmsnLCBlKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfY3JlYXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIC8vIENoZWNrIGlmIHJlcG9ydCBtYXkgaGF2ZSBhIHJvdyBsaW5rXHJcbiAgICBpZiAodGhpcy5fcm93TGlua0FsbG93ZWQpIHtcclxuICAgICAgdGhpcy5faW5pdFJvd0NsaWNrKCk7XHJcbiAgICB9XHJcblxyXG4gICAgJCh0aGlzLmVsZW1lbnQpLm9uKCdhcGV4YWZ0ZXJyZWZyZXNoJyxmdW5jdGlvbihlKXtcclxuICAgICAgc2VsZi5fYXBleGFmdGVycmVmcmVzaCgpO1xyXG4gICAgfSk7XHJcblxyXG4gIH0sXHJcblxyXG4gIF9hcGV4YWZ0ZXJyZWZyZXNoOiBmdW5jdGlvbigpIHtcclxuICAgIC8vIENoZWNrIGlmIHJlcG9ydCBtYXkgaGF2ZSBhIHJvdyBsaW5rXHJcbiAgICBpZiAodGhpcy5fcm93TGlua0FsbG93ZWQpIHtcclxuICAgICAgdGhpcy5faW5pdFJvd0NsaWNrKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgX2luaXRSb3dDbGljazogZnVuY3Rpb24oY2IpIHtcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB2YXIgZGF0YTtcclxuICAgIGNiID0gJC5wcm94eShjYiwgc2VsZik7XHJcblxyXG4gICAgLy8gUmVtb3ZlIHByZXZpb3VzIGhhbmRsZXJzXHJcbiAgICB0aGlzLl9vZmYodGhpcy5lbGVtZW50LCAnY2xpY2sgdHIgdGQ6bm90KDpoYXMoYSkpJyk7XHJcbiAgICB0aGlzLl9vZmYodGhpcy5lbGVtZW50LCAnaG92ZXIgdHIgdGQ6bm90KDpoYXMoYSkpJyk7XHJcblxyXG4gICAgLy8gQWRkIG5ldyBoYW5kbGVyXHJcbiAgICB0aGlzLl9vbih0aGlzLmVsZW1lbnQsIHtcclxuICAgICAgJ21vdXNlZW50ZXIgdHIgdGQ6bm90KDpoYXMoYSkpJzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICQoZS50YXJnZXQpLmNzcygnY3Vyc29yJywgJ3BvaW50ZXInKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQWRkIG5ldyBoYW5kbGVyXHJcbiAgICB0aGlzLl9vbih0aGlzLmVsZW1lbnQsIHtcclxuICAgICAgJ2NsaWNrIHRyIHRkOm5vdCg6aGFzKGEpKSc6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBzZWxmLl90cmlnZ2VyKCdyb3djbGljaycsIGUsIGRhdGEpO1xyXG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICB9LFxyXG5cclxuICAvLyBVc2UgYW4gYSBocmVmIHZhbHVlIHRvIHJlZGlyZWN0IG9uIHJvdyBjbGljayBpbiByZXBvcnRcclxuICBvcGVuTGluazogZnVuY3Rpb24oZXZlbnQsIG9wdGlvbnMpIHtcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIGRlZmF1bHRzID0ge1xyXG4gICAgICBhUG9zOiAwIC8vIHdoaWNoIFwiYVwiIGVsZW1lbnQgY29udGFpbnMgdGhlIGxpbmtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZChvcHRpb25zLCBkZWZhdWx0cyk7XHJcblxyXG4gICAgLy8gR2V0IGxpbmtcclxuICAgIHZhciAkbGlua0VsZW0gPSBzZWxmLl9nZXRMaW5rRWxlbWVudChzZXR0aW5ncywgZXZlbnQuY3VycmVudFRhcmdldCk7XHJcbiAgICB2YXIgaHJlZiA9ICRsaW5rRWxlbS5hdHRyKCdocmVmJyk7XHJcblxyXG4gICAgaWYgKGhyZWYgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gaHJlZjtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfZ2V0TGlua0VsZW1lbnQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHRhcmdldCkge1xyXG5cclxuICAgIHZhciBsaW5rcyA9ICQodGFyZ2V0KS5jbG9zZXN0KCd0cicpLmZpbmQoJ3RkOmhhcyhhKScpO1xyXG5cclxuICAgIC8vIFJhaXNlIGV4Y2VwdGlvbiBpZiBwb3NpdGlvbiBvZiBhIGVsZW1lbnQgaXMgaW52YWxpZFxyXG4gICAgaWYgKGxpbmtzLmxlbmd0aCA8IG9wdGlvbnMuYVBvcykge1xyXG4gICAgICBhcGV4LmRlYnVnLmVycm9yKCdFeGNlcHRpb246ICcsIG9wdGlvbnMuYVBvcyArICd0aCBcImFcIiBlbGVtZW50IGlzIG5vdCBmb3VuZCBpbiByZXBvcnQgcm93LicpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuICQobGlua3Nbb3B0aW9ucy5hUG9zXSkuZmluZCgnYScpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICAvLyBfcm93TGlua0FsbG93ZWQgcmV0dXJucyBib29sZWFuXHJcbiAgX3Jvd0xpbmtBbGxvd2VkOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAhJCh0aGlzLmVsZW1lbnQpLmhhc0NsYXNzKHRoaXMub3B0aW9ucy5leGNlcHRDbGFzcyk7XHJcbiAgfSxcclxuXHJcbiAgX3NldEFjdGl2ZVJvdzogZnVuY3Rpb24oJHJvdykge1xyXG4gICAgJCgkcm93KS5jbG9zZXN0KCd0YWJsZScpLmZpbmQoJ3RkLicrdGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKS5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xyXG4gICAgJCgkcm93KS5maW5kKCd0ZCcpLmFkZENsYXNzKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XHJcbiAgfSxcclxuXHJcbiAgYWN0aXZlUm93OiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAkKHRoaXMuZWxlbWVudCkuZmluZCgndGQuJyt0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpLmNsb3Nlc3QoJ3RyJyk7XHJcbiAgfVxyXG5cclxufSk7XHJcbiJdfQ==
