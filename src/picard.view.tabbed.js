PiCard.View.Tabbed = PiCard.defineClass(
    [ PiCard.View ],

    function(container, sources, options) {
        PiCard.View.call(this, container, options);
        this.sources = sources;
        this.initialize();
    },

    {
        defaultOptions: {
            includeSummary:         true,
            linkSummaryLegendItems: true
        },

        initialize: function() {
            var that = this;
            var queue = [];
            that.container.empty();
            that.tabList = $("<ul/>");
            that.container.append(that.tabList);
            if (that.options.includeSummary) {
                that.summaryTab = that.addTab(that.locale.summaryTitle, true);
                that.summaryTab.addClass("picard-tab-summary");
            }
            $.each(that.sources, function(i, source) {
                var tabName = source.name;
                var tab = that.addTab(tabName);
                queue.push({
                    name:   tabName,
                    url:    source.url,
                    target: tab
                });
            });
            that.container.tabs();
            var chartData = [];
            that.processQueue(queue, chartData);
        },

        addTab: function(tabName) {
            var that = this;
            var tabID = "picard-tab-" + PiCard.View.Tabbed.tabCount++;
            that.tabList.append($("<li/>")
                .append($("<a/>")
                    .attr("href", "#" + tabID).text(tabName)));
            var tab = $("<div/>")
                .attr("id", tabID)
                .addClass("picard-tab")
                .text(that.locale.loadingText);
            that.container.append(tab);
            return tab;
        },

        processQueue: function(queue, chartData) {
            if (queue.length == 0) {
                return;
            }
            var that = this;
            var entry = queue.shift();
            $.ajax(entry.url)
                .done(function(data) {
                    chartData.push({
                        name:   entry.name,
                        target: entry.target,
                        data:   data
                    });
                })
                .fail(function(xhr, stat, err) {
                    entry.target.text(that.locale.loadingFailedText);
                    that.container.trigger("picard.loadingFailed",
                        [ that, xhr, stat, err,
                            entry.target, entry.url, entry.name ]);
                })
                .always(function() {
                    if (queue.length == 0) {
                        that.buildCharts(chartData);
                    } else {
                        that.processQueue(queue, chartData);
                    }
                });
        },

        buildCharts: function(chartData) {
            var that = this;
            if (that.options.includeSummary) {
                var summaryData = {};
                $.each(chartData, function(index, item) {
                    that.updateSummary(item.name, item.data, summaryData);
                });
                setTimeout(function() {
                    var container = that.summaryTab;
                    var options = that.options.linkSummaryLegendItems
                        ? $.extend({ legendItemTag: "a" }, that.options)
                        : that.options;
                    new PiCard.Chart(container, summaryData, options);
                    if (that.options.linkSummaryLegendItems) {
                        that.linkSummaryLegendItems(container);
                    }
                }, 0);
            }
            $.each(chartData, function(index, item) {
                setTimeout(function() {
                    new PiCard.Chart(item.target, item.data, that.options);
                }, 0);
            });
        },

        linkSummaryLegendItems: function(summaryContainer) {
            var tabs = this.container.find(".ui-tabs-anchor");
            summaryContainer.find(".picard-legend-item")
                .each(function(index, item) {
                    var tab = tabs[index + 1];
                    $(item).click(function() {
                        tab.click();
                    });
                });
        },

        updateSummary: function(name, data, summaryData) {
            var that = this;
            summaryData[name] = {};
            for (var d = 0; d < 7; d++) {
                var dayData = {};
                for (var h = 0; h < 24; h++) {
                    dayData[h] = 0;
                }
                summaryData[name][d] = dayData;
            }
            $.each(data, function(user, perDay) {
                $.each(perDay, function(d, perHour) {
                    $.each(perHour, function(h, amount) {
                        summaryData[name][d][h] += amount;
                    });
                });
            });
        }
    },

    {
        tabCount: 0
    }
);
