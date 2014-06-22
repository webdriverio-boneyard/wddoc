var formatter = {};

formatter.format = function(docfile) {
    var result = [];

    docfile.javadoc.forEach(function(javadoc, index) {

        var type = (javadoc.ctx && javadoc.ctx.type);
        var name = (javadoc.ctx && typeof javadoc.ctx.name === 'string') ? javadoc.ctx.name : '';

        var description = '';
        var paramStr = [];
        var paramTags = [];
        var returnTags = [];
        var throwsTags = [];
        var testfiles = [];
        var tagDeprecated = false;
        var tagName = '';
        var tagClass = '';
        var tagType = '';
        var tagFunction = '';
        var tagMethod = '';
        var tagSee = '';
        var tagVersion = '';
        var tagAuthor = '';

        javadoc.tags.forEach(function(tag) {

            if (tag.type == 'param') {
                tag.joinedTypes = tag.types.join('|');

                if(tag.joinedTypes.indexOf('=') > -1) {
                    tag.name = '[' + tag.name + ']';
                }

                paramTags.push(tag);
                paramStr.push(tag.name);
            } else if (tag.type === 'return') {
                tag.joinedTypes = tag.types.join('|');
                returnTags.push(tag);
            } else if (tag.type === 'throws') {
                tag.joinedTypes = tag.types.join('|');
                throwsTags.push(tag);
            } else if (tag.type === 'method') {
                type = 'method';
                tagMethod = tag.string;
            } else if (tag.type === 'class') {
                type = 'class';
                tagClass = tag.string;
            } else if (tag.type === 'function') {
                type = 'function';
                tagFunction = tag.string;
            } else if (tag.type === 'name') {
                tagName = tag.string;
            } else if (tag.type === 'see') {
                tagSee = tag.local;
            } else if (tag.type === 'version') {
                tagVersion = tag.string;
            } else if (tag.type === 'deprecated') {
                tagDeprecated = true;
            } else if (tag.type === 'author') {
                tagAuthor = tag.string;
            } else if (tag.type === 'test') {
                var testfile = tag.string.split(/ /);
                testfiles.push({
                    filename: testfile[0],
                    content: testfile[1]
                });
            } else if (tag.type === 'type') {
                tagType = tag.types[0];
            } else if (tag.type === 'example') {
                gist = tag.string;
            }
        });

        name = tagName !== '' ? tagName : tagMethod !== '' ? tagMethod : tagClass !== '' ? tagClass : tagFunction !== '' ? tagFunction : name;
        description = javadoc.description.full
            .replace(/\nh1/, '#')
            .replace(/\nh2/, '##')
            .replace(/\nh3/, '###')
            .replace(/\nh4/, '####')
            .replace(/\nh5/, '#####')
            .replace(/\nh6/, '######')
            .replace(/^h1/, '#')
            .replace(/^h2/, '##')
            .replace(/^h3/, '###')
            .replace(/^h4/, '####')
            .replace(/^h5/, '#####')
            .replace(/^h6/, '######');

        var example = description.match(/<example>((.|\n)*)<\/example>/g),
            files = [],
            exampleCodeLine = [],
            exampleFilename = '',
            i = 0, currentLine = 0;

        if(example && example[0]) {
            console.log('parse example section for', docfile.filename);
            example = example[0].replace(/<(\/)*example>/g,'').split(/\n/g);
            example.forEach(function(line) {
                ++currentLine;

                var checkForFilenameExpression = line.match(/\s\s\s\s(:(\S)*\.(\S)*)/g);
                if((checkForFilenameExpression && checkForFilenameExpression.length) || (currentLine === example.length)) {

                    if(exampleCodeLine.length) {

                        /**
                         * remove filename expression in first line
                         */
                        exampleFilename = exampleCodeLine.shift().trim().substr(1);
                        var code = exampleCodeLine.join('\n');

                        /**
                         * add example
                         */
                        if(exampleFilename !== '' && code !== '') {
                            files.push({
                                file: exampleFilename,
                                format: exampleFilename.split(/\./)[1],
                                code: code
                            });
                        }

                        /**
                         * reset loop conditions
                         */
                        exampleCodeLine = [];
                        ++i;
                    }

                    /**
                     * if this is the last line of code dont proceed
                     */
                    if(currentLine === example.length) {
                        return;
                    }

                }

                exampleCodeLine.push(line.substr(4));

            });

            /**
             * remove example section from description
             */
            description = description.substr(0, description.indexOf('<example>'));
        }

        /**
         * add callback as last parameter
         */
        paramStr.push('[callback]');
        paramStr = paramStr.join(',');
        paramStr = paramStr.replace(/,\[/g,'[,');

        docfile.javadoc[index] = {
            name: name,
            paramStr: paramStr,
            paramTags: paramTags,
            returnTags: returnTags,
            throwsTags: throwsTags,
            author: tagAuthor,
            version: tagVersion,
            see: tagSee,
            deprecated: tagDeprecated,
            type: tagType,
            isMethod: type === 'method',
            isFunction: type === 'function',
            isClass: type === 'class',
            description: description,
            ignore: javadoc.ignore,
            testfiles: testfiles,
            raw: javadoc,
            examples: files
        };
    });

    return docfile;
};

module.exports = formatter;