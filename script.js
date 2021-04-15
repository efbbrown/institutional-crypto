/*------------------------------------------*/
/*            Variables                     */
/*------------------------------------------*/

var msg, message_received = false;

function g3_options(message) {

    // G3 options
    var options = {
        layouts: {
            bitcointreasuries: {
                parent: "#content-wrapper #bitcointreasuries",
                parent_section: "#content-wrapper #bitcointreasuries",
                function_chart: g3_breakout_chart,
                redraw: true,
                function_parse: parse_breakout,
                margin_ratios: {
                    "top": 0.1, "right": 0.1, "bottom": 0.1, "left": 0.1
                },
                data_raw: message,
                time_format: "%Y-%m-%d",
                time_col: "Latest_Purchase_Date",
                value_col: "Bitcoin",
                chart_title: "Institutional Bitcoin Investments"
            }
        }
    };

    return options;

}

/*------------------------------------------*/
/*            Chart Functions               */
/*------------------------------------------*/

function g3_ts_chart(c_o) {

    d3.selectAll(c_o.parent + " *").remove();

    if (c_o.data_parsed.labels.length === 0) {

        c_o.parentDiv = d3.select(c_o.parent);

        c_o.parentDiv.append("span")
            .attr("class", "blink-forever")
            .html("No data came through for this chart")
            .style("font-size", "26px")
            .style("margin", "80px auto");

    } else {

        function number_format(number, decimals, dec_point, thousands_sep) {
        // *     example: number_format(1234.56, 2, ',', ' ');
        // *     return: '1 234,56'
            number = (number + '').replace(',', '').replace(' ', '');
            var n = !isFinite(+number) ? 0 : +number,
                    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
                    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
                    s = '',
                    toFixedFix = function (n, prec) {
                        var k = Math.pow(10, prec);
                        return '' + Math.round(n * k) / k;
                    };
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
            }
            if ((s[1] || '').length < prec) {
                s[1] = s[1] || '';
                s[1] += new Array(prec - s[1].length + 1).join('0');
            }
            return s.join(dec);
        }

        var cvs = $(c_o.parent).append("<canvas id='" + c_o.parent + "-canvas'></canvas>");
        var ctx = document.getElementById(c_o.parent + "-canvas").getContext("2d");

        Chart.defaults.global.defaultFontColor = "white";
        new Chart(ctx, {
            type: 'line',
            data: c_o.data_parsed,
            options: {
                title: {
                    display: true,
                    text: 'Visits Over Time'
                },
                elements: {
                    line: {
                        tension: 0, // disables bezier curves
                    }
                },
                tooltips: {
                    callbacks: {
                        title: function(tooltipItem, data) {
                            return d3.utcFormat("%d-%m-%Y")(data['labels'][tooltipItem[0]['index']]);
                        },
                        label: function(tooltipItem, chart){
                            var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
                            return datasetLabel + ': ' + number_format(tooltipItem.yLabel, 0, ".", ",");
                        }
                    }
                },
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true
                        },
                        type: "time",
                        time: {
                            unit: "day",

                            displayFormats: {
                                'day': 'MMM DD'
                            }
                        },

                        position: "bottom"
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: function(value, index, values) {
                                return number_format(value, 0, ".", ",");
                            }
                        }
                    }]
                }
            }
        });



    }

}

