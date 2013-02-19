PiCard.Configurable = PiCard.defineClass(
    [],

    function(options) {
        this.options = $.extend({},
            PiCard.defaultOptions, this.defaultOptions, options);
    }
);
