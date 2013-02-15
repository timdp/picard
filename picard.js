/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

var PiCard = (function() {
    var opt = {
        axisWidth:       1,
        plotPadding:     10,
        labelMargin:     10,
        plotMarkerSize:  6,
        plotMarkerWidth: 1,
        maxPieRadius:    20,
        startAngle:      -90,
        clockwise:       true,
        dotScale:        "quad",
        fontFamily:      "Verdana, Arial, Helvetica, sans-serif",
        fontSize:        12,
        axisColor:       "#666",
        plotMarkerColor: "#999",
        axisLabelColor:  "#666",
        pieColors:       [
            "#C90", "#0C9", "#90C", "#9C0", "#09C", "#C09",
            "#C00", "#0C0", "#00C", "#099", "#909", "#990",
            "#C66", "#6C6", "#66C", "#999"
        ]
    };

    var loc = {
        dayNames:     [ "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN" ],
        summaryTitle: "Summary",
        summaryLabel: "Commits:",
        loadingText:  "Loading …"
    };

    var createChart = function(data, target) {
        target.empty();
        var users = [];
        var userTotals = {};
        var grandTotal = 0;
        for (user in data) {
            users.push(user);
            var total = 0;
            for (d in data[user]) {
                for (h in data[user][d]) {
                    total += data[user][d][h];
                }
            }
            userTotals[user] = total;
            grandTotal += total;
        }
        var userColors = getUserColors(users);

        var legend = $("<div style='margin-bottom: 1em'>"
            + "<span style='margin-right: 1ex; white-space: nowrap'>"
            + loc.summaryLabel + " " + grandTotal
            + "</span></div>");
        for (var i = 0; i < users.length; i++) {
            legend.append(" ");
            legend.append($("<span>")
                .css({
                    color:       userColors[users[i]],
                    marginRight: "1ex",
                    whiteSpace:  "nowrap"
                })
                .text(users[i] + " (" + userTotals[users[i]] + ")"));
        }
        target.append(legend);

        var containerID = target.attr("id") + "-container";
        var container = $("<div>").attr("id", containerID);
        target.append(container);

        var measure = getMeasurements();

        var stage = new Kinetic.Stage({
            container: containerID,
            width:     measure.width,
            height:    measure.height
        });
        var plotArea = createPlotArea(measure);
        stage.add(plotArea);
        var plot = createPlot(data, userColors, measure);
        stage.add(plot);
        var axes = createAxes(measure);
        stage.add(axes);
    };

    var createPlotArea = function(measure) {
        var plotArea = new Kinetic.Layer();
        var x0 = measure.yLabelWidth + opt.labelMargin + opt.axisWidth
            + opt.plotPadding + opt.maxPieRadius;
        var y = opt.plotPadding + opt.maxPieRadius;
        var s = opt.plotMarkerSize / 2;
        for (var d = 0; d < 7; d++) {
            var x = x0;
            for (var h = 0; h < 24; h++) {
                plotArea.add(new Kinetic.Line({
                    points:      [ x - s, y, x + s, y ],
                    stroke:      opt.plotMarkerColor,
                    strokeWidth: opt.plotMarkerWidth
                }));
                plotArea.add(new Kinetic.Line({
                    points:      [ x, y - s, x, y + s ],
                    stroke:      opt.plotMarkerColor,
                    strokeWidth: opt.plotMarkerWidth
                }));
                x += opt.maxPieRadius * 2;
            }
            y += opt.maxPieRadius * 2;
        }
        return plotArea;
    };

    var createPlot = function(data, userColors, measure) {
        var totals = calculateTotals(data);
        var max = getMaximum(totals);
        var plot = new Kinetic.Layer();
        var x0 = measure.yLabelWidth + opt.labelMargin + opt.axisWidth
            + opt.plotPadding + opt.maxPieRadius;
        var y = opt.plotPadding + opt.maxPieRadius;
        for (var d = 0; d < 7; d++) {
            var x = x0;
            for (var h = 0; h < 24; h++) {
                if (totals[d] && totals[d][h]) {
                    plotValue(d, h, data, totals, max, plot, x, y, userColors);
                }
                x += opt.maxPieRadius * 2;
            }
            y += opt.maxPieRadius * 2;
        }
        return plot;
    };

    var createAxes = function(measure) {
        var axes = new Kinetic.Layer();
        createXAxis(axes, measure);
        createYAxis(axes, measure);
        return axes;
    }

    var createXAxis = function(axes, measure) {
        axes.add(new Kinetic.Line({
            points:      [
                measure.yLabelWidth + opt.labelMargin,
                measure.plotHeight + opt.axisWidth / 2,
                measure.width,
                measure.plotHeight + opt.axisWidth / 2
            ],
            stroke:      opt.axisColor,
            strokeWidth: opt.axisWidth
        }));
        var x = measure.yLabelWidth + opt.labelMargin + opt.axisWidth
            + opt.plotPadding + opt.maxPieRadius;
        var y = measure.plotHeight + opt.axisWidth + opt.labelMargin;
        for (var h = 0; h < 24; h++) {
            var text = createText((h < 10) ? "0" + h : h,
                x, y, opt.axisLabelColor);
            text.setOffset({
                x: text.getWidth() / 2
            });
            axes.add(text);
            x += opt.maxPieRadius * 2;
        }
    };

    var createYAxis = function(axes, measure) {
        axes.add(new Kinetic.Line({
            points:      [
                measure.yLabelWidth + opt.labelMargin + opt.axisWidth / 2,
                0,
                measure.yLabelWidth + opt.labelMargin + opt.axisWidth / 2,
                measure.plotHeight + opt.axisWidth
            ],
            stroke:      opt.axisColor,
            strokeWidth: opt.axisWidth
        }));
        var x = measure.yLabelWidth;
        var y = opt.plotPadding + opt.maxPieRadius - measure.labelHeight / 2;
        for (var d = 0; d < 7; d++) {
            var text = createText(loc.dayNames[d],
                x, y, opt.axisLabelColor);
            text.setOffset({
                x: text.getWidth()
            });
            axes.add(text);
            y += opt.maxPieRadius * 2;
        }
    };

    var plotValue = function(d, h, data, totals, max, plot, x, y, userColors) {
        var total = totals[d][h];
        var ratio = getRatio(total, max);
        if (ratio <= 0) {
            return;
        }
        var radius = ratio * opt.maxPieRadius;
        var angle = (opt.startAngle === null)
            ? Math.random() * 360 : opt.startAngle;
        for (user in data) {
            if (!data[user][d] || !data[user][d][h]) {
                continue;
            }
            var degrees = 360 * (data[user][d][h] / total);
            if (opt.clockWise) {
                degrees = -degrees;
            }
            var wedge = new Kinetic.Wedge({
                x:           x,
                y:           y,
                radius:      radius,
                rotationDeg: angle,
                angleDeg:    degrees,
                fill:        userColors[user]
            });
            plot.add(wedge);
            angle += degrees;
        }
    };

    var getRatio = function(value, max) {
        if (value <= 0) {
            return 0;
        }
        var transform = (opt.scale == "quad") ? Math.sqrt
            : (opt.scale == "log") ? Math.log
            : function(n) { return n; };
        return transform(value) / transform(max);
    };

    var getUserColors = function(users) {
        var userColors = {};
        for (var i = 0; i < users.length; i++) {
            userColors[users[i]] = opt.pieColors[i % opt.pieColors.length];
        }
        return userColors;
    };

    var calculateTotals = function(data) {
        var totals = [];
        for (var d = 0; d < 7; d++) {
            var dayTotals = [];
            for (var h = 0; h < 24; h++) {
                dayTotals[h] = 0;
                for (user in data) {
                    if (data[user][d] && data[user][d][h]) {
                        dayTotals[h] += data[user][d][h];
                    }
                }
            }
            totals[d] = dayTotals;
        }
        return totals;
    };

    var getMaximum = function(totals) {
        var max = 0;
        for (var d = 0; d < 7; d++) {
            for (var h = 0; h < 24; h++) {
                if (totals[d] && totals[d][h]) {
                    max = Math.max(max, totals[d][h]);
                }
            }
        }
        return max;
    };

    var getMeasurements = function() {
        var yLabelWidth = 0;
        for (var d = 0; d < 7; d++) {
            var text = createText(loc.dayNames[d], 0, 0, "black");
            yLabelWidth = Math.max(yLabelWidth, text.getWidth());
        }
        var labelHeight = createText("X", 0, 0, "black").getHeight();

        var plotWidth = opt.plotPadding + opt.maxPieRadius * 2 * 24
            + opt.plotPadding;
        var plotHeight = opt.plotPadding + opt.maxPieRadius * 2 * 7
            + opt.plotPadding;
        var width = yLabelWidth + opt.labelMargin + opt.axisWidth + plotWidth;
        var height = plotHeight + opt.axisWidth + opt.labelMargin + labelHeight;

        return {
            width:       width,
            height:      height,
            plotWidth:   plotWidth,
            plotHeight:  plotHeight,
            yLabelWidth: yLabelWidth,
            labelHeight: labelHeight
        };
    };

    var createText = function(text, x, y, color) {
        return new Kinetic.Text({
            text:       text,
            fontFamily: opt.fontFamily,
            fontSize:   opt.fontSize,
            fill:       color,
            x:          x,
            y:          y
        });
    };

    var processQueue = function(queue, summaryData) {
        var nextEntry = function(i) {
            if (i < queue.length) {
                $.ajax(queue[i].url)
                    .done(function(data) {
                        createChart(data, queue[i].target);
                        updateSummary(queue[i].name, data, summaryData);
                        nextEntry(i + 1);
                    })
                    .fail(function(xhr, stat, err) {
                        // TODO
                        alert("Failed to load data. Reload to try again.");
                    });
            } else {
                createChart(summaryData, $("#pc-tab-summary"));
            }
        };
        nextEntry(0);
    };

    var updateSummary = function(name, data, summaryData) {
        summaryData[name] = {};
        for (var d = 0; d < 7; d++) {
            var dayData = {};
            for (var h = 0; h < 24; h++) {
                dayData[h] = 0;
            }
            summaryData[name][d] = dayData;
        }
        for (user in data) {
            for (d in data[user]) {
                for (h in data[user][d]) {
                    summaryData[name][d][h] += data[user][d][h];
                }
            }
        }
    };

    var initialize = function(container, sources) {
        var queue = [];
        container.empty();
        var tabList = $("<ul/>");
        container.append(tabList);
        var tabID = "pc-tab-summary";
        var tab = addTab(loc.summaryTitle, tabID, tabList, container);
        for (var i = 0; i < sources.length; i++) {
            var tabName = sources[i].name;
            var tabID = "pc-tab-" + i;
            var tab = addTab(tabName, tabID, tabList, container);
            queue.push({
                name: tabName,
                url: sources[i].url,
                target: tab
            });
        }
        container.tabs();
        var summaryData = {};
        processQueue(queue, summaryData);
    };

    var addTab = function(tabName, tabID, tabList, container) {
        tabList.append($("<li/>")
            .append($("<a/>")
                .attr("href", "#" + tabID).text(tabName)));
        var tab = $("<div/>").attr("id", tabID).addClass("pc-tab")
            .text(loc.loadingText);
        container.append(tab);
        return tab;
    };

    return {
        options: opt,
        locale: loc,
        initialize: initialize
    };
})();
