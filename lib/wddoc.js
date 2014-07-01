/*!
 * Module dependencies.
 */

var dox = require('dox'),
    fs  = require('fs-extra'),
    ejs = require('ejs'),
    async = require('async'),
    glob  = require('glob'),
    deepmerge = require('deepmerge'),
    formatter = require('../lib/formatter').format,
    version   = require('../package.json').version,
    date = new Date();

exports.version = version;
exports.defaultFormatter = formatter;
exports.defaultTemplate = __dirname + '/../templates/template.md.ejs';

/**
 * Parses and generates the documentation for given files.
 *
 * ### Available options:
 *
 *  * {String} output: Path or the output to produce
 *  * {String} template: Path or the custom template
 *  * {String} encoding: Encoding of templates and files to parse
 *  * {Function} formatter: Custom formatter
 *
 * ### Examples:
 *
 *     var wddoc = require('wddoc');
 *     wddoc.parse({
 *         inputDir: './lib/*.js',
 *         outputDir: './docs'
 *     }, callback);
 *
 * @param {Object|Function|String} options The options or the callback (if there is not options) or the output option
 * @param {Function} callback The callback, it gets two arguments (err, output)
 *
 * @api public
 */
exports.process = function(options, callback) {

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    callback = callback || function() {};
    options = options || {};

    options = deepmerge({
        encoding: 'utf-8',
        formatter: formatter
    },options);

    async.each(glob.sync(options.inputDir + '**'), function(file, callback) {

        exports.parse(file, options, function(err, doc) {

            if(err) {
                return callback(err);
            }

            file = file.split(/\//g);
            file = file[file.length - 1];

            var docfile = {
                filename: file,
                javadoc: doc
            };

            exports.generate(options.formatter(docfile), options, callback);

        });

    });
};

/**
 * Parses the given file.
 *
 * ### Examples:
 *
 *     var wddoc = require('wddoc');
 *     wddoc.parse('/path/to/file.js', callback);
 *
 * @param {String} filepath Filepath to parse
 * @param {Object|Function} options The options or the callback (if there is not options)
 * @param {Function} callback The callback, it gets two arguments (err, result)
 *
 * @api public
 */
exports.parse = function(filepath, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    callback = callback || function() {};
    options = options || {};

    options = deepmerge({
        encoding: 'utf-8'
    },options);

    fs.readFile(filepath, options.encoding, function(err, data) {

        if(!data) {
            return;
        }

        callback(err, dox.parseComments(data, {
            raw: true
        }));

    });
};

/**
 * Generates the output for comments.
 *
 * @param {Object} docfile Comments to render
 * @param {Object|Function|String} options The options or the callback (if there is not options)
 * @param {Function} callback The callback, it gets two arguments (err, output)
 *
 * @api public
 */
exports.generate = function(docfile, options, callback) {

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    callback = callback || function() {};
    options = options || {};

    options = deepmerge({
        template: options.template || exports.defaultTemplate,
        encoding: 'utf-8'
    },options);

    ejs.open = '<?';
    ejs.close = '?>';

    docfile.javadoc = docfile.javadoc.filter(function(javadoc) {
        return javadoc.ignore === false;
    });

    fs.readFile(options.template, options.encoding, function(err, data) {
        if (err) {
            throw err;
        }

        // Remove indentation
        data = data.replace(/\n */g, '\n');

        var filename = docfile.filename.replace(__dirname,'').replace('.js',''),
            outputFile = options.outputDir + '/' + docfile.javadoc[0].type + '/' + filename + '.md',
            output = ejs.render(data, {
                docfile: docfile,
                escape: function(html) {
                    return String(html);
                }
            });


        // Remove double lines
        output = output.replace(/\n{3,}/g, '\n\n');
        console.log(outputFile);

        fs.outputFile(outputFile, output, callback);
    });

};