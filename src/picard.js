var PiCard = {
    defaultOptions: {},

    locales: {},

    addLocale: function(id, data) {
        PiCard.locales[id] = data;
        if (!("locale" in PiCard.defaultOptions)) {
            PiCard.defaultOptions.locale = id;
        }
    },

    defineClass: function(mixins, constr, proto, stat) {
        $.each(mixins, function(i, mixin) {
            $.extend(constr.prototype, mixin.prototype);
        });
        $.extend(constr.prototype, proto);
        constr.prototype.constructor = constr;
        if (stat) {
            $.extend(constr, stat);
        }
        return constr;
    }
};
