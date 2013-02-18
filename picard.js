/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

var PiCard = {
    defaultOptions: {},

    locales: {},

    addLocale: function(id, data) {
        PiCard.locales[id] = data;
        if (!("locale" in PiCard.defaultOptions)) {
            PiCard.defaultOptions.locale = id;
        }
    },

    defineClass: function(mixins, constr, proto) {
        $.each(mixins, function(i, mixin) {
            $.extend(constr.prototype, mixin.prototype);
        });
        $.extend(constr.prototype, proto);
        constr.prototype.constructor = constr;
        return constr;
    }
};
