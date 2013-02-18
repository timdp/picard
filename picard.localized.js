/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

PiCard.Localized = PiCard.defineClass(
	[],

	function(localeID) {
	    this.locale = PiCard.locales[localeID];
	},

	{
	    formatNumber: function(number) {
	    	var that = this;
	        number = "" + number;
	        var re = /^([0-9]+)([0-9]{3})$/;
	        var match = true;
	        while (match) {
	            match = false;
	            number = number.replace(re, function(m0, m1, m2) {
	                match = true;
	                return m1 + that.locale.thousandsSeparator + m2;
	            });
	        }
	        return number;
	    }
	}
);
