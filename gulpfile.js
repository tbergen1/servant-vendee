/**
 * Servant-Press Gulpfile
 */


// Dependencies
var gulp = require('gulp'),
    async = require('async'),
    _ = require('lodash'),
    fs = require('fs'),
    AWS = require('aws-sdk'),
    clean = require('gulp-clean'),
    gconcat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    concatCss = require('gulp-concat-css'),
    minifyCss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    gzip = require('gulp-gzip'),
    jeditor = require("gulp-json-editor"),
    shell = require('gulp-shell'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    zip = require('gulp-zip'),
    filter = require('gulp-filter'),
    tag_version = require('gulp-tag-version'),
    server = require('gulp-develop-server'),
    dotenv = require('dotenv');


/**
 * Defaults / Config
 */

dotenv.load(); // Load ENV Variables
var project = 'servant_press';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});




/**
 * Utilities
 */

// Gulp Callback Function
function gulpCallback(obj) {
    var stream = new require('stream').Transform({
        objectMode: true
    });
    stream._transform = function(file, unused, callback) {
        obj();
        callback(null, file);
    };
    return stream;
};

// S3 Upload Function
function s3Upload(file_path, s3_key, callback) {
    fs.readFile(file_path, function(err, data) {
        if (err) throw err;

        var base64data = new Buffer(data, 'binary');

        var s3 = new AWS.S3();
        var s3_params = {
            Bucket: process.env.AWS_BUCKET,
            Key: s3_key,
            Body: base64data
        };

        // Add ContentType for different types of files
        if (s3_key.indexOf('.css') > -1) s3_params.ContentType = 'text/css';
        else s3_params.ContentType = 'text/plain';

        // Upload
        s3.upload(s3_params, function(resp) {
            // console.log(arguments);
            console.log('****** Upload Completed: ' + s3_key);
            if (callback) return callback();
        });

    });
};






/**
 * Server
 * - Auto-restarts after changes
 */

gulp.task('server:start', function() {
    server.listen({
        path: './server.js'
    });
    // Watch server-side code.  If changes happen, restart node server
    gulp.watch(['./server.js', './app/**/*'], ['server:restart']);
});

gulp.task('server:restart', [], server.restart);







/**
 * Build
 * - Minifies javascript and css
 */

gulp.task('build', function() {

    // First, clean out dist folder
    gulp.src('./public/dist/' + project + '/*', {
            read: false
        })
        .pipe(clean())
        .pipe(gulpCallback(function() {

            // Come Up With FingerPrint
            var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var fingerprint = '';
            for (var i = 16; i > 0; --i) fingerprint += chars[Math.round(Math.random() * (chars.length - 1))];

            // Persist fingerprint to production.json
            gulp.src("./config/env/production.json")
                .pipe(jeditor({
                    "fingerprint": fingerprint
                }))
                .pipe(gulp.dest("./config/env/"));

            // Asset locations for minifications.  Order is important.
            var blogCSSlocations = [
                './public/css/themes/one/one.css'
            ];
            var blogJSlocations = [
                './public/libs/jquery/dist/jquery.min.js',
                './public/libs/servant-sdk-javascript/dist/servant_sdk_js.min.js',
                './public/libs/perfect-scrollbar/js/min/perfect-scrollbar.min.js',
                './public/js/themes/one/index.js',
                './public/js/themes/one/utilities.js',
                './public/js/themes/one/admin.js'
            ];
            var homeJSlocations = [
                './public/libs/jquery/dist/jquery.min.js',
                './public/js/home/home.js'
            ];
            var homeCSSlocations = [
                './public/libs/normalize-css/normalize.css',
                './public/libs/skeleton/css/skeleton.css',
                './public/css/styles.css'
            ];

            // Minify Blog JS
            var blog_js = project + '/' + fingerprint + '/' + fingerprint + '_one.min.js';
            gulp.src(blogJSlocations)
                .pipe(gconcat(blog_js))
                .pipe(uglify())
                .pipe(gulp.dest('public/dist'))
                .pipe(gulpCallback(function() {
                    s3Upload('./public/dist/' + blog_js, blog_js, function() {

                    });
                }));

            // Minify Blog CSS
            var blog_css = project + '/' + fingerprint + '/' + fingerprint + '_one.min.css';
            gulp.src(blogCSSlocations)
                .pipe(concatCss(blog_css))
                .pipe(minifyCss())
                .pipe(gulp.dest('public/dist'))
                .pipe(gulpCallback(function() {
                    s3Upload('./public/dist/' + blog_css, blog_css, function() {

                    });
                }));

            // Minify Home JS
            var home_js = project + '/' + fingerprint + '/' + fingerprint + '_home.min.js';
            gulp.src(homeJSlocations)
                .pipe(gconcat(home_js))
                .pipe(uglify())
                .pipe(gulp.dest('public/dist'))
                .pipe(gulpCallback(function() {
                    s3Upload('./public/dist/' + home_js, home_js, function() {

                    });
                }));

            // Minify Home CSS
            var home_css = project + '/' + fingerprint + '/' + fingerprint + '_home.min.css';
            gulp.src(homeCSSlocations)
                .pipe(concatCss(home_css))
                .pipe(minifyCss())
                .pipe(gulp.dest('public/dist'))
                .pipe(gulpCallback(function() {
                    s3Upload('./public/dist/' + home_css, home_css, function() {

                    });
                }));

        }));
});