function g3_breakout_chart(c_o) {

    d3.selectAll(c_o.parent + " *").remove();

    if (c_o.data_parsed.data.length === 0) {

        c_o.parentDiv = d3.select(c_o.parent);

        c_o.parentDiv.append("span")
            .attr("class", "blink-forever")
            .html("No data came through for this chart")
            .style("font-size", "26px")
            .style("margin", "80px auto");

    } else {

        /*------------------------------------------*/
        /*            Initiate the SVG              */
        /*------------------------------------------*/

        c_o.parentDiv = d3.select(c_o.parent);

        c_o.parentWidth = g3.elementWidth(c_o.parentDiv),
        c_o.parentHeight = g3.elementHeight(c_o.parentDiv);

        c_o.margin = {
            top: c_o.parentHeight * c_o.margin_ratios.top,
            right: c_o.parentWidth * c_o.margin_ratios.right,
            bottom: c_o.parentHeight * c_o.margin_ratios.bottom,
            left: c_o.parentWidth * c_o.margin_ratios.left
        };

        c_o.width = g3.chartLength({
            "parentLength": c_o.parentWidth,
            "marginOne": c_o.margin.left,
            "marginTwo": c_o.margin.right
        }),
        c_o.height = g3.chartLength({
            "parentLength": c_o.parentHeight,
            "marginOne": c_o.margin.top,
            "marginTwo": c_o.margin.bottom
        });

        c_o.chart = g3.appendChart({
            "parentDiv": c_o.parentDiv,
            "parentWidth": c_o.parentWidth,
            "parentHeight": c_o.parentHeight,
            "margin": c_o.margin
        });

        c_o.chart.attr("class", "g3-breakout");

        /*------------------------------------------*/
        /*            Scales                        */
        /*------------------------------------------*/

        c_o.x = d3.scaleTime().range([0, c_o.width]),
        c_o.y = d3.scaleLinear().range([c_o.height, 0]);

        c_o.x.domain(d3.extent(c_o.data_parsed.data, function(d) { return d[c_o.time_col]; }));
        c_o.y.domain([0, d3.max(c_o.data_parsed.data, function(d) { return d[c_o.value_col]; }) * 1.1]);

        /*------------------------------------------*/
        /*            Axes                          */
        /*------------------------------------------*/

        c_o.xAxis = c_o.chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + c_o.height + ")")
            .call(d3.axisBottom(c_o.x));

        c_o.yAxis = c_o.chart.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(c_o.y));

        c_o.borders = c_o.chart.append("g")
            .attr("class", "borders");

        c_o.borders.append("line")
            .attr("x1", 0)
            .attr("x2", c_o.width)
            .attr("y1", 0)
            .attr("y1", 0);

        c_o.borders.append("line")
            .attr("x1", c_o.width)
            .attr("x2", c_o.width)
            .attr("y1", 0)
            .attr("y1", c_o.height);

        /*------------------------------------------*/
        /*            Title                         */
        /*------------------------------------------*/

        if (typeof c_o.chart_title !== "undefined") {
            var titleGroup = c_o.chart.append("g")
                .attr("class", "title")
                .attr("transform", "translate(" + c_o.width/2 + ", " + -(1/3) * c_o.margin.top + ")");

            var titleText = titleGroup.append("text")
                .attr("class", "chart-title")
                .text(c_o.chart_title)
                .style("text-anchor", "middle");
        }

        /*------------------------------------------*/
        /*            Draw Group Elements           */
        /*------------------------------------------*/

        // Breakout vlines
        c_o.breakout_group = c_o.chart.append("g")
            .attr("class", "breakout-lines");
        c_o.breakout_group.selectAll("line")
            .data(c_o.data_parsed.breakout_locations)
            .enter().append("line")
            .attr("x1", function(d) { return c_o.x(c_o.data_parsed.data[d][c_o.time_col]); })
            .attr("x2", function(d) { return c_o.x(c_o.data_parsed.data[d][c_o.time_col]); })
            .attr("y1", 0)
            .attr("y2", c_o.height);

        // Points
        c_o.circle_group = c_o.chart.append("g")
            .attr("class", "circle-group");
        c_o.circle_group.selectAll("circle")
            .data(c_o.data_parsed.data).enter()
            .append("circle")
            .attr("cx", function(d) { return c_o.x(d[c_o.time_col]); })
            .attr("cy", function(d) { return c_o.y(d[c_o.value_col]); })
            .attr("r", 3);

        // Main path
        c_o.line_group = c_o.chart.append("g")
            .attr("class", "line-group");
        c_o.line = d3.line()
            .x(function(d) { return c_o.x(d[c_o.time_col]); })
            .y(function(d) { return c_o.y(d[c_o.value_col]); });
        c_o.line_group.append("path")
          .datum(c_o.data_parsed.data)
          .attr("fill", "none")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1.5)
          .attr("d", c_o.line);

        // Mean lines
        c_o.mean_group = c_o.chart.append("g")
            .attr("class", "mean-lines");
        c_o.mean_group.selectAll("line")
            .data(c_o.data_parsed.means)
            .enter().append("line")
            .attr("x1", function(d, i) {
                var start_index = i == 0 ? 0 : c_o.data_parsed.breakout_locations[i-1];
                return c_o.x(c_o.data_parsed.data[start_index][c_o.time_col]);
            })
            .attr("x2", function(d, i) {
                var end_index = i == c_o.data_parsed.breakout_locations.length ? c_o.data_parsed.data.length-1 : c_o.data_parsed.breakout_locations[i];
                return c_o.x(c_o.data_parsed.data[end_index][c_o.time_col]);
            })
            .attr("y1", function(d) { return c_o.y(d); })
            .attr("y2", function(d) { return c_o.y(d); });

        // Anomalies
        c_o.anomaly_group = c_o.chart.append("g")
            .attr("class", "anomaly-group");
        c_o.anomaly_group.append("g")
            .attr("class", "actual-group")
            .selectAll("circle")
            .data(c_o.data_parsed.anomalies).enter()
            .append("circle")
            .attr("cx", function(d) { return c_o.x(d[c_o.time_col]); })
            .attr("cy", function(d) { return c_o.y(d[c_o.value_col]); })
            .attr("r", 4);

        if (c_o.data_parsed.anomalies.length > 0) {
            if (c_o.data_parsed.anomalies[0].expected_value !== undefined) {
                c_o.anomaly_group.append("g")
                    .attr("class", "expected-group")
                    .selectAll("circle")
                    .data(c_o.data_parsed.anomalies).enter()
                    .append("circle")
                    .attr("cx", function(d) { return c_o.x(d[c_o.time_col]); })
                    .attr("cy", function(d) { return c_o.y(d["expected_value"]); })
                    .attr("r", 4);
                c_o.anomaly_group.append("g")
                    .attr("class", "v-lines")
                    .selectAll("line")
                    .data(c_o.data_parsed.anomalies).enter()
                    .append("line")
                    .attr("x1", function(d) { return c_o.x(d[c_o.time_col]); })
                    .attr("x2", function(d) { return c_o.x(d[c_o.time_col]); })
                    .attr("y1", function(d) { return c_o.y(d[c_o.value_col]); })
                    .attr("y2", function(d) { return c_o.y(d["expected_value"]); });
            }
        }

        // Text
        c_o.mean_group.selectAll("text")
            .data(c_o.data_parsed.means)
            .enter().append("text")
            .attr("x", function(d, i) {
                var end_index = i == c_o.data_parsed.breakout_locations.length ? c_o.data_parsed.data.length-1 : c_o.data_parsed.breakout_locations[i];
                return c_o.x(c_o.data_parsed.data[end_index][c_o.time_col]) - 10;
            })
            .attr("y", function(d) { return c_o.y(d) - 10; })
            .text(function(d) { return fmts["comma_round"](d); });
        c_o.breakout_group.selectAll("text")
            .data(c_o.data_parsed.breakout_locations)
            .enter().append("text")
            .attr("x", function(d) { return c_o.x(c_o.data_parsed.data[d][c_o.time_col]) - 10; })
            .attr("y", 20)
            .text(function(d) { return g3_format(c_o.data_parsed.data[d], c_o.time_col); });

    }

}

