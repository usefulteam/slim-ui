const { src, dest, watch, parallel, series } = require('gulp');
const concat = require('gulp-concat');
const plumber = require('gulp-plumber');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const rmLines = require('gulp-rm-lines');
const browserSync = require('browser-sync').create();

function copyPromisePolyfill() {
    return src('node_modules/promise-polyfill/dist/polyfill.min.js')
        .pipe(rename('promise-polyfill.min.js'))
        .pipe(dest('src/js/polyfills'))
}

function copyFetchPolyfill() {
    return src('node_modules/unfetch/polyfill/index.js')
        .pipe(rename('fetch-polyfill.min.js'))
        .pipe(dest('src/js/polyfills'))
}

function copyArrayIncludesPolyfill() {
    return src('node_modules/polyfill-array-includes/array-includes.js')
        .pipe(rename('array-includes-polyfill.js'))
        .pipe(dest('src/js/polyfills'))
}

function copyEventEmitter() {
    return src('node_modules/mitt/dist/mitt.es.js')
        .pipe(rename('mitt.js'))
        .pipe(rmLines({
            'filters': [
                /export default\s/i,
                /# sourceMappingURL/i,
            ]
        }))
        .pipe(dest('src/js/libraries'))
}

function compileSCSS() {
    return src(['src/scss/slim-ui.scss'])
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(rename('slim-ui.min.css'))
        .pipe(dest('assets/css'))
        .pipe(browserSync.stream());
}

function minifyJS() {
    return src([
        'src/js/polyfills/*.js',
        'src/js/libraries/*.js',
        'src/js/slim-ui.js'
    ])
        .pipe(plumber())
        .pipe(concat('slim-ui.min.js'))
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(uglify())
        .pipe(dest('assets/js'))
        .pipe(browserSync.reload({ stream: true }));
}

function minifyScripts() {
    return src([
        'src/js/*.js',
        '!src/js/slim-ui.js',
    ])
        .pipe(plumber())
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(dest('assets/js'))
        .pipe(browserSync.reload({ stream: true }));
}

function serveBrowserSync(cb) {
    browserSync.init({
        server: {
            baseDir: "./"
        },
        notify: true,
    });

    cb();
}

function streamAssets(cb) {
    browserSync.stream();
    cb();
}

function reloadStream(cb) {
    browserSync.reload({ stream: true });
    cb();
}

function reloadPage(cb) {
    browserSync.reload();
    cb();
}

function copyPolyfills() {
    copyPromisePolyfill();
    copyArrayIncludesPolyfill();
}

function copyLibraries() {
    copyEventEmitter();
}

function watchChanges(cb) {
    watch(['src/js/polyfills/*.js', 'src/js/libraries/*.js', 'src/js/slim-ui.js'], parallel(minifyJS));
    watch(['src/js/*.js', '!src/js/slim-ui.js'], parallel(minifyScripts));
    watch(['src/scss/*.scss', 'src/scss/**/*.scss'], parallel(compileSCSS));
    watch(['*.html', 'assets/images/*'], parallel(reloadPage));

    cb();
}

function main(cb) {
    copyPolyfills();
    copyLibraries();
    minifyJS();
    minifyScripts();
    compileSCSS();

    cb();
}

exports.default = parallel(serveBrowserSync, main, watchChanges);