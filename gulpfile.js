var gulp      = require( 'gulp' );
var sass      = require( 'gulp-sass' );
var inlineCss = require( 'gulp-inline-css' );
var bs        = require( 'browser-sync' ).create();
var sequence  = require( 'run-sequence' );
var plumber   = require( 'gulp-plumber' );
var rename    = require( 'gulp-rename' );
var data      = require( 'gulp-data' );
var swig      = require( 'gulp-swig' );
var context   = require( './dev/test-data.js' );

// Inliner task operations wrapped into a helper function
function inliner( srcFolder, srcFile, destFolder, destFile ) {
    return gulp.src( srcFolder + srcFile )
        .pipe( inlineCss({
            applyStyleTags:  false,
            removeStyleTags: false,
            applyLinkTags:   true,
            removeLinkTags:  true
         }))
         .pipe( rename( destFile ) )
         .pipe( gulp.dest( destFolder ) );
}

// Task: Compile stylesheet.sass and save it as stylesheet.css
gulp.task( 'sass', function() {
    gulp.src( './dev/stylesheet.scss' )
        .pipe( plumber() )                 // report errors w/o stopping Gulp
        .pipe( sass() )
        .pipe( gulp.dest( './dev' ) );
});

// Task: Render template.html populated with data and save it as preview.html
gulp.task( 'render', function() {
    return gulp.src( './dev/template.html' )
        .pipe( data( context ) ) // provide context data
        .pipe( swig( { defaults: { cache: false } } ) )  // turn off Swig caching
        .pipe( rename( 'preview.html' ) )
        .pipe( gulp.dest( './dev' ) );
});

// Task: Inline CSS into template.html and and save it to prod/
gulp.task( 'inlineTemplate', function() {
    return inliner( './dev/', 'template.html', './prod/', 'template.html' );
});

// Task: Inline CSS into preview.html, save it as dev/index.html, and refresh
gulp.task( 'inlinePreview', function() {
    return inliner( './dev/', 'preview.html', './dev/', 'index.html' )
        .pipe( bs.reload( { stream: true } ) );
});

// Task: Start server and watchers
gulp.task( 'serve', function() {
    bs.init( { server: "./dev" } );   // server is at http://localhost:3000

    // watchers to compile css and render template on file changes
    gulp.watch( './dev/stylesheet.scss', [ 'sass' ] );
    gulp.watch( './dev/template.html', [ 'render' ] );

    // watchers to inline both preview and template whenever above get updated
    gulp.watch( './dev/stylesheet.css', [ 'inlinePreview', 'inlineTemplate' ] );
    gulp.watch( './dev/preview.html', [ 'inlinePreview', 'inlineTemplate' ] );
});

// Task: Default (run everything once, in sequence, and start server)
gulp.task( 'default', function() {
    sequence( 'serve', 'sass', 'render' );
});