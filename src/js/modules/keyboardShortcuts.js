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
