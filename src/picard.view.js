PiCard.View = PiCard.defineClass(
	[ PiCard.Configurable, PiCard.Localized ],

	function(container, options) {
	    this.container = container;
	    PiCard.Configurable.call(this, options);
	    PiCard.Localized.call(this, this.options.locale);
	}
);
