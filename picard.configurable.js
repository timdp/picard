/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

PiCard.Configurable = PiCard.defineClass(
    [],

    function(options) {
        this.options = $.extend({},
            PiCard.defaultOptions, this.defaultOptions, options);
    }
);
