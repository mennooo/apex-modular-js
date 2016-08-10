(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var kscope = {};window.kscope = kscope;kscope.message = require('modules/message');kscope.keyboardShortcuts = require('modules/keyboardShortcuts');require('widgets/customReport');
},{"modules/keyboardShortcuts":4,"modules/message":5,"widgets/customReport":6}],2:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJfc3RyZWFtXzAuanMiLCJub2RlX21vZHVsZXMva2V5bWFzdGVyL2tleW1hc3Rlci5qcyIsIm5vZGVfbW9kdWxlcy9wbm90aWZ5L2Rpc3QvcG5vdGlmeS5qcyIsInNyYy9qcy9tb2R1bGVzL2tleWJvYXJkU2hvcnRjdXRzLmpzIiwic3JjL2pzL21vZHVsZXMvbWVzc2FnZS5qcyIsInNyYy9qcy93aWRnZXRzL2N1c3RvbVJlcG9ydC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBrc2NvcGUgPSB7fTt3aW5kb3cua3Njb3BlID0ga3Njb3BlO2tzY29wZS5tZXNzYWdlID0gcmVxdWlyZSgnbW9kdWxlcy9tZXNzYWdlJyk7a3Njb3BlLmtleWJvYXJkU2hvcnRjdXRzID0gcmVxdWlyZSgnbW9kdWxlcy9rZXlib2FyZFNob3J0Y3V0cycpO3JlcXVpcmUoJ3dpZGdldHMvY3VzdG9tUmVwb3J0Jyk7IiwiLy8gICAgIGtleW1hc3Rlci5qc1xuLy8gICAgIChjKSAyMDExLTIwMTMgVGhvbWFzIEZ1Y2hzXG4vLyAgICAga2V5bWFzdGVyLmpzIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG47KGZ1bmN0aW9uKGdsb2JhbCl7XG4gIHZhciBrLFxuICAgIF9oYW5kbGVycyA9IHt9LFxuICAgIF9tb2RzID0geyAxNjogZmFsc2UsIDE4OiBmYWxzZSwgMTc6IGZhbHNlLCA5MTogZmFsc2UgfSxcbiAgICBfc2NvcGUgPSAnYWxsJyxcbiAgICAvLyBtb2RpZmllciBrZXlzXG4gICAgX01PRElGSUVSUyA9IHtcbiAgICAgICfih6cnOiAxNiwgc2hpZnQ6IDE2LFxuICAgICAgJ+KMpSc6IDE4LCBhbHQ6IDE4LCBvcHRpb246IDE4LFxuICAgICAgJ+KMgyc6IDE3LCBjdHJsOiAxNywgY29udHJvbDogMTcsXG4gICAgICAn4oyYJzogOTEsIGNvbW1hbmQ6IDkxXG4gICAgfSxcbiAgICAvLyBzcGVjaWFsIGtleXNcbiAgICBfTUFQID0ge1xuICAgICAgYmFja3NwYWNlOiA4LCB0YWI6IDksIGNsZWFyOiAxMixcbiAgICAgIGVudGVyOiAxMywgJ3JldHVybic6IDEzLFxuICAgICAgZXNjOiAyNywgZXNjYXBlOiAyNywgc3BhY2U6IDMyLFxuICAgICAgbGVmdDogMzcsIHVwOiAzOCxcbiAgICAgIHJpZ2h0OiAzOSwgZG93bjogNDAsXG4gICAgICBkZWw6IDQ2LCAnZGVsZXRlJzogNDYsXG4gICAgICBob21lOiAzNiwgZW5kOiAzNSxcbiAgICAgIHBhZ2V1cDogMzMsIHBhZ2Vkb3duOiAzNCxcbiAgICAgICcsJzogMTg4LCAnLic6IDE5MCwgJy8nOiAxOTEsXG4gICAgICAnYCc6IDE5MiwgJy0nOiAxODksICc9JzogMTg3LFxuICAgICAgJzsnOiAxODYsICdcXCcnOiAyMjIsXG4gICAgICAnWyc6IDIxOSwgJ10nOiAyMjEsICdcXFxcJzogMjIwXG4gICAgfSxcbiAgICBjb2RlID0gZnVuY3Rpb24oeCl7XG4gICAgICByZXR1cm4gX01BUFt4XSB8fCB4LnRvVXBwZXJDYXNlKCkuY2hhckNvZGVBdCgwKTtcbiAgICB9LFxuICAgIF9kb3duS2V5cyA9IFtdO1xuXG4gIGZvcihrPTE7azwyMDtrKyspIF9NQVBbJ2YnK2tdID0gMTExK2s7XG5cbiAgLy8gSUUgZG9lc24ndCBzdXBwb3J0IEFycmF5I2luZGV4T2YsIHNvIGhhdmUgYSBzaW1wbGUgcmVwbGFjZW1lbnRcbiAgZnVuY3Rpb24gaW5kZXgoYXJyYXksIGl0ZW0pe1xuICAgIHZhciBpID0gYXJyYXkubGVuZ3RoO1xuICAgIHdoaWxlKGktLSkgaWYoYXJyYXlbaV09PT1pdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICAvLyBmb3IgY29tcGFyaW5nIG1vZHMgYmVmb3JlIHVuYXNzaWdubWVudFxuICBmdW5jdGlvbiBjb21wYXJlQXJyYXkoYTEsIGEyKSB7XG4gICAgaWYgKGExLmxlbmd0aCAhPSBhMi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGExLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhMVtpXSAhPT0gYTJbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICB2YXIgbW9kaWZpZXJNYXAgPSB7XG4gICAgICAxNjonc2hpZnRLZXknLFxuICAgICAgMTg6J2FsdEtleScsXG4gICAgICAxNzonY3RybEtleScsXG4gICAgICA5MTonbWV0YUtleSdcbiAgfTtcbiAgZnVuY3Rpb24gdXBkYXRlTW9kaWZpZXJLZXkoZXZlbnQpIHtcbiAgICAgIGZvcihrIGluIF9tb2RzKSBfbW9kc1trXSA9IGV2ZW50W21vZGlmaWVyTWFwW2tdXTtcbiAgfTtcblxuICAvLyBoYW5kbGUga2V5ZG93biBldmVudFxuICBmdW5jdGlvbiBkaXNwYXRjaChldmVudCkge1xuICAgIHZhciBrZXksIGhhbmRsZXIsIGssIGksIG1vZGlmaWVyc01hdGNoLCBzY29wZTtcbiAgICBrZXkgPSBldmVudC5rZXlDb2RlO1xuXG4gICAgaWYgKGluZGV4KF9kb3duS2V5cywga2V5KSA9PSAtMSkge1xuICAgICAgICBfZG93bktleXMucHVzaChrZXkpO1xuICAgIH1cblxuICAgIC8vIGlmIGEgbW9kaWZpZXIga2V5LCBzZXQgdGhlIGtleS48bW9kaWZpZXJrZXluYW1lPiBwcm9wZXJ0eSB0byB0cnVlIGFuZCByZXR1cm5cbiAgICBpZihrZXkgPT0gOTMgfHwga2V5ID09IDIyNCkga2V5ID0gOTE7IC8vIHJpZ2h0IGNvbW1hbmQgb24gd2Via2l0LCBjb21tYW5kIG9uIEdlY2tvXG4gICAgaWYoa2V5IGluIF9tb2RzKSB7XG4gICAgICBfbW9kc1trZXldID0gdHJ1ZTtcbiAgICAgIC8vICdhc3NpZ25LZXknIGZyb20gaW5zaWRlIHRoaXMgY2xvc3VyZSBpcyBleHBvcnRlZCB0byB3aW5kb3cua2V5XG4gICAgICBmb3IoayBpbiBfTU9ESUZJRVJTKSBpZihfTU9ESUZJRVJTW2tdID09IGtleSkgYXNzaWduS2V5W2tdID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdXBkYXRlTW9kaWZpZXJLZXkoZXZlbnQpO1xuXG4gICAgLy8gc2VlIGlmIHdlIG5lZWQgdG8gaWdub3JlIHRoZSBrZXlwcmVzcyAoZmlsdGVyKCkgY2FuIGNhbiBiZSBvdmVycmlkZGVuKVxuICAgIC8vIGJ5IGRlZmF1bHQgaWdub3JlIGtleSBwcmVzc2VzIGlmIGEgc2VsZWN0LCB0ZXh0YXJlYSwgb3IgaW5wdXQgaXMgZm9jdXNlZFxuICAgIGlmKCFhc3NpZ25LZXkuZmlsdGVyLmNhbGwodGhpcywgZXZlbnQpKSByZXR1cm47XG5cbiAgICAvLyBhYm9ydCBpZiBubyBwb3RlbnRpYWxseSBtYXRjaGluZyBzaG9ydGN1dHMgZm91bmRcbiAgICBpZiAoIShrZXkgaW4gX2hhbmRsZXJzKSkgcmV0dXJuO1xuXG4gICAgc2NvcGUgPSBnZXRTY29wZSgpO1xuXG4gICAgLy8gZm9yIGVhY2ggcG90ZW50aWFsIHNob3J0Y3V0XG4gICAgZm9yIChpID0gMDsgaSA8IF9oYW5kbGVyc1trZXldLmxlbmd0aDsgaSsrKSB7XG4gICAgICBoYW5kbGVyID0gX2hhbmRsZXJzW2tleV1baV07XG5cbiAgICAgIC8vIHNlZSBpZiBpdCdzIGluIHRoZSBjdXJyZW50IHNjb3BlXG4gICAgICBpZihoYW5kbGVyLnNjb3BlID09IHNjb3BlIHx8IGhhbmRsZXIuc2NvcGUgPT0gJ2FsbCcpe1xuICAgICAgICAvLyBjaGVjayBpZiBtb2RpZmllcnMgbWF0Y2ggaWYgYW55XG4gICAgICAgIG1vZGlmaWVyc01hdGNoID0gaGFuZGxlci5tb2RzLmxlbmd0aCA+IDA7XG4gICAgICAgIGZvcihrIGluIF9tb2RzKVxuICAgICAgICAgIGlmKCghX21vZHNba10gJiYgaW5kZXgoaGFuZGxlci5tb2RzLCAraykgPiAtMSkgfHxcbiAgICAgICAgICAgIChfbW9kc1trXSAmJiBpbmRleChoYW5kbGVyLm1vZHMsICtrKSA9PSAtMSkpIG1vZGlmaWVyc01hdGNoID0gZmFsc2U7XG4gICAgICAgIC8vIGNhbGwgdGhlIGhhbmRsZXIgYW5kIHN0b3AgdGhlIGV2ZW50IGlmIG5lY2Nlc3NhcnlcbiAgICAgICAgaWYoKGhhbmRsZXIubW9kcy5sZW5ndGggPT0gMCAmJiAhX21vZHNbMTZdICYmICFfbW9kc1sxOF0gJiYgIV9tb2RzWzE3XSAmJiAhX21vZHNbOTFdKSB8fCBtb2RpZmllcnNNYXRjaCl7XG4gICAgICAgICAgaWYoaGFuZGxlci5tZXRob2QoZXZlbnQsIGhhbmRsZXIpPT09ZmFsc2Upe1xuICAgICAgICAgICAgaWYoZXZlbnQucHJldmVudERlZmF1bHQpIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIGVsc2UgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmKGV2ZW50LnN0b3BQcm9wYWdhdGlvbikgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBpZihldmVudC5jYW5jZWxCdWJibGUpIGV2ZW50LmNhbmNlbEJ1YmJsZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIHVuc2V0IG1vZGlmaWVyIGtleXMgb24ga2V5dXBcbiAgZnVuY3Rpb24gY2xlYXJNb2RpZmllcihldmVudCl7XG4gICAgdmFyIGtleSA9IGV2ZW50LmtleUNvZGUsIGssXG4gICAgICAgIGkgPSBpbmRleChfZG93bktleXMsIGtleSk7XG5cbiAgICAvLyByZW1vdmUga2V5IGZyb20gX2Rvd25LZXlzXG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgICBfZG93bktleXMuc3BsaWNlKGksIDEpO1xuICAgIH1cblxuICAgIGlmKGtleSA9PSA5MyB8fCBrZXkgPT0gMjI0KSBrZXkgPSA5MTtcbiAgICBpZihrZXkgaW4gX21vZHMpIHtcbiAgICAgIF9tb2RzW2tleV0gPSBmYWxzZTtcbiAgICAgIGZvcihrIGluIF9NT0RJRklFUlMpIGlmKF9NT0RJRklFUlNba10gPT0ga2V5KSBhc3NpZ25LZXlba10gPSBmYWxzZTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gcmVzZXRNb2RpZmllcnMoKSB7XG4gICAgZm9yKGsgaW4gX21vZHMpIF9tb2RzW2tdID0gZmFsc2U7XG4gICAgZm9yKGsgaW4gX01PRElGSUVSUykgYXNzaWduS2V5W2tdID0gZmFsc2U7XG4gIH07XG5cbiAgLy8gcGFyc2UgYW5kIGFzc2lnbiBzaG9ydGN1dFxuICBmdW5jdGlvbiBhc3NpZ25LZXkoa2V5LCBzY29wZSwgbWV0aG9kKXtcbiAgICB2YXIga2V5cywgbW9kcztcbiAgICBrZXlzID0gZ2V0S2V5cyhrZXkpO1xuICAgIGlmIChtZXRob2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgbWV0aG9kID0gc2NvcGU7XG4gICAgICBzY29wZSA9ICdhbGwnO1xuICAgIH1cblxuICAgIC8vIGZvciBlYWNoIHNob3J0Y3V0XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBzZXQgbW9kaWZpZXIga2V5cyBpZiBhbnlcbiAgICAgIG1vZHMgPSBbXTtcbiAgICAgIGtleSA9IGtleXNbaV0uc3BsaXQoJysnKTtcbiAgICAgIGlmIChrZXkubGVuZ3RoID4gMSl7XG4gICAgICAgIG1vZHMgPSBnZXRNb2RzKGtleSk7XG4gICAgICAgIGtleSA9IFtrZXlba2V5Lmxlbmd0aC0xXV07XG4gICAgICB9XG4gICAgICAvLyBjb252ZXJ0IHRvIGtleWNvZGUgYW5kLi4uXG4gICAgICBrZXkgPSBrZXlbMF1cbiAgICAgIGtleSA9IGNvZGUoa2V5KTtcbiAgICAgIC8vIC4uLnN0b3JlIGhhbmRsZXJcbiAgICAgIGlmICghKGtleSBpbiBfaGFuZGxlcnMpKSBfaGFuZGxlcnNba2V5XSA9IFtdO1xuICAgICAgX2hhbmRsZXJzW2tleV0ucHVzaCh7IHNob3J0Y3V0OiBrZXlzW2ldLCBzY29wZTogc2NvcGUsIG1ldGhvZDogbWV0aG9kLCBrZXk6IGtleXNbaV0sIG1vZHM6IG1vZHMgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIHVuYmluZCBhbGwgaGFuZGxlcnMgZm9yIGdpdmVuIGtleSBpbiBjdXJyZW50IHNjb3BlXG4gIGZ1bmN0aW9uIHVuYmluZEtleShrZXksIHNjb3BlKSB7XG4gICAgdmFyIG11bHRpcGxlS2V5cywga2V5cyxcbiAgICAgIG1vZHMgPSBbXSxcbiAgICAgIGksIGosIG9iajtcblxuICAgIG11bHRpcGxlS2V5cyA9IGdldEtleXMoa2V5KTtcblxuICAgIGZvciAoaiA9IDA7IGogPCBtdWx0aXBsZUtleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGtleXMgPSBtdWx0aXBsZUtleXNbal0uc3BsaXQoJysnKTtcblxuICAgICAgaWYgKGtleXMubGVuZ3RoID4gMSkge1xuICAgICAgICBtb2RzID0gZ2V0TW9kcyhrZXlzKTtcbiAgICAgICAga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICAgICAgfVxuXG4gICAgICBrZXkgPSBjb2RlKGtleSk7XG5cbiAgICAgIGlmIChzY29wZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNjb3BlID0gZ2V0U2NvcGUoKTtcbiAgICAgIH1cbiAgICAgIGlmICghX2hhbmRsZXJzW2tleV0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZm9yIChpID0gMDsgaSA8IF9oYW5kbGVyc1trZXldLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG9iaiA9IF9oYW5kbGVyc1trZXldW2ldO1xuICAgICAgICAvLyBvbmx5IGNsZWFyIGhhbmRsZXJzIGlmIGNvcnJlY3Qgc2NvcGUgYW5kIG1vZHMgbWF0Y2hcbiAgICAgICAgaWYgKG9iai5zY29wZSA9PT0gc2NvcGUgJiYgY29tcGFyZUFycmF5KG9iai5tb2RzLCBtb2RzKSkge1xuICAgICAgICAgIF9oYW5kbGVyc1trZXldW2ldID0ge307XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0cnVlIGlmIHRoZSBrZXkgd2l0aCBjb2RlICdrZXlDb2RlJyBpcyBjdXJyZW50bHkgZG93blxuICAvLyBDb252ZXJ0cyBzdHJpbmdzIGludG8ga2V5IGNvZGVzLlxuICBmdW5jdGlvbiBpc1ByZXNzZWQoa2V5Q29kZSkge1xuICAgICAgaWYgKHR5cGVvZihrZXlDb2RlKT09J3N0cmluZycpIHtcbiAgICAgICAga2V5Q29kZSA9IGNvZGUoa2V5Q29kZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaW5kZXgoX2Rvd25LZXlzLCBrZXlDb2RlKSAhPSAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFByZXNzZWRLZXlDb2RlcygpIHtcbiAgICAgIHJldHVybiBfZG93bktleXMuc2xpY2UoMCk7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXIoZXZlbnQpe1xuICAgIHZhciB0YWdOYW1lID0gKGV2ZW50LnRhcmdldCB8fCBldmVudC5zcmNFbGVtZW50KS50YWdOYW1lO1xuICAgIC8vIGlnbm9yZSBrZXlwcmVzc2VkIGluIGFueSBlbGVtZW50cyB0aGF0IHN1cHBvcnQga2V5Ym9hcmQgZGF0YSBpbnB1dFxuICAgIHJldHVybiAhKHRhZ05hbWUgPT0gJ0lOUFVUJyB8fCB0YWdOYW1lID09ICdTRUxFQ1QnIHx8IHRhZ05hbWUgPT0gJ1RFWFRBUkVBJyk7XG4gIH1cblxuICAvLyBpbml0aWFsaXplIGtleS48bW9kaWZpZXI+IHRvIGZhbHNlXG4gIGZvcihrIGluIF9NT0RJRklFUlMpIGFzc2lnbktleVtrXSA9IGZhbHNlO1xuXG4gIC8vIHNldCBjdXJyZW50IHNjb3BlIChkZWZhdWx0ICdhbGwnKVxuICBmdW5jdGlvbiBzZXRTY29wZShzY29wZSl7IF9zY29wZSA9IHNjb3BlIHx8ICdhbGwnIH07XG4gIGZ1bmN0aW9uIGdldFNjb3BlKCl7IHJldHVybiBfc2NvcGUgfHwgJ2FsbCcgfTtcblxuICAvLyBkZWxldGUgYWxsIGhhbmRsZXJzIGZvciBhIGdpdmVuIHNjb3BlXG4gIGZ1bmN0aW9uIGRlbGV0ZVNjb3BlKHNjb3BlKXtcbiAgICB2YXIga2V5LCBoYW5kbGVycywgaTtcblxuICAgIGZvciAoa2V5IGluIF9oYW5kbGVycykge1xuICAgICAgaGFuZGxlcnMgPSBfaGFuZGxlcnNba2V5XTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7ICkge1xuICAgICAgICBpZiAoaGFuZGxlcnNbaV0uc2NvcGUgPT09IHNjb3BlKSBoYW5kbGVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGVsc2UgaSsrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBhYnN0cmFjdCBrZXkgbG9naWMgZm9yIGFzc2lnbiBhbmQgdW5hc3NpZ25cbiAgZnVuY3Rpb24gZ2V0S2V5cyhrZXkpIHtcbiAgICB2YXIga2V5cztcbiAgICBrZXkgPSBrZXkucmVwbGFjZSgvXFxzL2csICcnKTtcbiAgICBrZXlzID0ga2V5LnNwbGl0KCcsJyk7XG4gICAgaWYgKChrZXlzW2tleXMubGVuZ3RoIC0gMV0pID09ICcnKSB7XG4gICAgICBrZXlzW2tleXMubGVuZ3RoIC0gMl0gKz0gJywnO1xuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIC8vIGFic3RyYWN0IG1vZHMgbG9naWMgZm9yIGFzc2lnbiBhbmQgdW5hc3NpZ25cbiAgZnVuY3Rpb24gZ2V0TW9kcyhrZXkpIHtcbiAgICB2YXIgbW9kcyA9IGtleS5zbGljZSgwLCBrZXkubGVuZ3RoIC0gMSk7XG4gICAgZm9yICh2YXIgbWkgPSAwOyBtaSA8IG1vZHMubGVuZ3RoOyBtaSsrKVxuICAgIG1vZHNbbWldID0gX01PRElGSUVSU1ttb2RzW21pXV07XG4gICAgcmV0dXJuIG1vZHM7XG4gIH1cblxuICAvLyBjcm9zcy1icm93c2VyIGV2ZW50c1xuICBmdW5jdGlvbiBhZGRFdmVudChvYmplY3QsIGV2ZW50LCBtZXRob2QpIHtcbiAgICBpZiAob2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIpXG4gICAgICBvYmplY3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbWV0aG9kLCBmYWxzZSk7XG4gICAgZWxzZSBpZihvYmplY3QuYXR0YWNoRXZlbnQpXG4gICAgICBvYmplY3QuYXR0YWNoRXZlbnQoJ29uJytldmVudCwgZnVuY3Rpb24oKXsgbWV0aG9kKHdpbmRvdy5ldmVudCkgfSk7XG4gIH07XG5cbiAgLy8gc2V0IHRoZSBoYW5kbGVycyBnbG9iYWxseSBvbiBkb2N1bWVudFxuICBhZGRFdmVudChkb2N1bWVudCwgJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkgeyBkaXNwYXRjaChldmVudCkgfSk7IC8vIFBhc3NpbmcgX3Njb3BlIHRvIGEgY2FsbGJhY2sgdG8gZW5zdXJlIGl0IHJlbWFpbnMgdGhlIHNhbWUgYnkgZXhlY3V0aW9uLiBGaXhlcyAjNDhcbiAgYWRkRXZlbnQoZG9jdW1lbnQsICdrZXl1cCcsIGNsZWFyTW9kaWZpZXIpO1xuXG4gIC8vIHJlc2V0IG1vZGlmaWVycyB0byBmYWxzZSB3aGVuZXZlciB0aGUgd2luZG93IGlzIChyZSlmb2N1c2VkLlxuICBhZGRFdmVudCh3aW5kb3csICdmb2N1cycsIHJlc2V0TW9kaWZpZXJzKTtcblxuICAvLyBzdG9yZSBwcmV2aW91c2x5IGRlZmluZWQga2V5XG4gIHZhciBwcmV2aW91c0tleSA9IGdsb2JhbC5rZXk7XG5cbiAgLy8gcmVzdG9yZSBwcmV2aW91c2x5IGRlZmluZWQga2V5IGFuZCByZXR1cm4gcmVmZXJlbmNlIHRvIG91ciBrZXkgb2JqZWN0XG4gIGZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG4gICAgdmFyIGsgPSBnbG9iYWwua2V5O1xuICAgIGdsb2JhbC5rZXkgPSBwcmV2aW91c0tleTtcbiAgICByZXR1cm4gaztcbiAgfVxuXG4gIC8vIHNldCB3aW5kb3cua2V5IGFuZCB3aW5kb3cua2V5LnNldC9nZXQvZGVsZXRlU2NvcGUsIGFuZCB0aGUgZGVmYXVsdCBmaWx0ZXJcbiAgZ2xvYmFsLmtleSA9IGFzc2lnbktleTtcbiAgZ2xvYmFsLmtleS5zZXRTY29wZSA9IHNldFNjb3BlO1xuICBnbG9iYWwua2V5LmdldFNjb3BlID0gZ2V0U2NvcGU7XG4gIGdsb2JhbC5rZXkuZGVsZXRlU2NvcGUgPSBkZWxldGVTY29wZTtcbiAgZ2xvYmFsLmtleS5maWx0ZXIgPSBmaWx0ZXI7XG4gIGdsb2JhbC5rZXkuaXNQcmVzc2VkID0gaXNQcmVzc2VkO1xuICBnbG9iYWwua2V5LmdldFByZXNzZWRLZXlDb2RlcyA9IGdldFByZXNzZWRLZXlDb2RlcztcbiAgZ2xvYmFsLmtleS5ub0NvbmZsaWN0ID0gbm9Db25mbGljdDtcbiAgZ2xvYmFsLmtleS51bmJpbmQgPSB1bmJpbmRLZXk7XG5cbiAgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIG1vZHVsZS5leHBvcnRzID0gYXNzaWduS2V5O1xuXG59KSh0aGlzKTtcbiIsIi8qXG5QTm90aWZ5IDMuMC4wIHNjaWFjdGl2ZS5jb20vcG5vdGlmeS9cbihDKSAyMDE1IEh1bnRlciBQZXJyaW47IEdvb2dsZSwgSW5jLlxubGljZW5zZSBBcGFjaGUtMi4wXG4qL1xuKGZ1bmN0aW9uKGIsayl7XCJmdW5jdGlvblwiPT09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZD9kZWZpbmUoXCJwbm90aWZ5XCIsW1wianF1ZXJ5XCJdLGZ1bmN0aW9uKHEpe3JldHVybiBrKHEsYil9KTpcIm9iamVjdFwiPT09dHlwZW9mIGV4cG9ydHMmJlwidW5kZWZpbmVkXCIhPT10eXBlb2YgbW9kdWxlP21vZHVsZS5leHBvcnRzPWsoKHdpbmRvdy4kKSxnbG9iYWx8fGIpOmIuUE5vdGlmeT1rKGIualF1ZXJ5LGIpfSkodGhpcyxmdW5jdGlvbihiLGspe3ZhciBxPWZ1bmN0aW9uKGwpe3ZhciBrPXtkaXIxOlwiZG93blwiLGRpcjI6XCJsZWZ0XCIscHVzaDpcImJvdHRvbVwiLHNwYWNpbmcxOjM2LHNwYWNpbmcyOjM2LGNvbnRleHQ6YihcImJvZHlcIiksbW9kYWw6ITF9LGcsaCxuPWIobCkscj1mdW5jdGlvbigpe2g9YihcImJvZHlcIik7ZC5wcm90b3R5cGUub3B0aW9ucy5zdGFjay5jb250ZXh0PWg7bj1iKGwpO24uYmluZChcInJlc2l6ZVwiLGZ1bmN0aW9uKCl7ZyYmY2xlYXJUaW1lb3V0KGcpO2c9c2V0VGltZW91dChmdW5jdGlvbigpe2QucG9zaXRpb25BbGwoITApfSxcbjEwKX0pfSxzPWZ1bmN0aW9uKGMpe3ZhciBhPWIoXCI8ZGl2IC8+XCIse1wiY2xhc3NcIjpcInVpLXBub3RpZnktbW9kYWwtb3ZlcmxheVwifSk7YS5wcmVwZW5kVG8oYy5jb250ZXh0KTtjLm92ZXJsYXlfY2xvc2UmJmEuY2xpY2soZnVuY3Rpb24oKXtkLnJlbW92ZVN0YWNrKGMpfSk7cmV0dXJuIGF9LGQ9ZnVuY3Rpb24oYyl7dGhpcy5wYXJzZU9wdGlvbnMoYyk7dGhpcy5pbml0KCl9O2IuZXh0ZW5kKGQucHJvdG90eXBlLHt2ZXJzaW9uOlwiMy4wLjBcIixvcHRpb25zOnt0aXRsZTohMSx0aXRsZV9lc2NhcGU6ITEsdGV4dDohMSx0ZXh0X2VzY2FwZTohMSxzdHlsaW5nOlwiYnJpZ2h0dGhlbWVcIixhZGRjbGFzczpcIlwiLGNvcm5lcmNsYXNzOlwiXCIsYXV0b19kaXNwbGF5OiEwLHdpZHRoOlwiMzAwcHhcIixtaW5faGVpZ2h0OlwiMTZweFwiLHR5cGU6XCJub3RpY2VcIixpY29uOiEwLGFuaW1hdGlvbjpcImZhZGVcIixhbmltYXRlX3NwZWVkOlwibm9ybWFsXCIsc2hhZG93OiEwLGhpZGU6ITAsZGVsYXk6OEUzLG1vdXNlX3Jlc2V0OiEwLFxucmVtb3ZlOiEwLGluc2VydF9icnM6ITAsZGVzdHJveTohMCxzdGFjazprfSxtb2R1bGVzOnt9LHJ1bk1vZHVsZXM6ZnVuY3Rpb24oYyxhKXt2YXIgcCxiO2ZvcihiIGluIHRoaXMubW9kdWxlcylwPVwib2JqZWN0XCI9PT10eXBlb2YgYSYmYiBpbiBhP2FbYl06YSxcImZ1bmN0aW9uXCI9PT10eXBlb2YgdGhpcy5tb2R1bGVzW2JdW2NdJiYodGhpcy5tb2R1bGVzW2JdLm5vdGljZT10aGlzLHRoaXMubW9kdWxlc1tiXS5vcHRpb25zPVwib2JqZWN0XCI9PT10eXBlb2YgdGhpcy5vcHRpb25zW2JdP3RoaXMub3B0aW9uc1tiXTp7fSx0aGlzLm1vZHVsZXNbYl1bY10odGhpcyxcIm9iamVjdFwiPT09dHlwZW9mIHRoaXMub3B0aW9uc1tiXT90aGlzLm9wdGlvbnNbYl06e30scCkpfSxzdGF0ZTpcImluaXRpYWxpemluZ1wiLHRpbWVyOm51bGwsYW5pbVRpbWVyOm51bGwsc3R5bGVzOm51bGwsZWxlbTpudWxsLGNvbnRhaW5lcjpudWxsLHRpdGxlX2NvbnRhaW5lcjpudWxsLHRleHRfY29udGFpbmVyOm51bGwsYW5pbWF0aW5nOiExLFxudGltZXJIaWRlOiExLGluaXQ6ZnVuY3Rpb24oKXt2YXIgYz10aGlzO3RoaXMubW9kdWxlcz17fTtiLmV4dGVuZCghMCx0aGlzLm1vZHVsZXMsZC5wcm90b3R5cGUubW9kdWxlcyk7dGhpcy5zdHlsZXM9XCJvYmplY3RcIj09PXR5cGVvZiB0aGlzLm9wdGlvbnMuc3R5bGluZz90aGlzLm9wdGlvbnMuc3R5bGluZzpkLnN0eWxpbmdbdGhpcy5vcHRpb25zLnN0eWxpbmddO3RoaXMuZWxlbT1iKFwiPGRpdiAvPlwiLHtcImNsYXNzXCI6XCJ1aS1wbm90aWZ5IFwiK3RoaXMub3B0aW9ucy5hZGRjbGFzcyxjc3M6e2Rpc3BsYXk6XCJub25lXCJ9LFwiYXJpYS1saXZlXCI6XCJhc3NlcnRpdmVcIixcImFyaWEtcm9sZVwiOlwiYWxlcnRkaWFsb2dcIixtb3VzZWVudGVyOmZ1bmN0aW9uKGEpe2lmKGMub3B0aW9ucy5tb3VzZV9yZXNldCYmXCJvdXRcIj09PWMuYW5pbWF0aW5nKXtpZighYy50aW1lckhpZGUpcmV0dXJuO2MuY2FuY2VsUmVtb3ZlKCl9Yy5vcHRpb25zLmhpZGUmJmMub3B0aW9ucy5tb3VzZV9yZXNldCYmYy5jYW5jZWxSZW1vdmUoKX0sXG5tb3VzZWxlYXZlOmZ1bmN0aW9uKGEpe2Mub3B0aW9ucy5oaWRlJiZjLm9wdGlvbnMubW91c2VfcmVzZXQmJlwib3V0XCIhPT1jLmFuaW1hdGluZyYmYy5xdWV1ZVJlbW92ZSgpO2QucG9zaXRpb25BbGwoKX19KTtcImZhZGVcIj09PXRoaXMub3B0aW9ucy5hbmltYXRpb24mJnRoaXMuZWxlbS5hZGRDbGFzcyhcInVpLXBub3RpZnktZmFkZS1cIit0aGlzLm9wdGlvbnMuYW5pbWF0ZV9zcGVlZCk7dGhpcy5jb250YWluZXI9YihcIjxkaXYgLz5cIix7XCJjbGFzc1wiOnRoaXMuc3R5bGVzLmNvbnRhaW5lcitcIiB1aS1wbm90aWZ5LWNvbnRhaW5lciBcIisoXCJlcnJvclwiPT09dGhpcy5vcHRpb25zLnR5cGU/dGhpcy5zdHlsZXMuZXJyb3I6XCJpbmZvXCI9PT10aGlzLm9wdGlvbnMudHlwZT90aGlzLnN0eWxlcy5pbmZvOlwic3VjY2Vzc1wiPT09dGhpcy5vcHRpb25zLnR5cGU/dGhpcy5zdHlsZXMuc3VjY2Vzczp0aGlzLnN0eWxlcy5ub3RpY2UpLHJvbGU6XCJhbGVydFwifSkuYXBwZW5kVG8odGhpcy5lbGVtKTtcIlwiIT09XG50aGlzLm9wdGlvbnMuY29ybmVyY2xhc3MmJnRoaXMuY29udGFpbmVyLnJlbW92ZUNsYXNzKFwidWktY29ybmVyLWFsbFwiKS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuY29ybmVyY2xhc3MpO3RoaXMub3B0aW9ucy5zaGFkb3cmJnRoaXMuY29udGFpbmVyLmFkZENsYXNzKFwidWktcG5vdGlmeS1zaGFkb3dcIik7ITEhPT10aGlzLm9wdGlvbnMuaWNvbiYmYihcIjxkaXYgLz5cIix7XCJjbGFzc1wiOlwidWktcG5vdGlmeS1pY29uXCJ9KS5hcHBlbmQoYihcIjxzcGFuIC8+XCIse1wiY2xhc3NcIjohMD09PXRoaXMub3B0aW9ucy5pY29uP1wiZXJyb3JcIj09PXRoaXMub3B0aW9ucy50eXBlP3RoaXMuc3R5bGVzLmVycm9yX2ljb246XCJpbmZvXCI9PT10aGlzLm9wdGlvbnMudHlwZT90aGlzLnN0eWxlcy5pbmZvX2ljb246XCJzdWNjZXNzXCI9PT10aGlzLm9wdGlvbnMudHlwZT90aGlzLnN0eWxlcy5zdWNjZXNzX2ljb246dGhpcy5zdHlsZXMubm90aWNlX2ljb246dGhpcy5vcHRpb25zLmljb259KSkucHJlcGVuZFRvKHRoaXMuY29udGFpbmVyKTtcbnRoaXMudGl0bGVfY29udGFpbmVyPWIoXCI8aDQgLz5cIix7XCJjbGFzc1wiOlwidWktcG5vdGlmeS10aXRsZVwifSkuYXBwZW5kVG8odGhpcy5jb250YWluZXIpOyExPT09dGhpcy5vcHRpb25zLnRpdGxlP3RoaXMudGl0bGVfY29udGFpbmVyLmhpZGUoKTp0aGlzLm9wdGlvbnMudGl0bGVfZXNjYXBlP3RoaXMudGl0bGVfY29udGFpbmVyLnRleHQodGhpcy5vcHRpb25zLnRpdGxlKTp0aGlzLnRpdGxlX2NvbnRhaW5lci5odG1sKHRoaXMub3B0aW9ucy50aXRsZSk7dGhpcy50ZXh0X2NvbnRhaW5lcj1iKFwiPGRpdiAvPlwiLHtcImNsYXNzXCI6XCJ1aS1wbm90aWZ5LXRleHRcIixcImFyaWEtcm9sZVwiOlwiYWxlcnRcIn0pLmFwcGVuZFRvKHRoaXMuY29udGFpbmVyKTshMT09PXRoaXMub3B0aW9ucy50ZXh0P3RoaXMudGV4dF9jb250YWluZXIuaGlkZSgpOnRoaXMub3B0aW9ucy50ZXh0X2VzY2FwZT90aGlzLnRleHRfY29udGFpbmVyLnRleHQodGhpcy5vcHRpb25zLnRleHQpOnRoaXMudGV4dF9jb250YWluZXIuaHRtbCh0aGlzLm9wdGlvbnMuaW5zZXJ0X2Jycz9cblN0cmluZyh0aGlzLm9wdGlvbnMudGV4dCkucmVwbGFjZSgvXFxuL2csXCI8YnIgLz5cIik6dGhpcy5vcHRpb25zLnRleHQpO1wic3RyaW5nXCI9PT10eXBlb2YgdGhpcy5vcHRpb25zLndpZHRoJiZ0aGlzLmVsZW0uY3NzKFwid2lkdGhcIix0aGlzLm9wdGlvbnMud2lkdGgpO1wic3RyaW5nXCI9PT10eXBlb2YgdGhpcy5vcHRpb25zLm1pbl9oZWlnaHQmJnRoaXMuY29udGFpbmVyLmNzcyhcIm1pbi1oZWlnaHRcIix0aGlzLm9wdGlvbnMubWluX2hlaWdodCk7ZC5ub3RpY2VzPVwidG9wXCI9PT10aGlzLm9wdGlvbnMuc3RhY2sucHVzaD9iLm1lcmdlKFt0aGlzXSxkLm5vdGljZXMpOmIubWVyZ2UoZC5ub3RpY2VzLFt0aGlzXSk7XCJ0b3BcIj09PXRoaXMub3B0aW9ucy5zdGFjay5wdXNoJiZ0aGlzLnF1ZXVlUG9zaXRpb24oITEsMSk7dGhpcy5vcHRpb25zLnN0YWNrLmFuaW1hdGlvbj0hMTt0aGlzLnJ1bk1vZHVsZXMoXCJpbml0XCIpO3RoaXMub3B0aW9ucy5hdXRvX2Rpc3BsYXkmJnRoaXMub3BlbigpO3JldHVybiB0aGlzfSxcbnVwZGF0ZTpmdW5jdGlvbihjKXt2YXIgYT10aGlzLm9wdGlvbnM7dGhpcy5wYXJzZU9wdGlvbnMoYSxjKTt0aGlzLmVsZW0ucmVtb3ZlQ2xhc3MoXCJ1aS1wbm90aWZ5LWZhZGUtc2xvdyB1aS1wbm90aWZ5LWZhZGUtbm9ybWFsIHVpLXBub3RpZnktZmFkZS1mYXN0XCIpO1wiZmFkZVwiPT09dGhpcy5vcHRpb25zLmFuaW1hdGlvbiYmdGhpcy5lbGVtLmFkZENsYXNzKFwidWktcG5vdGlmeS1mYWRlLVwiK3RoaXMub3B0aW9ucy5hbmltYXRlX3NwZWVkKTt0aGlzLm9wdGlvbnMuY29ybmVyY2xhc3MhPT1hLmNvcm5lcmNsYXNzJiZ0aGlzLmNvbnRhaW5lci5yZW1vdmVDbGFzcyhcInVpLWNvcm5lci1hbGwgXCIrYS5jb3JuZXJjbGFzcykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNvcm5lcmNsYXNzKTt0aGlzLm9wdGlvbnMuc2hhZG93IT09YS5zaGFkb3cmJih0aGlzLm9wdGlvbnMuc2hhZG93P3RoaXMuY29udGFpbmVyLmFkZENsYXNzKFwidWktcG5vdGlmeS1zaGFkb3dcIik6dGhpcy5jb250YWluZXIucmVtb3ZlQ2xhc3MoXCJ1aS1wbm90aWZ5LXNoYWRvd1wiKSk7XG4hMT09PXRoaXMub3B0aW9ucy5hZGRjbGFzcz90aGlzLmVsZW0ucmVtb3ZlQ2xhc3MoYS5hZGRjbGFzcyk6dGhpcy5vcHRpb25zLmFkZGNsYXNzIT09YS5hZGRjbGFzcyYmdGhpcy5lbGVtLnJlbW92ZUNsYXNzKGEuYWRkY2xhc3MpLmFkZENsYXNzKHRoaXMub3B0aW9ucy5hZGRjbGFzcyk7ITE9PT10aGlzLm9wdGlvbnMudGl0bGU/dGhpcy50aXRsZV9jb250YWluZXIuc2xpZGVVcChcImZhc3RcIik6dGhpcy5vcHRpb25zLnRpdGxlIT09YS50aXRsZSYmKHRoaXMub3B0aW9ucy50aXRsZV9lc2NhcGU/dGhpcy50aXRsZV9jb250YWluZXIudGV4dCh0aGlzLm9wdGlvbnMudGl0bGUpOnRoaXMudGl0bGVfY29udGFpbmVyLmh0bWwodGhpcy5vcHRpb25zLnRpdGxlKSwhMT09PWEudGl0bGUmJnRoaXMudGl0bGVfY29udGFpbmVyLnNsaWRlRG93bigyMDApKTshMT09PXRoaXMub3B0aW9ucy50ZXh0P3RoaXMudGV4dF9jb250YWluZXIuc2xpZGVVcChcImZhc3RcIik6dGhpcy5vcHRpb25zLnRleHQhPT1cbmEudGV4dCYmKHRoaXMub3B0aW9ucy50ZXh0X2VzY2FwZT90aGlzLnRleHRfY29udGFpbmVyLnRleHQodGhpcy5vcHRpb25zLnRleHQpOnRoaXMudGV4dF9jb250YWluZXIuaHRtbCh0aGlzLm9wdGlvbnMuaW5zZXJ0X2Jycz9TdHJpbmcodGhpcy5vcHRpb25zLnRleHQpLnJlcGxhY2UoL1xcbi9nLFwiPGJyIC8+XCIpOnRoaXMub3B0aW9ucy50ZXh0KSwhMT09PWEudGV4dCYmdGhpcy50ZXh0X2NvbnRhaW5lci5zbGlkZURvd24oMjAwKSk7dGhpcy5vcHRpb25zLnR5cGUhPT1hLnR5cGUmJnRoaXMuY29udGFpbmVyLnJlbW92ZUNsYXNzKHRoaXMuc3R5bGVzLmVycm9yK1wiIFwiK3RoaXMuc3R5bGVzLm5vdGljZStcIiBcIit0aGlzLnN0eWxlcy5zdWNjZXNzK1wiIFwiK3RoaXMuc3R5bGVzLmluZm8pLmFkZENsYXNzKFwiZXJyb3JcIj09PXRoaXMub3B0aW9ucy50eXBlP3RoaXMuc3R5bGVzLmVycm9yOlwiaW5mb1wiPT09dGhpcy5vcHRpb25zLnR5cGU/dGhpcy5zdHlsZXMuaW5mbzpcInN1Y2Nlc3NcIj09PXRoaXMub3B0aW9ucy50eXBlP1xudGhpcy5zdHlsZXMuc3VjY2Vzczp0aGlzLnN0eWxlcy5ub3RpY2UpO2lmKHRoaXMub3B0aW9ucy5pY29uIT09YS5pY29ufHwhMD09PXRoaXMub3B0aW9ucy5pY29uJiZ0aGlzLm9wdGlvbnMudHlwZSE9PWEudHlwZSl0aGlzLmNvbnRhaW5lci5maW5kKFwiZGl2LnVpLXBub3RpZnktaWNvblwiKS5yZW1vdmUoKSwhMSE9PXRoaXMub3B0aW9ucy5pY29uJiZiKFwiPGRpdiAvPlwiLHtcImNsYXNzXCI6XCJ1aS1wbm90aWZ5LWljb25cIn0pLmFwcGVuZChiKFwiPHNwYW4gLz5cIix7XCJjbGFzc1wiOiEwPT09dGhpcy5vcHRpb25zLmljb24/XCJlcnJvclwiPT09dGhpcy5vcHRpb25zLnR5cGU/dGhpcy5zdHlsZXMuZXJyb3JfaWNvbjpcImluZm9cIj09PXRoaXMub3B0aW9ucy50eXBlP3RoaXMuc3R5bGVzLmluZm9faWNvbjpcInN1Y2Nlc3NcIj09PXRoaXMub3B0aW9ucy50eXBlP3RoaXMuc3R5bGVzLnN1Y2Nlc3NfaWNvbjp0aGlzLnN0eWxlcy5ub3RpY2VfaWNvbjp0aGlzLm9wdGlvbnMuaWNvbn0pKS5wcmVwZW5kVG8odGhpcy5jb250YWluZXIpO1xudGhpcy5vcHRpb25zLndpZHRoIT09YS53aWR0aCYmdGhpcy5lbGVtLmFuaW1hdGUoe3dpZHRoOnRoaXMub3B0aW9ucy53aWR0aH0pO3RoaXMub3B0aW9ucy5taW5faGVpZ2h0IT09YS5taW5faGVpZ2h0JiZ0aGlzLmNvbnRhaW5lci5hbmltYXRlKHttaW5IZWlnaHQ6dGhpcy5vcHRpb25zLm1pbl9oZWlnaHR9KTt0aGlzLm9wdGlvbnMuaGlkZT9hLmhpZGV8fHRoaXMucXVldWVSZW1vdmUoKTp0aGlzLmNhbmNlbFJlbW92ZSgpO3RoaXMucXVldWVQb3NpdGlvbighMCk7dGhpcy5ydW5Nb2R1bGVzKFwidXBkYXRlXCIsYSk7cmV0dXJuIHRoaXN9LG9wZW46ZnVuY3Rpb24oKXt0aGlzLnN0YXRlPVwib3BlbmluZ1wiO3RoaXMucnVuTW9kdWxlcyhcImJlZm9yZU9wZW5cIik7dmFyIGM9dGhpczt0aGlzLmVsZW0ucGFyZW50KCkubGVuZ3RofHx0aGlzLmVsZW0uYXBwZW5kVG8odGhpcy5vcHRpb25zLnN0YWNrLmNvbnRleHQ/dGhpcy5vcHRpb25zLnN0YWNrLmNvbnRleHQ6aCk7XCJ0b3BcIiE9PXRoaXMub3B0aW9ucy5zdGFjay5wdXNoJiZcbnRoaXMucG9zaXRpb24oITApO3RoaXMuYW5pbWF0ZUluKGZ1bmN0aW9uKCl7Yy5xdWV1ZVBvc2l0aW9uKCEwKTtjLm9wdGlvbnMuaGlkZSYmYy5xdWV1ZVJlbW92ZSgpO2Muc3RhdGU9XCJvcGVuXCI7Yy5ydW5Nb2R1bGVzKFwiYWZ0ZXJPcGVuXCIpfSk7cmV0dXJuIHRoaXN9LHJlbW92ZTpmdW5jdGlvbihjKXt0aGlzLnN0YXRlPVwiY2xvc2luZ1wiO3RoaXMudGltZXJIaWRlPSEhYzt0aGlzLnJ1bk1vZHVsZXMoXCJiZWZvcmVDbG9zZVwiKTt2YXIgYT10aGlzO3RoaXMudGltZXImJihsLmNsZWFyVGltZW91dCh0aGlzLnRpbWVyKSx0aGlzLnRpbWVyPW51bGwpO3RoaXMuYW5pbWF0ZU91dChmdW5jdGlvbigpe2Euc3RhdGU9XCJjbG9zZWRcIjthLnJ1bk1vZHVsZXMoXCJhZnRlckNsb3NlXCIpO2EucXVldWVQb3NpdGlvbighMCk7YS5vcHRpb25zLnJlbW92ZSYmYS5lbGVtLmRldGFjaCgpO2EucnVuTW9kdWxlcyhcImJlZm9yZURlc3Ryb3lcIik7aWYoYS5vcHRpb25zLmRlc3Ryb3kmJm51bGwhPT1kLm5vdGljZXMpe3ZhciBjPVxuYi5pbkFycmF5KGEsZC5ub3RpY2VzKTstMSE9PWMmJmQubm90aWNlcy5zcGxpY2UoYywxKX1hLnJ1bk1vZHVsZXMoXCJhZnRlckRlc3Ryb3lcIil9KTtyZXR1cm4gdGhpc30sZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuZWxlbX0scGFyc2VPcHRpb25zOmZ1bmN0aW9uKGMsYSl7dGhpcy5vcHRpb25zPWIuZXh0ZW5kKCEwLHt9LGQucHJvdG90eXBlLm9wdGlvbnMpO3RoaXMub3B0aW9ucy5zdGFjaz1kLnByb3RvdHlwZS5vcHRpb25zLnN0YWNrO2Zvcih2YXIgcD1bYyxhXSxtLGY9MDtmPHAubGVuZ3RoO2YrKyl7bT1wW2ZdO2lmKFwidW5kZWZpbmVkXCI9PT10eXBlb2YgbSlicmVhaztpZihcIm9iamVjdFwiIT09dHlwZW9mIG0pdGhpcy5vcHRpb25zLnRleHQ9bTtlbHNlIGZvcih2YXIgZSBpbiBtKXRoaXMubW9kdWxlc1tlXT9iLmV4dGVuZCghMCx0aGlzLm9wdGlvbnNbZV0sbVtlXSk6dGhpcy5vcHRpb25zW2VdPW1bZV19fSxhbmltYXRlSW46ZnVuY3Rpb24oYyl7dGhpcy5hbmltYXRpbmc9XG5cImluXCI7dmFyIGE9dGhpcztjPWZ1bmN0aW9uKCl7YS5hbmltVGltZXImJmNsZWFyVGltZW91dChhLmFuaW1UaW1lcik7XCJpblwiPT09YS5hbmltYXRpbmcmJihhLmVsZW0uaXMoXCI6dmlzaWJsZVwiKT8odGhpcyYmdGhpcy5jYWxsKCksYS5hbmltYXRpbmc9ITEpOmEuYW5pbVRpbWVyPXNldFRpbWVvdXQoYyw0MCkpfS5iaW5kKGMpO1wiZmFkZVwiPT09dGhpcy5vcHRpb25zLmFuaW1hdGlvbj8odGhpcy5lbGVtLm9uZShcIndlYmtpdFRyYW5zaXRpb25FbmQgbW96VHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgdHJhbnNpdGlvbmVuZFwiLGMpLmFkZENsYXNzKFwidWktcG5vdGlmeS1pblwiKSx0aGlzLmVsZW0uY3NzKFwib3BhY2l0eVwiKSx0aGlzLmVsZW0uYWRkQ2xhc3MoXCJ1aS1wbm90aWZ5LWZhZGUtaW5cIiksdGhpcy5hbmltVGltZXI9c2V0VGltZW91dChjLDY1MCkpOih0aGlzLmVsZW0uYWRkQ2xhc3MoXCJ1aS1wbm90aWZ5LWluXCIpLGMoKSl9LGFuaW1hdGVPdXQ6ZnVuY3Rpb24oYyl7dGhpcy5hbmltYXRpbmc9XG5cIm91dFwiO3ZhciBhPXRoaXM7Yz1mdW5jdGlvbigpe2EuYW5pbVRpbWVyJiZjbGVhclRpbWVvdXQoYS5hbmltVGltZXIpO1wib3V0XCI9PT1hLmFuaW1hdGluZyYmKFwiMFwiIT1hLmVsZW0uY3NzKFwib3BhY2l0eVwiKSYmYS5lbGVtLmlzKFwiOnZpc2libGVcIik/YS5hbmltVGltZXI9c2V0VGltZW91dChjLDQwKTooYS5lbGVtLnJlbW92ZUNsYXNzKFwidWktcG5vdGlmeS1pblwiKSx0aGlzJiZ0aGlzLmNhbGwoKSxhLmFuaW1hdGluZz0hMSkpfS5iaW5kKGMpO1wiZmFkZVwiPT09dGhpcy5vcHRpb25zLmFuaW1hdGlvbj8odGhpcy5lbGVtLm9uZShcIndlYmtpdFRyYW5zaXRpb25FbmQgbW96VHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgdHJhbnNpdGlvbmVuZFwiLGMpLnJlbW92ZUNsYXNzKFwidWktcG5vdGlmeS1mYWRlLWluXCIpLHRoaXMuYW5pbVRpbWVyPXNldFRpbWVvdXQoYyw2NTApKToodGhpcy5lbGVtLnJlbW92ZUNsYXNzKFwidWktcG5vdGlmeS1pblwiKSxjKCkpfSxwb3NpdGlvbjpmdW5jdGlvbihjKXt2YXIgYT1cbnRoaXMub3B0aW9ucy5zdGFjayxiPXRoaXMuZWxlbTtcInVuZGVmaW5lZFwiPT09dHlwZW9mIGEuY29udGV4dCYmKGEuY29udGV4dD1oKTtpZihhKXtcIm51bWJlclwiIT09dHlwZW9mIGEubmV4dHBvczEmJihhLm5leHRwb3MxPWEuZmlyc3Rwb3MxKTtcIm51bWJlclwiIT09dHlwZW9mIGEubmV4dHBvczImJihhLm5leHRwb3MyPWEuZmlyc3Rwb3MyKTtcIm51bWJlclwiIT09dHlwZW9mIGEuYWRkcG9zMiYmKGEuYWRkcG9zMj0wKTt2YXIgZD0hYi5oYXNDbGFzcyhcInVpLXBub3RpZnktaW5cIik7aWYoIWR8fGMpe2EubW9kYWwmJihhLm92ZXJsYXk/YS5vdmVybGF5LnNob3coKTphLm92ZXJsYXk9cyhhKSk7Yi5hZGRDbGFzcyhcInVpLXBub3RpZnktbW92ZVwiKTt2YXIgZjtzd2l0Y2goYS5kaXIxKXtjYXNlIFwiZG93blwiOmY9XCJ0b3BcIjticmVhaztjYXNlIFwidXBcIjpmPVwiYm90dG9tXCI7YnJlYWs7Y2FzZSBcImxlZnRcIjpmPVwicmlnaHRcIjticmVhaztjYXNlIFwicmlnaHRcIjpmPVwibGVmdFwifWM9cGFyc2VJbnQoYi5jc3MoZikucmVwbGFjZSgvKD86XFwuLip8W14wLTkuXSkvZyxcblwiXCIpKTtpc05hTihjKSYmKGM9MCk7XCJ1bmRlZmluZWRcIiE9PXR5cGVvZiBhLmZpcnN0cG9zMXx8ZHx8KGEuZmlyc3Rwb3MxPWMsYS5uZXh0cG9zMT1hLmZpcnN0cG9zMSk7dmFyIGU7c3dpdGNoKGEuZGlyMil7Y2FzZSBcImRvd25cIjplPVwidG9wXCI7YnJlYWs7Y2FzZSBcInVwXCI6ZT1cImJvdHRvbVwiO2JyZWFrO2Nhc2UgXCJsZWZ0XCI6ZT1cInJpZ2h0XCI7YnJlYWs7Y2FzZSBcInJpZ2h0XCI6ZT1cImxlZnRcIn1jPXBhcnNlSW50KGIuY3NzKGUpLnJlcGxhY2UoLyg/OlxcLi4qfFteMC05Ll0pL2csXCJcIikpO2lzTmFOKGMpJiYoYz0wKTtcInVuZGVmaW5lZFwiIT09dHlwZW9mIGEuZmlyc3Rwb3MyfHxkfHwoYS5maXJzdHBvczI9YyxhLm5leHRwb3MyPWEuZmlyc3Rwb3MyKTtpZihcImRvd25cIj09PWEuZGlyMSYmYS5uZXh0cG9zMStiLmhlaWdodCgpPihhLmNvbnRleHQuaXMoaCk/bi5oZWlnaHQoKTphLmNvbnRleHQucHJvcChcInNjcm9sbEhlaWdodFwiKSl8fFwidXBcIj09PWEuZGlyMSYmYS5uZXh0cG9zMStiLmhlaWdodCgpPlxuKGEuY29udGV4dC5pcyhoKT9uLmhlaWdodCgpOmEuY29udGV4dC5wcm9wKFwic2Nyb2xsSGVpZ2h0XCIpKXx8XCJsZWZ0XCI9PT1hLmRpcjEmJmEubmV4dHBvczErYi53aWR0aCgpPihhLmNvbnRleHQuaXMoaCk/bi53aWR0aCgpOmEuY29udGV4dC5wcm9wKFwic2Nyb2xsV2lkdGhcIikpfHxcInJpZ2h0XCI9PT1hLmRpcjEmJmEubmV4dHBvczErYi53aWR0aCgpPihhLmNvbnRleHQuaXMoaCk/bi53aWR0aCgpOmEuY29udGV4dC5wcm9wKFwic2Nyb2xsV2lkdGhcIikpKWEubmV4dHBvczE9YS5maXJzdHBvczEsYS5uZXh0cG9zMis9YS5hZGRwb3MyKyhcInVuZGVmaW5lZFwiPT09dHlwZW9mIGEuc3BhY2luZzI/MjU6YS5zcGFjaW5nMiksYS5hZGRwb3MyPTA7XCJudW1iZXJcIj09PXR5cGVvZiBhLm5leHRwb3MyJiYoYS5hbmltYXRpb24/Yi5jc3MoZSxhLm5leHRwb3MyK1wicHhcIik6KGIucmVtb3ZlQ2xhc3MoXCJ1aS1wbm90aWZ5LW1vdmVcIiksYi5jc3MoZSxhLm5leHRwb3MyK1wicHhcIiksYi5jc3MoZSksYi5hZGRDbGFzcyhcInVpLXBub3RpZnktbW92ZVwiKSkpO1xuc3dpdGNoKGEuZGlyMil7Y2FzZSBcImRvd25cIjpjYXNlIFwidXBcIjpiLm91dGVySGVpZ2h0KCEwKT5hLmFkZHBvczImJihhLmFkZHBvczI9Yi5oZWlnaHQoKSk7YnJlYWs7Y2FzZSBcImxlZnRcIjpjYXNlIFwicmlnaHRcIjpiLm91dGVyV2lkdGgoITApPmEuYWRkcG9zMiYmKGEuYWRkcG9zMj1iLndpZHRoKCkpfVwibnVtYmVyXCI9PT10eXBlb2YgYS5uZXh0cG9zMSYmKGEuYW5pbWF0aW9uP2IuY3NzKGYsYS5uZXh0cG9zMStcInB4XCIpOihiLnJlbW92ZUNsYXNzKFwidWktcG5vdGlmeS1tb3ZlXCIpLGIuY3NzKGYsYS5uZXh0cG9zMStcInB4XCIpLGIuY3NzKGYpLGIuYWRkQ2xhc3MoXCJ1aS1wbm90aWZ5LW1vdmVcIikpKTtzd2l0Y2goYS5kaXIxKXtjYXNlIFwiZG93blwiOmNhc2UgXCJ1cFwiOmEubmV4dHBvczErPWIuaGVpZ2h0KCkrKFwidW5kZWZpbmVkXCI9PT10eXBlb2YgYS5zcGFjaW5nMT8yNTphLnNwYWNpbmcxKTticmVhaztjYXNlIFwibGVmdFwiOmNhc2UgXCJyaWdodFwiOmEubmV4dHBvczErPWIud2lkdGgoKSsoXCJ1bmRlZmluZWRcIj09PVxudHlwZW9mIGEuc3BhY2luZzE/MjU6YS5zcGFjaW5nMSl9fXJldHVybiB0aGlzfX0scXVldWVQb3NpdGlvbjpmdW5jdGlvbihiLGEpe2cmJmNsZWFyVGltZW91dChnKTthfHwoYT0xMCk7Zz1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ZC5wb3NpdGlvbkFsbChiKX0sYSk7cmV0dXJuIHRoaXN9LGNhbmNlbFJlbW92ZTpmdW5jdGlvbigpe3RoaXMudGltZXImJmwuY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO3RoaXMuYW5pbVRpbWVyJiZsLmNsZWFyVGltZW91dCh0aGlzLmFuaW1UaW1lcik7XCJjbG9zaW5nXCI9PT10aGlzLnN0YXRlJiYodGhpcy5zdGF0ZT1cIm9wZW5cIix0aGlzLmFuaW1hdGluZz0hMSx0aGlzLmVsZW0uYWRkQ2xhc3MoXCJ1aS1wbm90aWZ5LWluXCIpLFwiZmFkZVwiPT09dGhpcy5vcHRpb25zLmFuaW1hdGlvbiYmdGhpcy5lbGVtLmFkZENsYXNzKFwidWktcG5vdGlmeS1mYWRlLWluXCIpKTtyZXR1cm4gdGhpc30scXVldWVSZW1vdmU6ZnVuY3Rpb24oKXt2YXIgYj10aGlzO3RoaXMuY2FuY2VsUmVtb3ZlKCk7XG50aGlzLnRpbWVyPWwuc2V0VGltZW91dChmdW5jdGlvbigpe2IucmVtb3ZlKCEwKX0saXNOYU4odGhpcy5vcHRpb25zLmRlbGF5KT8wOnRoaXMub3B0aW9ucy5kZWxheSk7cmV0dXJuIHRoaXN9fSk7Yi5leHRlbmQoZCx7bm90aWNlczpbXSxyZWxvYWQ6cSxyZW1vdmVBbGw6ZnVuY3Rpb24oKXtiLmVhY2goZC5ub3RpY2VzLGZ1bmN0aW9uKCl7dGhpcy5yZW1vdmUmJnRoaXMucmVtb3ZlKCExKX0pfSxyZW1vdmVTdGFjazpmdW5jdGlvbihjKXtiLmVhY2goZC5ub3RpY2VzLGZ1bmN0aW9uKCl7dGhpcy5yZW1vdmUmJnRoaXMub3B0aW9ucy5zdGFjaz09PWMmJnRoaXMucmVtb3ZlKCExKX0pfSxwb3NpdGlvbkFsbDpmdW5jdGlvbihjKXtnJiZjbGVhclRpbWVvdXQoZyk7Zz1udWxsO2lmKGQubm90aWNlcyYmZC5ub3RpY2VzLmxlbmd0aCliLmVhY2goZC5ub3RpY2VzLGZ1bmN0aW9uKCl7dmFyIGE9dGhpcy5vcHRpb25zLnN0YWNrO2EmJihhLm92ZXJsYXkmJmEub3ZlcmxheS5oaWRlKCksYS5uZXh0cG9zMT1cbmEuZmlyc3Rwb3MxLGEubmV4dHBvczI9YS5maXJzdHBvczIsYS5hZGRwb3MyPTAsYS5hbmltYXRpb249Yyl9KSxiLmVhY2goZC5ub3RpY2VzLGZ1bmN0aW9uKCl7dGhpcy5wb3NpdGlvbigpfSk7ZWxzZXt2YXIgYT1kLnByb3RvdHlwZS5vcHRpb25zLnN0YWNrO2EmJihkZWxldGUgYS5uZXh0cG9zMSxkZWxldGUgYS5uZXh0cG9zMil9fSxzdHlsaW5nOnticmlnaHR0aGVtZTp7Y29udGFpbmVyOlwiYnJpZ2h0dGhlbWVcIixub3RpY2U6XCJicmlnaHR0aGVtZS1ub3RpY2VcIixub3RpY2VfaWNvbjpcImJyaWdodHRoZW1lLWljb24tbm90aWNlXCIsaW5mbzpcImJyaWdodHRoZW1lLWluZm9cIixpbmZvX2ljb246XCJicmlnaHR0aGVtZS1pY29uLWluZm9cIixzdWNjZXNzOlwiYnJpZ2h0dGhlbWUtc3VjY2Vzc1wiLHN1Y2Nlc3NfaWNvbjpcImJyaWdodHRoZW1lLWljb24tc3VjY2Vzc1wiLGVycm9yOlwiYnJpZ2h0dGhlbWUtZXJyb3JcIixlcnJvcl9pY29uOlwiYnJpZ2h0dGhlbWUtaWNvbi1lcnJvclwifSxqcXVlcnl1aTp7Y29udGFpbmVyOlwidWktd2lkZ2V0IHVpLXdpZGdldC1jb250ZW50IHVpLWNvcm5lci1hbGxcIixcbm5vdGljZTpcInVpLXN0YXRlLWhpZ2hsaWdodFwiLG5vdGljZV9pY29uOlwidWktaWNvbiB1aS1pY29uLWluZm9cIixpbmZvOlwiXCIsaW5mb19pY29uOlwidWktaWNvbiB1aS1pY29uLWluZm9cIixzdWNjZXNzOlwidWktc3RhdGUtZGVmYXVsdFwiLHN1Y2Nlc3NfaWNvbjpcInVpLWljb24gdWktaWNvbi1jaXJjbGUtY2hlY2tcIixlcnJvcjpcInVpLXN0YXRlLWVycm9yXCIsZXJyb3JfaWNvbjpcInVpLWljb24gdWktaWNvbi1hbGVydFwifSxib290c3RyYXAzOntjb250YWluZXI6XCJhbGVydFwiLG5vdGljZTpcImFsZXJ0LXdhcm5pbmdcIixub3RpY2VfaWNvbjpcImdseXBoaWNvbiBnbHlwaGljb24tZXhjbGFtYXRpb24tc2lnblwiLGluZm86XCJhbGVydC1pbmZvXCIsaW5mb19pY29uOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1pbmZvLXNpZ25cIixzdWNjZXNzOlwiYWxlcnQtc3VjY2Vzc1wiLHN1Y2Nlc3NfaWNvbjpcImdseXBoaWNvbiBnbHlwaGljb24tb2stc2lnblwiLGVycm9yOlwiYWxlcnQtZGFuZ2VyXCIsZXJyb3JfaWNvbjpcImdseXBoaWNvbiBnbHlwaGljb24td2FybmluZy1zaWduXCJ9fX0pO1xuZC5zdHlsaW5nLmZvbnRhd2Vzb21lPWIuZXh0ZW5kKHt9LGQuc3R5bGluZy5ib290c3RyYXAzKTtiLmV4dGVuZChkLnN0eWxpbmcuZm9udGF3ZXNvbWUse25vdGljZV9pY29uOlwiZmEgZmEtZXhjbGFtYXRpb24tY2lyY2xlXCIsaW5mb19pY29uOlwiZmEgZmEtaW5mb1wiLHN1Y2Nlc3NfaWNvbjpcImZhIGZhLWNoZWNrXCIsZXJyb3JfaWNvbjpcImZhIGZhLXdhcm5pbmdcIn0pO2wuZG9jdW1lbnQuYm9keT9yKCk6YihyKTtyZXR1cm4gZH07cmV0dXJuIHEoayl9KTtcbiIsInZhciBrZXkgPSByZXF1aXJlKFwia2V5bWFzdGVyXCIpO1xyXG52YXIgbWVzc2FnZSA9IHJlcXVpcmUoXCJtb2R1bGVzL21lc3NhZ2VcIik7XHJcblxyXG4vLyBBZGQgc2hvcnRjdXQgY29lXHJcbnZhciBfYWRkU2hvcnRjdXQgPSBmdW5jdGlvbihzZWxlY3RlZEtleSxjYikge1xyXG4gIGtleShzZWxlY3RlZEtleSwgY2IpO1xyXG59XHJcblxyXG52YXIgX2NsaWNrQnV0dG9uID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAkKHNlbGVjdG9yKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLy8gQWRkIHNob3J0Y3V0cyBmb3Igc2VsZWN0b3JzXHJcbnZhciBkZWZhdWx0U2hvcnRjdXRzID0gZnVuY3Rpb24oKSB7XHJcbiAgX2FkZFNob3J0Y3V0KCdjdHJsK3MnLCBmdW5jdGlvbihldmVudCxoYW5kbGVyKXtcclxuICAgIF9jbGlja0J1dHRvbignLnQtQnV0dG9uW29uY2xpY2sqPVwiXFwnQ1JFQVRFXFwnXCJdLC50LUJ1dHRvbiNDUkVBVEUnKTtcclxuICB9KTtcclxuICBfYWRkU2hvcnRjdXQoJ2N0cmwrcycsIGZ1bmN0aW9uKGV2ZW50LGhhbmRsZXIpe1xyXG4gICAgX2NsaWNrQnV0dG9uKCcudC1CdXR0b25bb25jbGljayo9XCJcXCdTQVZFXFwnXCJdLC50LUJ1dHRvbiNTQVZFJyk7XHJcbiAgfSk7XHJcbiAgX2FkZFNob3J0Y3V0KCdjdHJsK2QnLCBmdW5jdGlvbihldmVudCxoYW5kbGVyKXtcclxuICAgIF9jbGlja0J1dHRvbignLnQtQnV0dG9uW29uY2xpY2sqPVwiXFwnREVMRVRFXFwnXCJdLC50LUJ1dHRvbiNERUxFVEUnKTtcclxuICB9KTtcclxuICBfYWRkU2hvcnRjdXQoJ2N0cmwrbScsIGZ1bmN0aW9uKGV2ZW50LGhhbmRsZXIpe1xyXG4gICAgbWVzc2FnZS5pbmZvKHtcclxuICAgICAgdGl0bGU6IFwiQSBrZXkgd2FzIHByZXNzZWRcIixcclxuICAgICAgdGV4dDogXCJjdHJsK21cIlxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0U2hvcnRjdXRzOiBkZWZhdWx0U2hvcnRjdXRzXHJcbn1cclxuIiwidmFyICQgPSAod2luZG93LiQpOyAvLyBiZWluZyBzaGltbWVkXHJcbnZhciBQTm90aWZ5ID0gcmVxdWlyZShcInBub3RpZnlcIik7XHJcblxyXG5cclxuLy8gQnV0dG9uIGRlZmF1bHRzXHJcbnZhciBkZWZhdWx0cyA9IHtcclxuICBoaWRlOiBmYWxzZSxcclxuICBjbG9zZXI6IHRydWUsXHJcbiAgYnV0dG9uczoge1xyXG4gICAgY2xvc2VyX2hvdmVyOiBmYWxzZSxcclxuICAgIHN0aWNrZXI6IGZhbHNlLFxyXG4gICAgbGFiZWxzOiB7XHJcbiAgICAgIGNsb3NlOiAnU2x1aXQgbWVsZGluZydcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5cclxudmFyIGdldFNldHRpbmdzID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cclxuICBzd2l0Y2ggKHR5cGVvZiBvcHRpb25zKSB7XHJcbiAgICBjYXNlIFwic3RyaW5nXCI6XHJcbiAgICAgIHJldHVybiAkLmV4dGVuZCh7XHJcbiAgICAgICAgdGl0bGU6IG9wdGlvbnNcclxuICAgICAgfSwgZGVmYXVsdHMpO1xyXG4gICAgY2FzZSBcIm9iamVjdFwiOlxyXG4gICAgICByZXR1cm4gJC5leHRlbmQob3B0aW9ucywgZGVmYXVsdHMpO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIGRlZmF1bHRzO1xyXG4gIH07XHJcblxyXG59O1xyXG5cclxudmFyIGluZm8gPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBQTm90aWZ5KCQuZXh0ZW5kKGdldFNldHRpbmdzKG9wdGlvbnMpLCB7XHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICBoaWRlOiB0cnVlXHJcbiAgfSkpO1xyXG59O1xyXG5cclxudmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBQTm90aWZ5KCQuZXh0ZW5kKGdldFNldHRpbmdzKG9wdGlvbnMpLCB7XHJcbiAgICB0eXBlOiAnc3VjY2VzcycsXHJcbiAgICBoaWRlOiB0cnVlXHJcbiAgfSkpO1xyXG59O1xyXG5cclxudmFyIHdhcm5pbmcgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBQTm90aWZ5KCQuZXh0ZW5kKGdldFNldHRpbmdzKG9wdGlvbnMpLCB7XHJcbiAgICB0eXBlOiAnd2FybmluZydcclxuICB9KSk7XHJcbn07XHJcblxyXG52YXIgZXJyb3IgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBQTm90aWZ5KCQuZXh0ZW5kKGdldFNldHRpbmdzKG9wdGlvbnMpLCB7XHJcbiAgICB0eXBlOiAnZXJyb3InXHJcbiAgfSkpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgaW5mbzogaW5mbyxcclxuICBzdWNjZXNzOiBzdWNjZXNzLFxyXG4gIHdhcm5pbmc6IHdhcm5pbmcsXHJcbiAgZXJyb3I6IGVycm9yXHJcbn07XHJcbiIsIiQud2lkZ2V0KFwiY3VzdG9tLmN1c3RvbVJlcG9ydFwiLCB7XHJcbiAgb3B0aW9uczoge1xyXG4gICAgZXhjZXB0Q2xhc3M6ICduby1yb3ctbGluaycsXHJcbiAgICBhY3RpdmVDbGFzczogJ2FjdGl2ZScsXHJcbiAgICBjb2x1bW5zOiBbXSxcclxuICAgIHJvd2NsaWNrOiBmdW5jdGlvbihlLCBkYXRhKSB7XHJcbiAgICAgICQodGhpcykuY3VzdG9tUmVwb3J0KCdvcGVuTGluaycsIGUpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIF9jcmVhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgLy8gQ2hlY2sgaWYgcmVwb3J0IG1heSBoYXZlIGEgcm93IGxpbmtcclxuICAgIGlmICh0aGlzLl9yb3dMaW5rQWxsb3dlZCkge1xyXG4gICAgICB0aGlzLl9pbml0Um93Q2xpY2soKTtcclxuICAgIH1cclxuXHJcbiAgICAkKHRoaXMuZWxlbWVudCkub24oJ2FwZXhhZnRlcnJlZnJlc2gnLGZ1bmN0aW9uKGUpe1xyXG4gICAgICBzZWxmLl9hcGV4YWZ0ZXJyZWZyZXNoKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgfSxcclxuXHJcbiAgX2FwZXhhZnRlcnJlZnJlc2g6IGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gQ2hlY2sgaWYgcmVwb3J0IG1heSBoYXZlIGEgcm93IGxpbmtcclxuICAgIGlmICh0aGlzLl9yb3dMaW5rQWxsb3dlZCkge1xyXG4gICAgICB0aGlzLl9pbml0Um93Q2xpY2soKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfaW5pdFJvd0NsaWNrOiBmdW5jdGlvbihjYikge1xyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBkYXRhO1xyXG4gICAgY2IgPSAkLnByb3h5KGNiLCBzZWxmKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgcHJldmlvdXMgaGFuZGxlcnNcclxuICAgIHRoaXMuX29mZih0aGlzLmVsZW1lbnQsICdjbGljayB0ciB0ZDpub3QoOmhhcyhhKSknKTtcclxuICAgIHRoaXMuX29mZih0aGlzLmVsZW1lbnQsICdob3ZlciB0ciB0ZDpub3QoOmhhcyhhKSknKTtcclxuXHJcbiAgICAvLyBBZGQgbmV3IGhhbmRsZXJcclxuICAgIHRoaXMuX29uKHRoaXMuZWxlbWVudCwge1xyXG4gICAgICAnbW91c2VlbnRlciB0ciB0ZDpub3QoOmhhcyhhKSknOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgJChlLnRhcmdldCkuY3NzKCdjdXJzb3InLCAncG9pbnRlcicpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBZGQgbmV3IGhhbmRsZXJcclxuICAgIHRoaXMuX29uKHRoaXMuZWxlbWVudCwge1xyXG4gICAgICAnY2xpY2sgdHIgdGQ6bm90KDpoYXMoYSkpJzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHNlbGYuX3RyaWdnZXIoJ3Jvd2NsaWNrJywgZSwgZGF0YSk7XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIH0sXHJcblxyXG4gIC8vIFVzZSBhbiBhIGhyZWYgdmFsdWUgdG8gcmVkaXJlY3Qgb24gcm93IGNsaWNrIGluIHJlcG9ydFxyXG4gIG9wZW5MaW5rOiBmdW5jdGlvbihldmVudCwgb3B0aW9ucykge1xyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgZGVmYXVsdHMgPSB7XHJcbiAgICAgIGFQb3M6IDAgLy8gd2hpY2ggXCJhXCIgZWxlbWVudCBjb250YWlucyB0aGUgbGlua1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKG9wdGlvbnMsIGRlZmF1bHRzKTtcclxuXHJcbiAgICAvLyBHZXQgbGlua1xyXG4gICAgdmFyICRsaW5rRWxlbSA9IHNlbGYuX2dldExpbmtFbGVtZW50KHNldHRpbmdzLCBldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuICAgIHZhciBocmVmID0gJGxpbmtFbGVtLmF0dHIoJ2hyZWYnKTtcclxuXHJcbiAgICBpZiAoaHJlZiAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIF9nZXRMaW5rRWxlbWVudDogZnVuY3Rpb24ob3B0aW9ucywgdGFyZ2V0KSB7XHJcblxyXG4gICAgdmFyIGxpbmtzID0gJCh0YXJnZXQpLmNsb3Nlc3QoJ3RyJykuZmluZCgndGQ6aGFzKGEpJyk7XHJcblxyXG4gICAgLy8gUmFpc2UgZXhjZXB0aW9uIGlmIHBvc2l0aW9uIG9mIGEgZWxlbWVudCBpcyBpbnZhbGlkXHJcbiAgICBpZiAobGlua3MubGVuZ3RoIDwgb3B0aW9ucy5hUG9zKSB7XHJcbiAgICAgIGFwZXguZGVidWcuZXJyb3IoJ0V4Y2VwdGlvbjogJywgb3B0aW9ucy5hUG9zICsgJ3RoIFwiYVwiIGVsZW1lbnQgaXMgbm90IGZvdW5kIGluIHJlcG9ydCByb3cuJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gJChsaW5rc1tvcHRpb25zLmFQb3NdKS5maW5kKCdhJyk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIC8vIF9yb3dMaW5rQWxsb3dlZCByZXR1cm5zIGJvb2xlYW5cclxuICBfcm93TGlua0FsbG93ZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuICEkKHRoaXMuZWxlbWVudCkuaGFzQ2xhc3ModGhpcy5vcHRpb25zLmV4Y2VwdENsYXNzKTtcclxuICB9LFxyXG5cclxuICBfc2V0QWN0aXZlUm93OiBmdW5jdGlvbigkcm93KSB7XHJcbiAgICAkKCRyb3cpLmNsb3Nlc3QoJ3RhYmxlJykuZmluZCgndGQuJyt0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XHJcbiAgICAkKCRyb3cpLmZpbmQoJ3RkJykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcclxuICB9LFxyXG5cclxuICBhY3RpdmVSb3c6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuICQodGhpcy5lbGVtZW50KS5maW5kKCd0ZC4nK3RoaXMub3B0aW9ucy5hY3RpdmVDbGFzcykuY2xvc2VzdCgndHInKTtcclxuICB9XHJcblxyXG59KTtcclxuIl19
