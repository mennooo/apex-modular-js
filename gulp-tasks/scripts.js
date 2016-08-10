var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

//var watch = require('gulp-watch');
//var async = require('async');
var plumber = require('gulp-plumber');
var insert = require('gulp-insert');


// relative file paths
require('app-module-path').addPath(__dirname);


var onError = function(error) {
  gutil.log(error);
  this.emit('end');
}

var jsConfig = {
  base: 'src/js/applications',
  build: 'dist/',
  apps: 'src/js/applications/*/*.js',
  pages: 'src/js/applications/*/apex_pages/*.js'
};

// Two kinds of tasks: original JavaScript or minified JavaScript
function execTask(options) {

  return gulp.src([
      options.source
    ], {
      base: jsConfig.base
    })
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(insert.wrap('(function localScope() {', '})();')) // create local scope for these files
    .pipe(rename(function(path){
      // add js folder in dirname
      path.dirname = function(){
        var slugs = path.dirname.split('/');
        slugs.splice(1, 0, 'js');
        return slugs.join('/');
      }();
    }))
    .pipe(gulp.dest(jsConfig.build))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(jsConfig.build));

};

gulp.task('scripts:apps', function() {

  return execTask({
    source: jsConfig.apps
  });

});

gulp.task('scripts:pages', function() {

  return execTask({
    source: jsConfig.pages
  });

});

gulp.task('scripts:watch', function() {

  gulp.watch(jsConfig.apps, ['scripts:apps', 'deploy']);
  gulp.watch(jsConfig.pages, ['scripts:pages', 'deploy']);

});
