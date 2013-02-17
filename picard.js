/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

var PiCard = (function() {
    var opt = {
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
        ]
    };

    var loc = {
        dayNames:           [ "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN" ],
        summaryTitle:       "Summary",
        summaryLabel:       "Commits:",
        loadingText:        "Loading …",
        loadingFailedText:  "Failed to load data. Reload to try again.",
        thousandsSeparator: ","
    };

    var createChart = function(data, target) {
        var users = sortUserNames(data);
        var userColors = getUserColors(users);
        var measure = getMeasurements();
        var layers = createLayers(data, userColors, measure);
        var legend = createLegend(users, data, userColors, layers);

        var containerID = target.attr("id") + "-container";
        var container = $("<div>").attr("id", containerID);
        target.empty();
        target
            .append(legend)
            .append(container);

        createStage(containerID, layers, measure);
    };

    var sortUserNames = function(data) {
        var users = [];
        $.each(data, function(user, perDay) {
            users.push(user);
        });
        users.sort();
        return users;
    };

    var createStage = function(containerID, layers, measure) {
        var stage = new Kinetic.Stage({
            container: containerID,
            width:     measure.width,
            height:    measure.height
        });
        stage.add(layers.plotArea);
        $.each(layers.plots, function(user, plot) {
            stage.add(plot);
        });
        stage.add(layers.axes);
        return stage;
    };

    var createLayers = function(data, userColors, measure) {
        var totals = calculateTotals(data);
        var plots = {};
        $.each(userColors, function(user, color) {
            plots[user] = new Kinetic.Layer();
            plots[user].setOpacity(opt.activeOpacity);
        });
        createPlots(plots, totals, data, userColors, measure); 
        var plotArea = createPlotArea(totals, measure);
        var axes = createAxes(measure);
        return {
            plotArea: plotArea,
            plots:    plots,
            axes:     axes
        };
    };

    var createLegend = function(users, data, userColors, layers) {
        var userTotals = {};
        var grandTotal = 0;
        $.each(data, function(user, perDay) {
            var total = 0;
            $.each(perDay, function(d, perHour) {
                $.each(perHour, function(h, amount) {
                    total += amount;
                });
            });
            userTotals[user] = total;
            grandTotal += total;
        });
        var legend = $("<div/>")
            .attr("class", "picard-legend")
            .append($("<span/>")
                .attr("class", "picard-legend-label")
                .text(loc.summaryLabel + " " + formatNumber(grandTotal)));
        $.each(users, function(i, user) {
            var strings = [ user, formatNumber(userTotals[user]) ];
            var code = opt.legendFormat.replace(
                /\{([0-9]+)\}/g,
                function(m0, m1) {
                    return strings[parseInt(m1, 10)];
                });
            legend.append(" ");
            legend.append($("<span>")
                .attr("class", "picard-legend-item")
                .css("color", userColors[user])
                .mouseover({ user: user, layers: layers }, setActive)
                .mouseout({ user: null, layers: layers }, setActive)
                .html(code));
        });
        return legend;
    };

    var setActive = function(event) {
        var user = event.data.user;
        var plots = event.data.layers.plots;
        var plotArea = event.data.layers.plotArea;
        $.each(plots, function(u, plot) {
            setOpacity(plot, (user === null || user == u)
                ? opt.activeOpacity : opt.inactiveOpacity);
        });
        setOpacity(plotArea, (user === null)
            ? opt.activeOpacity : opt.inactiveOpacity);
    };

    var setOpacity = function(layer, opacity) {
        if (layer.getOpacity() != opacity) {
            layer.setOpacity(opacity);
            layer.draw();
        }
    };

    var createPlotArea = function(totals, measure) {
        var plotArea = new Kinetic.Layer();
        var x0 = measure.yLabelWidth + opt.labelMargin + opt.axisWidth
            + opt.plotPadding + opt.maxPieRadius;
        var y = opt.plotPadding + opt.maxPieRadius;
        var s = opt.plotMarkerSize / 2;
        for (var d = 0; d < 7; d++) {
            var x = x0;
            for (var h = 0; h < 24; h++) {
                if (opt.drawAllPlotMarkers || !totals[d][h]) {
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
                }
                x += opt.maxPieRadius * 2;
            }
            y += opt.maxPieRadius * 2;
        }
        return plotArea;
    };

    var createPlots = function(plots, totals, data, userColors, measure) {
        var max = getMaximum(totals);
        var x0 = measure.yLabelWidth + opt.labelMargin + opt.axisWidth
            + opt.plotPadding + opt.maxPieRadius;
        var y = opt.plotPadding + opt.maxPieRadius;
        for (var d = 0; d < 7; d++) {
            var x = x0;
            for (var h = 0; h < 24; h++) {
                if (totals[d] && totals[d][h]) {
                    plotPie(d, h, data, totals, max, plots, x, y, userColors);
                }
                x += opt.maxPieRadius * 2;
            }
            y += opt.maxPieRadius * 2;
        }
    };

    var plotPie = function(d, h, data, totals, max, plots, x, y, userColors) {
        var total = totals[d][h];
        var ratio = getRatio(total, max);
        if (ratio <= 0) {
            return;
        }
        var radius = ratio * opt.maxPieRadius;
        var angle = (opt.startAngle === null)
            ? Math.random() * 360 : opt.startAngle;
        $.each(data, function(user, perDay) {
            if (perDay[d] && perDay[d][h]) {
                var degrees = 360 * (perDay[d][h] / total);
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
                plots[user].add(wedge);
                angle += degrees;
            }
        });
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
                $.each(data, function(user, perDay) {
                    if (perDay[d] && perDay[d][h]) {
                        dayTotals[h] += perDay[d][h];
                    }
                });
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
        if (queue.length) {
            var entry = queue.shift();
            $.ajax(entry.url)
                .done(function(data) {
                    createChart(data, entry.target);
                    updateSummary(entry.name, data, summaryData);
                })
                .fail(function(xhr, stat, err) {
                    entry.target.text(loc.loadingFailedText);
                })
                .always(function() {
                    processQueue(queue, summaryData);
                });
        } else {
            createChart(summaryData, $("#picard-tab-summary"));
        }
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
        $.each(data, function(user, perDay) {
            $.each(perDay, function(d, perHour) {
                $.each(perHour, function(h, amount) {
                    summaryData[name][d][h] += amount;
                });
            });
        });
    };

    var formatNumber = function(number) {
        number = "" + number;
        var re = /^([0-9]+)([0-9]{3})$/;
        var match = true;
        while (match) {
            match = false;
            number = number.replace(re, function(m0, m1, m2) {
                match = true;
                return m1 + loc.thousandsSeparator + m2;
            });
        }
        return number;
    };

    var initialize = function(container, sources) {
        var queue = [];
        container.empty();
        var tabList = $("<ul/>");
        container.append(tabList);
        var tabID = "picard-tab-summary";
        var tab = addTab(loc.summaryTitle, tabID, tabList, container);
        for (var i = 0; i < sources.length; i++) {
            var tabName = sources[i].name;
            var tabID = "picard-tab-" + i;
            var tab = addTab(tabName, tabID, tabList, container);
            queue.push({
                name:   tabName,
                url:    sources[i].url,
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
        var tab = $("<div/>").attr("id", tabID).addClass("picard-tab")
            .text(loc.loadingText);
        container.append(tab);
        return tab;
    };

    return {
        options:    opt,
        locale:     loc,
        initialize: initialize
    };
})();
