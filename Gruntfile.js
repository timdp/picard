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
            console.log("Including view " + view);
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
        console.log("Including locale " + locale);
        sources.push("src/picard.locale." + locale + ".js");
    });

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        uglify: {
            options: {
                banner: "/* <%= pkg.name %>\n"
                    + " * Copyright (c) <%= grunt.template.today('yyyy') %> "
                    + "<%= pkg.author.name %> <<%= pkg.homepage %>>\n"
                    + " * Released under the MIT License\n"
                    + " */\n"
            },
            build: {
                src: sources,
                dest: "dist/picard.min.js"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", [ "uglify" ]);
};
