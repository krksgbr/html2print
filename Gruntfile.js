
module.exports = function(grunt){
    require('jit-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({
        copy:{
            main:{
                files:[
                        { expand: true, flatten: true, src: ['src/js/*'], dest: 'dist/js/', filter: 'isFile' },
                        { expand: true, flatten: true, src: ['src/fonts/*'], dest: 'dist/fonts/', filter: 'isFile' },
                        { expand: true, flatten: true, src: ['src/html/*'], dest: 'dist/html/', filter: 'isFile' },
                ]
            }
        },

        less: {
            development: {
                files: {
                    "dist/less/html2print.less":    "src/less/main.less",
                    "dist/css/outerUI.css":             "src/less/outerUI.less"
                }
            }
        },

        watch: {
            scripts: {
                files: ['src/js/*.js'],
                tasks: ['copy'],
                options: {
                    spawn: false
                }
            },

            styles:{
                files: ['src/less/*.less'],
                tasks: ['less'],
                options: {
                    spawn: false
                }
            },

            html:{
                files: ['src/html/*.html'],
                tasks: ['copy']
            },

            fonts:{
                files: ['src/fonts/*'],
                tasks: ['copy']
            }
        }
    });
};