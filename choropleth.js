let choroWidth = 700;
let choroHeight = 400;
let svgChoro = null;
let geoJson = null;
let choroG = null;

function choropleth(dataHandler) {

    // GeoJSON was retrieved from here: https://wahlen.strategieanalysen.at/geojson/
    // D3 choropleth examples: https://www.d3-graph-gallery.com/choropleth

    d3.json("https://users.cg.tuwien.ac.at/~waldner/oesterreich.json").then(function (_geoJson) {
        geoJson = _geoJson;

        let projection = d3.geoMercator()
            .fitExtent([[0, 0], [choroWidth, choroHeight]], geoJson);

        let path = d3.geoPath()
            .projection(projection);

        svgChoro = d3.select("#svg_choropleth")
            .attr("width", choroWidth)
            .attr("height", choroHeight);

        choroG = svgChoro.append("g")
            .selectAll('path')
            .data(geoJson.features)
            .enter().append('path')
            .attr('id', (d) => (d.properties.iso))
            .attr('d', path)
            .attr("stroke", "black")
            .attr("fill", "white")
            .on("mouseover", d => (moueOverEvent(d.properties.iso))) // call mouseOverEvent for some state iso
            .on("mouseout", d => (moueOutEvent(d.properties.iso))); // call moueOutEvent for some state iso

        choroplethFill(dataHandler);
    });

    // function for mouse over event
    let moueOverEvent = function(stateIso) {
        dataHandler.setStateView(stateIso);  // set state view to to redraw pie chart
        svgChoro.select("#" + stateIso).style("stroke-width", 4); // highlight the selected path with stateIso id
        pie(dataHandler); // redraw the pie chart
    };
    // function for mouse out event
    let moueOutEvent = function(stateIso) {
        dataHandler.setDefaultView();  // set default view
        svgChoro.select("#" + stateIso).style("stroke-width", 1); // un-highlight selected state
        pie(dataHandler);  // redraw pie chart
    };

}

// function to refill the choropleth and set heading for choropleth
// makes map more smooth than redrawing the whole choropleth
function choroplethFill(dataHandler) {
    document.getElementById("party").innerHTML = dataHandler.getParty(true, "");
    choroG.attr("fill", d => dataHandler.getColor(d.properties.iso)); // set color by state iso
}
