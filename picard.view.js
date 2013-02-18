/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

PiCard.View = PiCard.defineClass(
	[ PiCard.Configurable, PiCard.Localized ],

	function(container, options) {
	    this.container = container;
	    PiCard.Configurable.call(this, options);
	    PiCard.Localized.call(this, this.options.locale);
	}
);
