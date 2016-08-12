var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var assign = require('lodash.assign');
var remapify = require('remapify');
var File = require("vinyl");
var buffer = require('vinyl-buffer');
var plumber = require('gulp-plumber');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var _ = require('underscore');
var uglify = require('gulp-uglify');
var async = require('async');
var es = require('event-stream');
var reload = require('require-reload')(require);
var config = reload('config.json');

// relative file paths
require('app-module-path').addPath(__dirname);

// jQuery shim
var globalShim = require('browserify-global-shim').configure({
  'jQuery': '$',
  'jquery': '$'
});

var onError = function(error) {
  gutil.log(error);
  this.emit('end');
}

var bundleTask = function(app, resolve, reject) {

  gutil.log(app.alias, 'requires these modules: ', app.modules);

  // add custom browserify options here
  var customOpts = {
    debug: true
  };

	// Create new file to add modules & widgets to namespace on global scope
  var dynamicJs = [
    "var " + app.alias + " = {};",
    "window." + app.alias + " = " + app.alias + ";"
  ];

	// Add modules to new file
  app.modules.forEach(function(module) {
    dynamicJs.push(app.alias + "." + module + " = require('modules/"+ module + "');");
  });

	// Add widgets to new file
  app.widgets.forEach(function(widget) {
    dynamicJs.push("require('widgets/" + widget + "');");
  });

  gutil.log(dynamicJs.join(''));

  var temp = new File({
    contents: new Buffer(dynamicJs.join(''))
  });

  var b = browserify(temp, customOpts);

  // shims
  b.transform(globalShim, {
    global: true
  });

  // Browserify plugins
  b.plugin(remapify, [{
    cwd: 'src/js/modules', // set the directory to look in
    src: '*.js', // glob for the files to remap
    expose: 'modules'
  }, {
    cwd: 'src/js/widgets', // set the directory to look in
    src: '*.js', // glob for the files to remap
    expose: 'widgets'
  }]);

  return b.bundle()
    // log errors if they happen
    .on('error', onError)
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/' + app.alias + '/js'))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('dist/' + app.alias + '/js'))
    .on('end', function() {
      resolve();
    });

};

gulp.task('bundle:bundleAll', function() {

  config = reload('config.json');

  var tasks = config.applications.map(function(app) {
    return new Promise(function(resolve, reject) {
      bundleTask(app, resolve, reject);
    })
  })

  // Return bundled streams after all bundles have been created
  return Promise.all(tasks).then(function(results) {
  }).catch(function(err) {
    console.log(err);
  });

});



//moduleTasks
gulp.task('bundle:watch', function() {
  gulp.watch(['src/js/modules/*.js', 'src/js/widgets/*.js', 'config.json'], ['bundle:bundleAll', 'deploy']);
});
