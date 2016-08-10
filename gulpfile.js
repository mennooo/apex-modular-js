var gulp = require('gulp');
var requireDir = require('require-dir');

// relative file paths
require('app-module-path').addPath(__dirname);

requireDir('gulp-tasks');

gulp.task('bundle', ['bundle:watch']);

gulp.task('scripts', ['scripts:watch']);

gulp.task('start', ['bundle:bundleAll', 'scripts:apps', 'scripts:pages', 'deploy'])

gulp.task('default', ['start', 'bundle', 'scripts']);
