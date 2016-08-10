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