/*------------------------------------------*/
/*            Parse Functions               */
/*------------------------------------------*/

function parse_ts_chart(data_raw) {

    var result = {};
    var labels = [];
    var data = [];
    for (var i = 0; i < data_raw.data.length; i++) {
        var dates = Date.UTC(data_raw.data[i].year, (+data_raw.data[i].month) - 1, data_raw.data[i].day);
        var observations = data_raw.data[i].count;
        labels.push(dates);
        data.push(observations);
    }
    result = { "labels": labels, "datasets": [{ "backgroundColor": "rgba(75,192,192,0.4)", "borderColor": "rgba(75,192,192,1)", "label": "Observations", "data": data }] };
    return result;

}

function parse_breakout(c_o) {

    c_o.parseTime = d3.timeParse(c_o.time_format);

    c_o.data_parsed = Object.assign({}, c_o.data_raw);

    c_o.data_parsed.data = c_o.data_raw.data.map(function(d) {
        var new_d = {};
        new_d[c_o.time_col] = c_o.parseTime(d[c_o.time_col]);
        new_d[c_o.value_col] = d[c_o.value_col];
        return new_d;
    });

    c_o.data_parsed.anomalies = c_o.data_raw.anomalies.map(function(d) {
        var new_d = {};
        new_d[c_o.time_col] = c_o.parseTime(d[c_o.time_col]);
        new_d[c_o.value_col] = d["anoms"];
        new_d["expected_value"] = d["expected_value"];
        return new_d;
    });

    return c_o.data_parsed;
}

