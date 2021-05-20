/*------------------------------------------*/
/*            Variables                     */
/*------------------------------------------*/

var msg, message_received = false;

function g3_options() {

    let charts = {
        transactions_btc: {
            parent: "#transactions-btc",
            function_chart: g3_breakout_chart,
            redraw: true,
            margin_ratios: {
                "top": 0.05, "right": 0.05, "bottom": 0.1, "left": 0.12
            },
            curve: d3.curveStep,
            data_name: "transactions_by_date",
            time_col: "latest_transaction_date",
            value_col: "est_amount_btc",
            currency_mark: "฿",
            chart_title: "฿ Purchased By Institutions",
        },
        transactions_usd: {
            parent: "#transactions-usd",
            function_chart: g3_breakout_chart,
            redraw: true,
            margin_ratios: {
                "top": 0.05, "right": 0.05, "bottom": 0.1, "left": 0.12
            },
            curve: d3.curveStep,
            data_name: "transactions_by_date",
            time_col: "latest_transaction_date",
            value_col: "est_cost_usd",
            currency_mark: "$",
            chart_title: "$USD Spent On ฿ By Institutions",
        },
        price_usd: {
            parent: "#price-usd",
            function_chart: g3_breakout_chart,
            redraw: true,
            margin_ratios: {
                "top": 0.05, "right": 0.05, "bottom": 0.1, "left": 0.12
            },
            curve: d3.curveNatural,
            data_name: "bitcoinprices",
            time_col: "Date_Parsed",
            value_col: "Open",
            currency_mark: "$",
            chart_title: "Price Of ฿",
        }
    };

    return {
        "charts": charts,
        "data_raw": {},
        "data_parsed": {},
        "value_cols": ["est_amount_btc", "est_cost_usd"],
        "date_start": new Date(2020, 5, 22),
        "date_end": new Date,
    };

}

/*------------------------------------------*/
/*            Chart Functions               */
/*------------------------------------------*/

function g3_breakout_chart(c_o) {

    d3.selectAll(c_o.parent + " *").remove();

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

    c_o.x.domain(
        d3.extent(g3_o.data_parsed[c_o.data_name], function(d) { return d[c_o.time_col]; })
    );
    c_o.y.domain(
        [0, d3.max(g3_o.data_parsed[c_o.data_name], function (d) { return d[c_o.value_col]; }) * 1.1]
    );
    // c_o.y.domain([0, 21000000]);

    /*------------------------------------------*/
    /*            Axes                          */
    /*------------------------------------------*/

    c_o.xAxis = c_o.chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + c_o.height + ")")
        .call(
            d3.axisBottom(c_o.x)
                .ticks(5)
                .tickSizeOuter(0)
                .tickSizeInner(-c_o.height)
        );

    c_o.yAxis = c_o.chart.append("g")
        .attr("class", "y axis")
        .call(
            d3.axisLeft(c_o.y)
                .ticks(5)
                .tickFormat(d => `${c_o.currency_mark}${fmts['comma_round'](d)}`)
                .tickSizeOuter(0)
                .tickSizeInner(-c_o.width)
        );

    c_o.borders = c_o.chart.append("g")
        .attr("class", "borders");

    /*------------------------------------------*/
    /*            Title                         */
    /*------------------------------------------*/

    if (typeof c_o.chart_title !== "undefined") {
        var titleGroup = c_o.chart.append("g")
            .attr("class", "title")
            .attr("transform", "translate(20,20)");
            // .attr("transform", "translate(" + c_o.width/2 + ", " + -(1/3) * c_o.margin.top + ")");

        var titleText = titleGroup.append("text")
            .attr("class", "chart-title")
            .text(c_o.chart_title)
            .style("text-anchor", "start");
    }

    /*------------------------------------------*/
    /*            Draw Group Elements           */
    /*------------------------------------------*/

    // Main path
    c_o.line_group = c_o.chart.append("g")
        .attr("class", "line-group");
    c_o.line = d3.line()
        .curve(c_o.curve)
        .x(function(d) { return c_o.x(d[c_o.time_col]); })
        .y(function(d) { return c_o.y(d[c_o.value_col]); });
    c_o.line_group.append("path")
        .datum(g3_o.data_parsed[c_o.data_name])
        .attr("fill", "none")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", c_o.line);

    // Main path
    /* c_o.line_group_supply = c_o.chart.append("g")
        .attr("class", "line-group");
    c_o.line_supply = d3.line()
        .x(function (d) { return c_o.x(d["date"]); })
        .y(function (d) { return c_o.y(d["supply"]); });
    c_o.line_group_supply.append("path")
        .datum(c_o.data_parsed.supply)
        .attr("fill", "none")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", c_o.line_supply); */

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

function create_bitcoinsupply() {

    const bitcoinsupply = [
        { "date": new Date(2009, 1, 2), "supply": 0 },
        { "date": new Date(2012, 11, 28), "supply": 10500000 },
        { "date": new Date(2016, 07, 9), "supply": 15750000 },
        { "date": new Date(2020, 05, 11), "supply": 18375000 }
    ]

    return bitcoinsupply

}