/**
 * Lambda
 * - Publish All Lambda Functions To AWS Lambda
 * - Zips up all Lambda Functions in lambdas directory
 * - Clears existing Lambda functions on AWS
 * - Uploads new Lambda functions
 */

gulp.task('lambda', function() {

    var Lambda = new AWS.Lambda({
        apiVersion: '2015-03-31'
    });

    async.eachSeries(fs.readdirSync('./lambdas'), function(directory, directoryCallback) {

        // Skip system files
        if (directory.substring(0, 1) === '.') return directoryCallback();

        // Create Lambda Settings
        var settings = {
            Role: process.env.AWS_ROLE_ARN
        };
        _.assign(settings, require('./lambdas/' + directory + '/lambda.json'));

        // Delete Existing Lambda Function, if any
        Lambda.deleteFunction({
            FunctionName: settings.FunctionName
        }, function(err, data) {
            if (err && err.code !== 'ResourceNotFoundException') return console.log(err, err.stack);

            // Zip new Lambda Function
            var zip = new require('node-zip')();
            zip.file('./lambdas/' + directory + '/lambda.js', './lambdas/' + directory + '/node_modules');
            var zipped_lambda = zip.generate({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });
            settings.Code = {
                ZipFile: zipped_lambda
            };

            // Upload New Lambda Function
            Lambda.createFunction(settings, function(error, data) {
                if (error) return console.log('****** ERROR: Could not upload Lambda function: ' + settings.FunctionName, error);
                console.log('****** Successfully Upload Lambda Function: ' + settings.FunctionName);
                console.log('****** Lambda Upload Results: ', data);
                return directoryCallback();
            });

        });
    }, function(error) {
        console.log("Done!");
    });
});





/**
 * Git Publish
 */

function publish(importance) {
    // get all the files to bump version in
    gulp.src(['./package.json'])
        // bump the version number in those files
        .pipe(bump({
            type: importance
        }))
        // save it back to filesystem
        .pipe(gulp.dest('./'))
        // commit the changed version number
        .pipe(git.commit('bumps package version'))
        // read only one file to get the version number
        .pipe(filter('package.json'))
        // **tag it in the repository**
        .pipe(tag_version());
}

gulp.task('patch', ['build'], function() {
    return publish('patch');
})
gulp.task('feature', ['build'], function() {
    return publish('minor');
})
gulp.task('release', ['build'], function() {
    return publish('major');
})







/**
 * Default
 * - Same as server:start
 */

gulp.task('default', ['server:start']);



// End