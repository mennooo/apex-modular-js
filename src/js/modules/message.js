var $ = require("jquery"); // being shimmed
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
