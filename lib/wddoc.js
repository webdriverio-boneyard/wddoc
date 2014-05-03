/*!
 * Module dependencies.
 */

var dox = require('dox'),
    fs  = require('fs'),
    ejs = require('ejs'),
    async = require('async'),
    util  = require('util'),
    deepmerge = require('deepmerge'),
    formatter = require('../lib/formatter').format,
    version   = require('../package.json').version;

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
 *     wddoc.parse('/path/to/file.js', callback);
 *
 * @param {String|Array} files Files to process
 * @param {Object|Function|String} options The options or the callback (if there is not options) or the output option
 * @param {Function} callback The callback, it gets two arguments (err, output)
 *
 * @api public
 */
exports.process = function(files, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    } else if (typeof options === 'string') {
        options = {
            output: options
        };
    }

    callback = callback || function() {};
    options = options || {};

    options = deepmerge({
        output: false,
        encoding: 'utf-8',
        formatter: formatter
    },options);

    if (!util.isArray(files)) {
        files = [files];
    }

    var docfiles = [];

    async.each(files, function(file, callback) {

        exports.parse(file, options, function(err, doc) {
            var docfile = {
                filename: file,
                javadoc: doc
            };

            var formatedDocfile = options.formatter(docfile);

            docfiles.push(formatedDocfile);
            callback(err);
        });

    }, function(err) {
        exports.generate(docfiles, options, function(err, output) {
            if (err) {
                throw err;
            }

            if (typeof options.output === 'string') {
                fs.writeFile(options.output, output, options.encoding, function(err) {
                    if (err) {
                        throw err;
                    }

                    callback(null, output);
                });
            } else {
                callback(null, output);
            }

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

        callback(err, dox.parseComments(data, {
            raw: true
        }));

    });
};

/**
 * Generates the output for comments.
 *
 * @param {Object} docfiles Comments to render
 * @param {Object|Function|String} options The options or the callback (if there is not options)
 * @param {Function} callback The callback, it gets two arguments (err, output)
 *
 * @api public
 */
exports.generate = function(docfiles, options, callback) {
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

    fs.readFile(options.template, options.encoding, function(err, data) {
        if (err) {
            throw err;
        }

        // Remove indentation
        data = data.replace(/\n */g, '\n');

        var output = ejs.render(data, {
            docfiles: docfiles,
            escape: function(html) {
                return String(html);
            }
        });

        // Remove double lines
        output = output.replace(/\n{3,}/g, '\n\n');

        callback(null, output);
    });

};