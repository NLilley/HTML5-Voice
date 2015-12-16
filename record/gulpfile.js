var gulp = require('gulp');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');

var paths = {
    js: './js/*.js',
    libJs: './lib-js/*.js',
    html: './html/*.html',
    css: './css/*.css',
    fonts: './fonts/*.*',
    build: './build',
    buildFiles: './build/**/*',
    static: '../server/static'
};

gulp.task('js', function () {
    var b = babel({
        sourceMap: false,
        presets: ['es2015', 'react']
    });

    b.on('error', function (err) {
        console.error(err);
        b.end();
    });

    return gulp.src(paths.js)
        .pipe(b)
        .pipe(uglify())
        .pipe(gulp.dest(paths.build + '/js'));
});

gulp.task('libJs', function () {
    return gulp.src(paths.libJs)
        .pipe(gulp.dest(paths.build + '/lib-js'));
});

gulp.task('html', function () {
    return gulp.src(paths.html)
        .pipe(gulp.dest(paths.build));
});

gulp.task('css', function () {
    return gulp.src(paths.css)
        .pipe(gulp.dest(paths.build + '/css'));
});

gulp.task('fonts', function () {
    return gulp.src(paths.fonts)
        .pipe(gulp.dest(paths.build + '/fonts'));
});

gulp.task('deployStatic', function () {
    return gulp.src(paths.buildFiles)
        .pipe(gulp.dest(paths.static));
});

gulp.task('watch', function () {
    gulp.watch(paths.html, ['html']);
    gulp.watch(paths.css, ['css']);
    gulp.watch(paths.js, ['js']);
    gulp.watch(paths.fonts, ['fonts']);
    gulp.watch(paths.buildFiles, ['deployStatic']);
});

gulp.task('default', ['js', 'libJs', 'html', 'css', 'fonts', 'watch']);