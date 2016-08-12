var gulp = require('gulp');
var notify = require('gulp-notify');
var zip = require('gulp-zip');

gulp.task('deploy', ['bundle:bundleAll'],function() {
  return gulp.src(['dist/**/*', '!dist/*.zip'], {
      base: 'dist'
    })
    .pipe(zip('kscope.zip'))
    .pipe(gulp.dest('dist'))
    /*
      In this sample we only create a zipfile to upload to APEX Static Application files manually
      You might want to use ftp to upload files to your webserver like this:



    */
    .pipe(notify('Please upload the file dist/kscope/kscope.zip to APEX Static Application Files in the sample application.'));
});
