module.exports = function(grunt) {
    var sources = [
        "src/picard.js",
        "src/picard.configurable.js",
        "src/picard.localized.js",
        "src/picard.chart.js",
        "src/picard.view.js"
    ];

    [ "single", "tabbed" ].forEach(function(view) {
        if (!grunt.option("no-" + view)) {
            grunt.log.writeln("Including view " + view);
            sources.push("src/picard.view." + view + ".js");
        }
    });

    var locales;
    if (grunt.option("locales")) {
        locales = grunt.option("locales").split(",");
    } else {
        locales = [ "en-us" ];
    }
    locales.forEach(function(locale) {
        grunt.log.writeln("Including locale " + locale);
        sources.push("src/picard.locale." + locale + ".js");
    });

    var banner = "/* <%= pkg.name %>\n"
        + " * Copyright (c) <%= grunt.template.today('yyyy') %> "
        + "<%= pkg.author.name %> <<%= pkg.homepage %>>\n"
        + " * Released under the MIT License\n"
        + " */\n";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        uglify: {
            options: {
                banner: banner
            },
            build: {
                src: sources,
                dest: "dist/picard.min.js"
            }
        },
        concat: {
            build: {
                src: [ "src/picard.css", "example/style.css" ],
                dest: "dist/combined.css"
            }
        },
        cssmin: {
            options: {
                banner: banner
            },
            build: {
                src: "dist/combined.css",
                dest: "dist/combined.min.css"
            }
        },
        clean: {
            build: [ "dist/combined.css" ]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-css");
    grunt.loadNpmTasks("grunt-contrib-clean");

    grunt.registerTask("default", [ "uglify", "concat", "cssmin", "clean" ]);
};
