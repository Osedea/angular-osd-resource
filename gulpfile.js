var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    ngAnnotate = require('gulp-ng-annotate'),
    karma = require('gulp-karma');

var isTravis = process.env.TRAVIS || false;

var paths = {
    js: [
        './angular-osd-resource.js',
    ],
    test: [
        'node_modules/angular/angular.js',
        'node_modules/angular-mocks/angular-mocks.js',
        'angular-osd-resource.js',
        './test/**/*.js',
    ]
};

gulp.task('default', ['watch']);

gulp.task('build', ['js']);

gulp.task('js', function() {
    return gulp.src(paths.js)
        .pipe(rename('angular-osd-resource.min.js'))
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(gulp.dest('./'));
});

gulp.task('watch', ['build'], function() {
    gulp.watch(paths.js, ['js', 'test']);
});

gulp.task('test', function() {
    return gulp.src(paths.test)
        .pipe(karma({
            configFile: 'karma.conf.js',
            action: isTravis ? 'run' : 'watch',
            singleRun: isTravis,
        }))
        .on('error', function(err) {
            throw err;
        });
});
