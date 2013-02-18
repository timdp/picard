/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

PiCard.Chart = function(container, data, options) {
    this.container = container;
    this.data = data;
    this.options = $.extend({}, this.defaultOptions, options);
    this.locale = PiCard.locales[this.options.locale];
    this.initialize();
};

PiCard.Chart.prototype = {
    defaultOptions: $.extend({}, PiCard.defaultOptions, {
        axisWidth:          1,
        plotPadding:        10,
        labelMargin:        10,
        plotMarkerSize:     6,
        plotMarkerWidth:    1,
        maxPieRadius:       20,
        startAngle:         -90,
        clockwise:          true,
        drawAllPlotMarkers: false,
        dotScale:           "quad",
        legendFormat:       "{0} ({1})",
        fontFamily:         "Verdana, Arial, Helvetica, sans-serif",
        fontSize:           12,
        activeOpacity:      1.0,
        inactiveOpacity:    0.2,
        axisColor:          "#666",
        plotMarkerColor:    "#999",
        axisLabelColor:     "#666",
        pieColors:          [
            "#C90", "#0C9", "#90C", "#9C0", "#09C", "#C09",
            "#C00", "#0C0", "#00C", "#099", "#909", "#990",
            "#C66", "#6C6", "#66C", "#999"
        ],
        usersKey:           ".users"
    }),

    initialize: function() {
        this.determineUserNames();
        this.calculateTotals();
        this.determineMaximum();
        this.setUserColors();
        this.calculateMeasurements();
        this.createPlotArea();
        this.createPlots(); 
        this.createAxes();
        this.createLegend();
        this.prepareContainer();
        this.createStage();
    },

    determineUserNames: function() {
        if (this.options.usersKey !== undefined
                && this.options.usersKey in this.data) {
            this.users = this.data[this.options.usersKey];
            delete this.data[this.options.usersKey];
        } else {
            this.users = this.sortUserNames();
        }
    },

    sortUserNames: function() {
        var users = [];
        $.each(this.data, function(user, perDay) {
            users.push(user);
        });
        users.sort();
        return users;
    },

    prepareContainer: function() {
        var id = this.container.attr("id") + "-chart";
        this.chartContainer = $("<div>").attr("id", id);
        this.container
            .empty()
            .append(this.legend)
            .append(this.chartContainer);
    },

    createStage: function() {
        this.stage = new Kinetic.Stage({
            container: this.chartContainer.attr("id"),
            width:     this.measure.width,
            height:    this.measure.height
        });
        this.stage.add(this.plotArea);
        var that = this;
        $.each(this.plots, function(user, plot) {
            that.stage.add(plot);
        });
        this.stage.add(this.axes);
    },

    createLegend: function() {
        var userTotals = {};
        var grandTotal = 0;
        $.each(this.data, function(user, perDay) {
            var total = 0;
            $.each(perDay, function(d, perHour) {
                $.each(perHour, function(h, amount) {
                    total += amount;
                });
            });
            userTotals[user] = total;
            grandTotal += total;
        });
        this.legend = $("<div/>")
            .attr("class", "picard-legend")
            .append($("<span/>")
                .attr("class", "picard-legend-label")
                .text(this.locale.summaryLabel + " "
                    + PiCard.formatNumber(grandTotal, this.locale)));
        var that = this;
        $.each(this.users, function(i, user) {
            var strings = [
                user,
                PiCard.formatNumber(userTotals[user], that.locale)
            ];
            var code = that.options.legendFormat.replace(
                /\{([0-9]+)\}/g,
                function(m0, m1) {
                    return strings[parseInt(m1, 10)];
                });
            that.legend.append(" ");
            that.legend.append($("<span>")
                .attr("class", "picard-legend-item")
                .css("color", that.userColors[user])
                .mouseover({ user: user, that: that }, that.setActive)
                .mouseout({ user: null, that: that }, that.setActive)
                .html(code));
        });
    },

    setActive: function(event) {
        var user = event.data.user;
        var that = event.data.that;
        $.each(that.plots, function(u, plot) {
            that.setOpacity(plot, (user === null || user == u)
                ? that.options.activeOpacity : that.options.inactiveOpacity);
        });
        that.setOpacity(that.plotArea, (user === null)
            ? that.options.activeOpacity : that.options.inactiveOpacity);
    },

    setOpacity: function(layer, opacity) {
        if (layer.getOpacity() != opacity) {
            layer.setOpacity(opacity);
            layer.draw();
        }
    },

    createPlotArea: function() {
        this.plotArea = new Kinetic.Layer();
        var x0 = this.measure.yLabelWidth + this.options.labelMargin
            + this.options.axisWidth + this.options.plotPadding
            + this.options.maxPieRadius;
        var y = this.options.plotPadding + this.options.maxPieRadius;
        var s = this.options.plotMarkerSize / 2;
        for (var d = 0; d < 7; d++) {
            var x = x0;
            for (var h = 0; h < 24; h++) {
                if (this.options.drawAllPlotMarkers || !this.totals[d][h]) {
                    this.plotArea.add(new Kinetic.Line({
                        points:      [ x - s, y, x + s, y ],
                        stroke:      this.options.plotMarkerColor,
                        strokeWidth: this.options.plotMarkerWidth
                    }));
                    this.plotArea.add(new Kinetic.Line({
                        points:      [ x, y - s, x, y + s ],
                        stroke:      this.options.plotMarkerColor,
                        strokeWidth: this.options.plotMarkerWidth
                    }));
                }
                x += this.options.maxPieRadius * 2;
            }
            y += this.options.maxPieRadius * 2;
        }
    },

    createPlots: function() {
        var that = this;
        that.plots = {};
        $.each(this.userColors, function(user, color) {
            that.plots[user] = new Kinetic.Layer();
            that.plots[user].setOpacity(that.options.activeOpacity);
        });
        var x0 = this.measure.yLabelWidth + this.options.labelMargin
            + this.options.axisWidth + this.options.plotPadding
            + this.options.maxPieRadius;
        var y = this.options.plotPadding + this.options.maxPieRadius;
        for (var d = 0; d < 7; d++) {
            var x = x0;
            for (var h = 0; h < 24; h++) {
                if (this.totals[d] && this.totals[d][h]) {
                    this.plotPie(d, h, x, y);
                }
                x += this.options.maxPieRadius * 2;
            }
            y += this.options.maxPieRadius * 2;
        }
    },

    plotPie: function(d, h, x, y) {
        var total = this.totals[d][h];
        var ratio = this.getRatio(total);
        if (ratio <= 0) {
            return;
        }
        var radius = ratio * this.options.maxPieRadius;
        var angle = (this.options.startAngle === null)
            ? Math.random() * 360 : this.options.startAngle;
        var that = this;
        $.each(this.data, function(user, perDay) {
            if (perDay[d] && perDay[d][h]) {
                var degrees = 360 * (perDay[d][h] / total);
                if (that.options.clockWise) {
                    degrees = -degrees;
                }
                var wedge = new Kinetic.Wedge({
                    x:           x,
                    y:           y,
                    radius:      radius,
                    rotationDeg: angle,
                    angleDeg:    degrees,
                    fill:        that.userColors[user]
                });
                that.plots[user].add(wedge);
                angle += degrees;
            }
        });
    },

    getRatio: function(value) {
        if (value <= 0) {
            return 0;
        }
        var transform = (this.options.scale == "quad") ? Math.sqrt
            : (this.options.scale == "log") ? Math.log
            : function(n) { return n; };
        return transform(value) / transform(this.maximum);
    },

    createAxes: function() {
        this.axes = new Kinetic.Layer();
        this.createXAxis();
        this.createYAxis();
    },

    createXAxis: function(axes) {
        this.axes.add(new Kinetic.Line({
            points:      [
                this.measure.yLabelWidth + this.options.labelMargin,
                this.measure.plotHeight + this.options.axisWidth / 2,
                this.measure.width,
                this.measure.plotHeight + this.options.axisWidth / 2
            ],
            stroke:      this.options.axisColor,
            strokeWidth: this.options.axisWidth
        }));
        var x = this.measure.yLabelWidth + this.options.labelMargin
            + this.options.axisWidth + this.options.plotPadding
            + this.options.maxPieRadius;
        var y = this.measure.plotHeight + this.options.axisWidth
            + this.options.labelMargin;
        for (var h = 0; h < 24; h++) {
            var text = this.createText((h < 10) ? "0" + h : h,
                x, y, this.options.axisLabelColor);
            text.setOffset({
                x: text.getWidth() / 2
            });
            this.axes.add(text);
            x += this.options.maxPieRadius * 2;
        }
    },

    createYAxis: function() {
        this.axes.add(new Kinetic.Line({
            points:      [
                this.measure.yLabelWidth + this.options.labelMargin
                    + this.options.axisWidth / 2,
                0,
                this.measure.yLabelWidth + this.options.labelMargin
                    + this.options.axisWidth / 2,
                this.measure.plotHeight + this.options.axisWidth
            ],
            stroke:      this.options.axisColor,
            strokeWidth: this.options.axisWidth
        }));
        var x = this.measure.yLabelWidth;
        var y = this.options.plotPadding + this.options.maxPieRadius
            - this.measure.labelHeight / 2;
        for (var d = 0; d < 7; d++) {
            var text = this.createText(this.locale.dayNames[d],
                x, y, this.options.axisLabelColor);
            text.setOffset({
                x: text.getWidth()
            });
            this.axes.add(text);
            y += this.options.maxPieRadius * 2;
        }
    },

    calculateTotals: function() {
        this.totals = [];
        for (var d = 0; d < 7; d++) {
            var dayTotals = [];
            for (var h = 0; h < 24; h++) {
                dayTotals[h] = 0;
                $.each(this.data, function(user, perDay) {
                    if (perDay[d] && perDay[d][h]) {
                        dayTotals[h] += perDay[d][h];
                    }
                });
            }
            this.totals[d] = dayTotals;
        }
    },

    determineMaximum: function() {
        this.maximum = 0;
        for (var d = 0; d < 7; d++) {
            for (var h = 0; h < 24; h++) {
                if (this.totals[d] && this.totals[d][h]) {
                    this.maximum = Math.max(this.maximum, this.totals[d][h]);
                }
            }
        }
    },

    setUserColors: function() {
        this.userColors = {};
        var that = this;
        $.each(this.users, function(i, user) {
            that.userColors[user]
                = that.options.pieColors[i % that.options.pieColors.length];
        });
    },

    calculateMeasurements: function() {
        var yLabelWidth = 0;
        for (var d = 0; d < 7; d++) {
            var text = this.createText(this.locale.dayNames[d], 0, 0, "black");
            yLabelWidth = Math.max(yLabelWidth, text.getWidth());
        }
        var labelHeight = this.createText("X", 0, 0, "black").getHeight();

        var plotWidth = this.options.plotPadding
            + this.options.maxPieRadius * 2 * 24 + this.options.plotPadding;
        var plotHeight = this.options.plotPadding
            + this.options.maxPieRadius * 2 * 7 + this.options.plotPadding;
        var width = yLabelWidth + this.options.labelMargin
            + this.options.axisWidth + plotWidth;
        var height = plotHeight + this.options.axisWidth
            + this.options.labelMargin + labelHeight;

        this.measure = {
            width:       width,
            height:      height,
            plotWidth:   plotWidth,
            plotHeight:  plotHeight,
            yLabelWidth: yLabelWidth,
            labelHeight: labelHeight
        };
    },

    createText: function(text, x, y, color) {
        return new Kinetic.Text({
            text:       text,
            fontFamily: this.options.fontFamily,
            fontSize:   this.options.fontSize,
            fill:       color,
            x:          x,
            y:          y
        });
    }
};
