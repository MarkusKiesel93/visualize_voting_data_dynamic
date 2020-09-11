let pieWidth = 400;
let pieHeight = 400;
let pieRadius = Math.min(pieWidth, pieHeight) / 2;
let pieChart = null;
let pieText = null;

function pie(dataHandler) {
    // set the name of the currently viewed state
    document.getElementById("state").innerHTML = dataHandler.getState();

    // select the svg with id svg_pie (where we draw the chart)
    let svg = d3.select("#svg_pie")
        .attr("width", pieWidth)  // set width
        .attr("height", pieHeight); // set height

    // function to create angles for the pie chart from the data
    let pieArcs = d3.pie()
        .sort(null)
        .value(d => d.value);

    // create arcs for chart
    let arcs = pieArcs(dataHandler.getData());

    console.log(arcs);

    // function to create a new arc with the arcs data
    let arc = d3.arc()
        .innerRadius(0) // to create pie (if set to higher number then donut chart is created)
        .outerRadius(pieRadius) // outer radius of the pie chart

    // function to place the labels
    let arcLabel = d3.arc()
        .innerRadius(pieRadius * 0.8)
        .outerRadius(pieRadius * 0.8);

    // append the selected svg
    // transform / translate data for chart
    pieChart = svg.append("g")
        .attr("transform", "translate(" + pieWidth / 2 + "," + pieHeight / 2 + ")");

    // select path and append created arcs to it
    pieChart.selectAll("path")
        .data(arcs)
        .enter().append("path")
            .attr('id', (d) => (d.data.name + '_arc')) // set id
            .attr("stroke", "white") // set stroke
            .attr("fill", d => (d.data.color)) // set fill color
            .attr("d", arc) // set arc (function by arcs data)
        .on("mouseover", d => (moueOverEvent(d.data.name))) // event for mouseover
        .on("mouseout", d => (moueOutEvent(d.data.name))); // event for mouseout

    // select the text in the pieChart and append the arcs data to it
    pieText = pieChart.selectAll("text")
        .data(arcs)
        .enter().append("text")
            .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
            .attr("font-family", "sans-serif")
            .attr("font-size", 16)
            .attr("text-anchor", "middle");

    // append tspan by arcs data for party name
    pieText.call(text => text.append("tspan")
        .attr('id', (d) => (d.data.name + '_txt_name'))
        .attr("x", "-0em")
        .attr("y", "-0.5em")
        .attr("font-weight", "bold")
        .text(d => dataHandler.getParty(false, d.data.name))
        .style('fill', 'white')
        .on("mouseover", d => (moueOverEvent(d.data.name))) // event for mouseover
        .on("mouseout", d => (moueOutEvent(d.data.name))) // event for mouseout
    );
    // append tspan by arcs data for party value
    pieText.call(text => text.append("tspan")
        .attr('id', (d) => (d.data.name + '_txt_value'))
        .attr("x", "0em")
        .attr("y", "0.5em")
        .text(d => (d.data.value.toLocaleString(
            undefined, // use browser default
            { minimumFractionDigits: 2 }))) // format to use 2 digits after comma
        .style('fill', 'white')
        .on("mouseover", d => (moueOverEvent(d.data.name))) // event for mouseover
        .on("mouseout", d => (moueOutEvent(d.data.name))) // event for mouseout
    );

    // function for mouse over event
    let moueOverEvent = function(party) {
        dataHandler.setPartyView(party); // set party view in dataHandler
        highlight(party); // highlight selected arc
        choroplethFill(dataHandler); // change choropleth colors
    };
    // function for mouse out event
    let moueOutEvent = function(party) {
        dataHandler.setDefaultView(); // set default views
        unHighlight(party); // un-highlight unselected arc
        choroplethFill(dataHandler); // change choropleth colors back
    };

    // function to highlight an arc and the associated party name and value
    let highlight = function(id) {
        pieChart.select("#" + id + "_arc").style("stroke-width", 4);
        pieText.select("#" + id + "_txt_name").style("fill", "black");
        pieText.select("#" + id + "_txt_value").style("fill", "black");
    }

    // function to un-highlight an arc and the associated party name and value
    let unHighlight = function(id) {
        pieChart.select("#" + id + "_arc").style("stroke-width", 0.1);
        pieText.select("#" + id + "_txt_name").style("fill", "white");
        pieText.select("#" + id + "_txt_value").style("fill", "white");
    }
}