function parse_bitcoinprices(g3_o) {

    const parseTime = d3.timeParse("%Y-%m-%d");

    g3_o.data_parsed["bitcoinprices"] = g3_o.data_raw["bitcoinprices"].map(d => {
        let res = {};
        res["Date_Parsed"] = parseTime(d["Date"]);
        res["Open"] = +d["24h Open (USD)"];
        return res
    });

}

function parse_bitcoinpurchases(g3_o) {

    const parseTime = d3.timeParse("%Y-%m-%d");

    const data_parsey = g3_o.data_raw["bitcointransactions"]
        .filter(d => { return d["transaction_type"] !== "Mining" })
        .filter(d => { return d["confident_amount_btc"] === "TRUE" })
        .filter(d => { return d["confident_cost_usd"] === "TRUE" })
        .sort((a, b) => d3.ascending(a["latest_transaction_date"], b["latest_transaction_date"]));

    g3_o.date_range = d3.timeDays(g3_o.date_start, g3_o.date_end);

    let data_datey = g3_o.date_range.map(d1 => {
        let res = {};
        const pre_date_purchases = data_parsey.filter(d2 => {
            return new Date(d2["latest_transaction_date"]) <= d1
        });
        g3_o.value_cols.map(value_col => {
            const value = pre_date_purchases.length > 0 ? d3.sum(pre_date_purchases, d => d[value_col]) : 0
            res[value_col] = value
        });
        res["latest_transaction_date"] = d1;
        return res
    });

    data_datey.columns = Object.keys(data_datey[0])

    const data_pivoted = pivot(
        data_datey,  // data
        g3_o.value_cols,  // cols
        ["metric"],  // values
        ["total"]);  // opts
    
    g3_o.data_parsed["transactions_by_date"] = data_datey;
    g3_o.data_parsed["by_date_pivoted"] = data_pivoted;

    /* return {
        // "supply": create_bitcoinsupply(),
        "data": data_datey,
        "data_pivoted": data_pivoted
    };*/
}

function pivot(data, cols, names, values, opts) {
    const columns = Array.isArray(cols) ? cols : data.columns.filter(cols);

    values[1] = values[1] || (d => d);

    const keepCols = data.columns.filter(c => !columns.includes(c));
    const long = [];
    columns.forEach(col => {
        data.forEach(d => {
            const row = {};
            keepCols.forEach(c => {
                row[c] = d[c];
            });
            // TODO, add an option to ignore if fails a truth test to approximate `values_drop_na`
            names.forEach(n => {
                const nClean = Array.isArray(n) ? n.length === 1 ? [...n, q => q] : n : [n, q => q];
                row[nClean[0]] = nClean[1](col);
                row[values[0]] = values[1](d[col]);
                long.push(row);
            });
        });
    });
    return long;
}

/*------------------------------------------*/
/*            Number Formats                */
/*------------------------------------------*/


var fmts = {
    "dollar_round": function(d) { return "$" + d3.format(",.0f")(d); },
    "dollar_decimal": function(d) { return "$" + d3.format(",.2f")(d); },
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

/*------------------------------------------*/
/*            Meta Functions                */
/*------------------------------------------*/

function draw_chart(c_o) {

    console.log("Drawing chart with options:");
    console.log(c_o);

    if (Object.keys(c_o).indexOf("function_parse") !== -1) {
        c_o.data_parsed = c_o.function_parse(c_o);
        // c_o.data_parsed = c_o.data_raw.map(c_o.function_parse);
    } else {
        c_o.data_parsed = c_o.data_raw;
    }

    var res = c_o.function_chart(c_o);

}

function draw_charts(g3_o) {

    for (var key in g3_o.charts) {

        draw_chart(g3_o.charts[key]);

    }

}

function redraw_charts(g3_o) {

    for (var key in g3_o.charts) {

        if (g3_o.charts[key].redraw === true) {

            draw_chart(g3_o.charts[key]);

        }

    }

}

function parse_data_raw(g3_o) {

    parse_bitcoinpurchases(g3_o);
    parse_bitcoinprices(g3_o);

}

/*------------------------------------------*/
/*            On init or events             */
/*------------------------------------------*/

$(document).ready(function() {

    g3_o = g3_options();

    Promise.all([
        d3.csv("bitcointransactions.csv"),
        d3.csv("bitcoinprices.csv")
    ]).then(function (files) {
        g3_o.data_raw["bitcointransactions"] = files[0];
        g3_o.data_raw["bitcoinprices"] = files[1];
        console.log("Drawing charts");
        parse_data_raw(g3_o);
        draw_charts(g3_o);
    });

    /* d3.csv("bitcointransactions.csv").then(function (data) {
        g3_o.data_raw["bitcointransactions"] = data;
        console.log(data);
        console.log("Drawing charts");
        parse_data_raw(g3_o);
        draw_charts(g3_o);
    }); */

});

$(window).on("resize orientationchange", function() {

    // resize_main_elements();

    redraw_charts(g3_o);

});
