/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

PiCard.Tabs = function(container, sources, options) {
    this.container = container;
    this.sources = sources;
    this.options = $.extend({}, this.defaultOptions, options);
    this.locale = PiCard.locales[this.options.locale];
    this.initialize();
};

PiCard.Tabs.prototype = {
    defaultOptions: $.extend({}, PiCard.defaultOptions, {}),

    initialize: function() {
        var queue = [];
        this.container.empty();
        this.tabList = $("<ul/>");
        this.container.append(this.tabList);
        var tabID = "picard-tab-summary";
        var tab = this.addTab(this.locale.summaryTitle, tabID);
        var that = this;
        $.each(this.sources, function(i, source) {
            var tabName = source.name;
            var tabID = "picard-tab-" + i;
            var tab = that.addTab(tabName, tabID);
            queue.push({
                name:   tabName,
                url:    source.url,
                target: tab
            });
        });
        this.container.tabs();
        var summaryData = {};
        this.processQueue(queue, summaryData);
    },

    addTab: function(tabName, tabID) {
        this.tabList.append($("<li/>")
            .append($("<a/>")
                .attr("href", "#" + tabID).text(tabName)));
        var tab = $("<div/>").attr("id", tabID).addClass("picard-tab")
            .text(this.locale.loadingText);
        this.container.append(tab);
        return tab;
    },

    processQueue: function(queue, summaryData) {
        if (queue.length) {
            var entry = queue.shift();
            var that = this;
            $.ajax(entry.url)
                .done(function(data) {
                    new PiCard.Chart(entry.target, data, that.options);
                    that.updateSummary(entry.name, data, summaryData);
                })
                .fail(function(xhr, stat, err) {
                    entry.target.text(that.locale.loadingFailedText);
                })
                .always(function() {
                    that.processQueue(queue, summaryData);
                });
        } else {
            new PiCard.Chart($("#picard-tab-summary"), summaryData,
                this.options);
        }
    },

    updateSummary: function(name, data, summaryData) {
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
};