/*------------------------------------------*/
/*            Number Formats                */
/*------------------------------------------*/


var fmts = {
    "money_round": function(d) { return "$" + d3.format(",.0f")(d); },
    "money_decimal": function(d) { return "$" + d3.format(",.2f")(d); },
    "comma_round": d3.format(",.0f"),
    "comma_decimal": d3.format(",.2f"),
    "percent": d3.format(",.2%"),
    "readable_date": d3.timeFormat("%b %d, %Y")
};

var fmt_map = {
    "timestamp": "readable_date",
    "count": "comma_round"
};

function g3_format(d, variable) {
    return fmts[fmt_map[variable]](d[variable]);
}

function g3_format(d, variable) {
    return fmts[fmt_map[variable]](d[variable]);
}

/*------------------------------------------*/
/*            Meta Functions                */
/*------------------------------------------*/

function draw_chart(c_o) {



    // Only draw chart if that section is active (visible)
    if ($(c_o.parent_section).hasClass("active")) {

        if (Object.keys(c_o).indexOf("function_parse") !== -1) {
            c_o.data_parsed = c_o.function_parse(c_o);
            // c_o.data_parsed = c_o.data_raw.map(c_o.function_parse);
        } else {
            c_o.data_parsed = c_o.data_raw;
        }

        var res = c_o.function_chart(c_o);

        /*var res = c_o.function(c_o);
        return res;*/

    }

}

function draw_charts(g3_o) {

    for (var key in g3_o.layouts) {

        draw_chart(g3_o.layouts[key]);

    }

}

function redraw_charts(g3_o) {

    for (var key in g3_o.layouts) {

        if (g3_o.layouts[key].redraw === true) {

            draw_chart(g3_o.layouts[key]);

        }

    }

}

/*------------------------------------------*/
/*            On init or events             */
/*------------------------------------------*/

$(document).ready(function() {

    d3.csv("bitcointreasuries.csv").then(function (data) {
        console.log(data);
        msg = data;
        message_received = true;
        g3_o = g3_options(msg);
        console.log("Drawing charts")
        draw_charts(g3_o);
    });

    // $("#navlist > section").click(function() {

    //     $("#navlist section").removeClass("active");
    //     $("#content-wrapper section").removeClass("active");
    //     var this_class = $(this).attr("class");
    //     $(this).addClass("active");
    //     $("#content-wrapper section." + this_class).addClass("active");
    //     $("#content-options > div." + this_class).addClass("active");

    //     if (message_received) {
    //         draw_charts(g3_o);
    //     }

    // });

});

$(window).on("resize orientationchange", function() {

    // resize_main_elements();

    if (message_received) {
        redraw_charts(g3_o);
    }

});
