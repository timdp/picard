PiCard.View.Single = PiCard.defineClass(
    [ PiCard.View ],

    function(container, url, options) {
        PiCard.View.call(this, container, options);
        this.url = url;
        this.initialize();
    },

    {
        initialize: function() {
            var that = this;
            $.ajax(that.url)
                .done(function(data) {
                    new PiCard.Chart(that.container, data, that.options);
                })
                .fail(function(xhr, stat, err) {
                    that.container.text(that.locale.loadingFailedText);
                    that.container.trigger("picard.loadingFailed",
                        [ that, xhr, stat, err,
                            that.container, that.url ]);
                });
        }
    }
);
