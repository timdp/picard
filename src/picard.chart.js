PiCard.Chart = PiCard.defineClass(
    [ PiCard.Configurable, PiCard.Localized ],

    function(container, data, options) {
        PiCard.Configurable.call(this, options);
        PiCard.Localized.call(this, this.options.locale);
        this.container = container;
        this.data = data;
        this.initialize();
    },

    {
        defaultOptions: {
            axisWidth:          1,
            plotPadding:        10,
            labelMargin:        10,
            plotMarkerSize:     6,
            plotMarkerWidth:    1,
            minPieRadius:       2,
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
        },

        initialize: function() {
            var that = this;
            that.determineUserNames();
            that.calculateTotals();
            that.determineMaximum();
            that.setUserColors();
            that.calculateMeasurements();
            that.createPlotArea();
            that.createPlots(); 
            that.createAxes();
            that.createLegend();
            that.prepareContainer();
            that.createStage();
            that.container.trigger("picard.ready", [ that ]);
        },

        determineUserNames: function() {
            var that = this;
            if (that.options.usersKey !== undefined
                    && that.options.usersKey in that.data) {
                that.users = that.data[that.options.usersKey];
                delete that.data[that.options.usersKey];
            } else {
                that.users = that.sortUserNames();
            }
        },

        sortUserNames: function() {
            var that = this;
            var users = [];
            $.each(that.data, function(user, perDay) {
                users.push(user);
            });
            users.sort();
            return users;
        },

        prepareContainer: function() {
            var that = this;
            var id = that.container.attr("id") + "-chart";
            that.chartContainer = $("<div>")
                .attr("class", "picard-chart")
                .attr("id", id);
            that.container
                .empty()
                .append(that.legend)
                .append(that.chartContainer);
        },

        createStage: function() {
            var that = this;
            that.stage = new Kinetic.Stage({
                container: that.chartContainer.attr("id"),
                width:     that.measure.width,
                height:    that.measure.height
            });
            that.stage.add(that.plotArea);
            $.each(that.plots, function(user, plot) {
                that.stage.add(plot);
            });
            that.stage.add(that.axes);
        },

        createLegend: function() {
            var that = this;
            var userTotals = {};
            var grandTotal = 0;
            $.each(that.data, function(user, perDay) {
                var total = 0;
                $.each(perDay, function(d, perHour) {
                    $.each(perHour, function(h, amount) {
                        total += amount;
                    });
                });
                userTotals[user] = total;
                grandTotal += total;
            });
            that.legend = $("<div/>")
                .attr("class", "picard-legend")
                .append($("<span/>")
                    .attr("class", "picard-legend-label")
                    .text(that.locale.summaryLabel + " "
                        + that.formatNumber(grandTotal)));
            $.each(that.users, function(i, user) {
                var strings = [
                    user,
                    that.formatNumber(userTotals[user])
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
            that.container.trigger("picard.activate", [ that, user ]);
            $.each(that.plots, function(u, plot) {
                that.setOpacity(plot, (user === null || user == u)
                    ? that.options.activeOpacity
                    : that.options.inactiveOpacity);
            });
            that.setOpacity(that.plotArea, (user === null)
                ? that.options.activeOpacity
                : that.options.inactiveOpacity);
        },

        setOpacity: function(layer, opacity) {
            var that = this;
            if (layer.getOpacity() != opacity) {
                layer.setOpacity(opacity);
                layer.draw();
            }
        },

        createPlotArea: function() {
            var that = this;
            that.plotArea = new Kinetic.Layer();
            var x0 = that.measure.yLabelWidth + that.options.labelMargin
                + that.options.axisWidth + that.options.plotPadding
                + that.options.maxPieRadius;
            var y = that.options.plotPadding + that.options.maxPieRadius;
            var s = that.options.plotMarkerSize / 2;
            for (var d = 0; d < 7; d++) {
                var x = x0;
                for (var h = 0; h < 24; h++) {
                    if (that.options.drawAllPlotMarkers || !that.totals[d][h]) {
                        that.plotArea.add(new Kinetic.Line({
                            points:      [ x - s, y, x + s, y ],
                            stroke:      that.options.plotMarkerColor,
                            strokeWidth: that.options.plotMarkerWidth
                        }));
                        that.plotArea.add(new Kinetic.Line({
                            points:      [ x, y - s, x, y + s ],
                            stroke:      that.options.plotMarkerColor,
                            strokeWidth: that.options.plotMarkerWidth
                        }));
                    }
                    x += that.options.maxPieRadius * 2;
                }
                y += that.options.maxPieRadius * 2;
            }
        },

        createPlots: function() {
            var that = this;
            that.plots = {};
            $.each(that.userColors, function(user, color) {
                that.plots[user] = new Kinetic.Layer();
                that.plots[user].setOpacity(that.options.activeOpacity);
            });
            var x0 = that.measure.yLabelWidth + that.options.labelMargin
                + that.options.axisWidth + that.options.plotPadding
                + that.options.maxPieRadius;
            var y = that.options.plotPadding + that.options.maxPieRadius;
            for (var d = 0; d < 7; d++) {
                var x = x0;
                for (var h = 0; h < 24; h++) {
                    if (that.totals[d] && that.totals[d][h]) {
                        that.plotPie(d, h, x, y);
                    }
                    x += that.options.maxPieRadius * 2;
                }
                y += that.options.maxPieRadius * 2;
            }
        },

        plotPie: function(d, h, x, y) {
            var that = this;
            var total = that.totals[d][h];
            var ratio = that.getRatio(total);
            if (ratio <= 0) {
                return;
            }
            var radius = Math.max(that.options.minPieRadius,
                ratio * that.options.maxPieRadius);
            var angle = (that.options.startAngle === null)
                ? Math.random() * 360 : that.options.startAngle;
            $.each(that.data, function(user, perDay) {
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
            var that = this;
            if (value <= 0) {
                return 0;
            }
            var transform = (that.options.scale == "quad") ? Math.sqrt
                : (that.options.scale == "log") ? Math.log
                : function(n) { return n; };
            return transform(value) / transform(that.maximum);
        },

        createAxes: function() {
            var that = this;
            that.axes = new Kinetic.Layer();
            that.createXAxis();
            that.createYAxis();
        },

        createXAxis: function(axes) {
            var that = this;
            that.axes.add(new Kinetic.Line({
                points:      [
                    that.measure.yLabelWidth + that.options.labelMargin,
                    that.measure.plotHeight + that.options.axisWidth / 2,
                    that.measure.width,
                    that.measure.plotHeight + that.options.axisWidth / 2
                ],
                stroke:      that.options.axisColor,
                strokeWidth: that.options.axisWidth
            }));
            var x = that.measure.yLabelWidth + that.options.labelMargin
                + that.options.axisWidth + that.options.plotPadding
                + that.options.maxPieRadius;
            var y = that.measure.plotHeight + that.options.axisWidth
                + that.options.labelMargin;
            for (var h = 0; h < 24; h++) {
                var text = that.createText((h < 10) ? "0" + h : h,
                    x, y, that.options.axisLabelColor);
                text.setOffset({
                    x: text.getWidth() / 2
                });
                that.axes.add(text);
                x += that.options.maxPieRadius * 2;
            }
        },

        createYAxis: function() {
            var that = this;
            that.axes.add(new Kinetic.Line({
                points:      [
                    that.measure.yLabelWidth + that.options.labelMargin
                        + that.options.axisWidth / 2,
                    0,
                    that.measure.yLabelWidth + that.options.labelMargin
                        + that.options.axisWidth / 2,
                    that.measure.plotHeight + that.options.axisWidth
                ],
                stroke:      that.options.axisColor,
                strokeWidth: that.options.axisWidth
            }));
            var x = that.measure.yLabelWidth;
            var y = that.options.plotPadding + that.options.maxPieRadius
                - that.measure.labelHeight / 2;
            for (var d = 0; d < 7; d++) {
                var text = that.createText(that.locale.dayNames[d],
                    x, y, that.options.axisLabelColor);
                text.setOffset({
                    x: text.getWidth()
                });
                that.axes.add(text);
                y += that.options.maxPieRadius * 2;
            }
        },

        calculateTotals: function() {
            var that = this;
            that.totals = [];
            for (var d = 0; d < 7; d++) {
                var dayTotals = [];
                for (var h = 0; h < 24; h++) {
                    dayTotals[h] = 0;
                    $.each(that.data, function(user, perDay) {
                        if (perDay[d] && perDay[d][h]) {
                            dayTotals[h] += perDay[d][h];
                        }
                    });
                }
                that.totals[d] = dayTotals;
            }
        },

        determineMaximum: function() {
            var that = this;
            that.maximum = 0;
            for (var d = 0; d < 7; d++) {
                for (var h = 0; h < 24; h++) {
                    if (that.totals[d] && that.totals[d][h]) {
                        that.maximum = Math.max(that.maximum, that.totals[d][h]);
                    }
                }
            }
        },

        setUserColors: function() {
            var that = this;
            that.userColors = {};
            $.each(that.users, function(i, user) {
                that.userColors[user]
                    = that.options.pieColors[i % that.options.pieColors.length];
            });
        },

        calculateMeasurements: function() {
            var that = this;
            var yLabelWidth = 0;
            for (var d = 0; d < 7; d++) {
                var text = that.createText(that.locale.dayNames[d], 0, 0, "black");
                yLabelWidth = Math.max(yLabelWidth, text.getWidth());
            }
            var labelHeight = that.createText("X", 0, 0, "black").getHeight();

            var plotWidth = that.options.plotPadding
                + that.options.maxPieRadius * 2 * 24 + that.options.plotPadding;
            var plotHeight = that.options.plotPadding
                + that.options.maxPieRadius * 2 * 7 + that.options.plotPadding;
            var width = yLabelWidth + that.options.labelMargin
                + that.options.axisWidth + plotWidth;
            var height = plotHeight + that.options.axisWidth
                + that.options.labelMargin + labelHeight;

            that.measure = {
                width:       width,
                height:      height,
                plotWidth:   plotWidth,
                plotHeight:  plotHeight,
                yLabelWidth: yLabelWidth,
                labelHeight: labelHeight
            };
        },

        createText: function(text, x, y, color) {
            var that = this;
            return new Kinetic.Text({
                text:       text,
                fontFamily: that.options.fontFamily,
                fontSize:   that.options.fontSize,
                fill:       color,
                x:          x,
                y:          y
            });
        }
    }
);
