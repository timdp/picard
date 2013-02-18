/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

var PiCard = {
    defaultOptions: {
        locale: "en-US"
    },

    locales: {},

    formatNumber: function(number, locale) {
        number = "" + number;
        var re = /^([0-9]+)([0-9]{3})$/;
        var match = true;
        while (match) {
            match = false;
            number = number.replace(re, function(m0, m1, m2) {
                match = true;
                return m1 + locale.thousandsSeparator + m2;
            });
        }
        return number;
    }
};

PiCard.locales["en-US"] = {
    dayNames:           [ "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN" ],
    summaryTitle:       "Summary",
    summaryLabel:       "Commits:",
    loadingText:        "Loading …",
    loadingFailedText:  "Failed to load data. Reload to try again.",
    thousandsSeparator: ","
};
