const dataFile = "NRW2019_Bundeslaender.csv";
const scaleMin = 0.35; // value to scale color opacity for minimum result for the stateView
let loadDataRaw = d3.csv(dataFile, (data) => (data)); // async call to load data file

// when data is loaded
loadDataRaw.then(function(data) {
    let dataAll = formatDataAll(data); // manipulate data to get desired format
    let dataHandler = new DataHandler(dataAll); // create data Handler
    choropleth(dataHandler); // draw choropleth
    pie(dataHandler); // draw pieChart
});


// takes all data and formats in desired output
// { results: {AT-1: {OVP: ...}, ...}, votes: {AT-1: ...}, votesAll: ...}
let formatDataAll = function(data) {
    // object to save data to
    let dataObj = {results: {}, votes: {}, votesAll: 0.0};
    // iterate raw data
    for (let row in data) {
        // ignore columns row
        if (row !== "columns") {
            let iso = stateIsoMap[data[row]["Bundesland"]];  // get iso value for Bundesland
            dataObj.votesAll += +data[row]["votes"];  // sum of all votes
            // assing votes to dataObj
            let votes = {[iso]: +data[row]["votes"]};
            Object.assign(dataObj.votes, votes);
            // format results to be stored as number per party
            // save key (party) from partyIdMap to prevent problems with non-ASCII symbols
            let result = {
                [iso]: {
                    [partyIdMap["ÖVP"]]: +data[row]['ÖVP'],
                    [partyIdMap["SPÖ"]]: +data[row]['SPÖ'],
                    [partyIdMap["FPÖ"]]: +data[row]['FPÖ'],
                    [partyIdMap["NEOS"]]: +data[row]['NEOS'],
                    [partyIdMap["JETZT"]]: +data[row]['JETZT'],
                    [partyIdMap["GRÜNE"]]: +data[row]['GRÜNE'],
                    [partyIdMap["SONST."]]: +data[row]['SONST.']
                }
            };
            // assign to dataObj
            Object.assign(dataObj.results, result);
        }
    }
    return dataObj;
}

// class for handling all data and colors
class DataHandler {
    constructor(data) {
        this.stateView = "all"; // state (iso) that is selected or all
        this.partyView = "all"; // party that is selected or all
        this.data = data; // all data formatted
        this.mapDefaultColors = this.createMapDefaultColors(); // default colors for the choropleth
        this.mapPartyColors = this.createMapPartyColors(); // colors for the choropleth by party
        this.pieDefaultData = this.createPieDefaultData(); // default data for the pie chart
        this.pieStateData = this.createPieStateData(); // data for the pie chart per state
    };
    // set default view for pie chart and choropleth
    setDefaultView() {
        this.stateView = "all";
        this.partyView = "all";
    };
    // set view for state (in iso)
    setStateView(state) {
        this.stateView = state;
    };
    // set view for party
    setPartyView(party) {
        this.partyView = party;
    };
    // get the name of the state for the current stateView
    getState() {
        if (this.stateView === "all") {
            return "Österreich";
        } else {
            let state = "";
            for (let key in stateIsoMap) {
                if (stateIsoMap[key] === this.stateView) {
                    state = key;
                }
            }
            return state;
        }
    };
    // get the name of the party for the current partyView
    // or for the text in the pie chart (mas de partyID back to it's actual name)
    getParty(forView, partyKey) {
        if (forView) {
            if (this.partyView === "all") {
                return "Meistgewählte Partei";
            } else {
                partyKey = this.partyView;
            }
        }
        let party = "";
        for (let key in partyIdMap) {
            if (partyIdMap[key] === partyKey) {
                party = key;
            }
        }
        return party;
    };
    // get the color for a state (by iso) depending on the selected partyView
    getColor(iso) {
        if (this.partyView === "all") {
            return this.mapDefaultColors[iso];
        } else {
            return this.mapPartyColors[this.partyView][iso];
        }
    };
    // get the data for the pie chart depending on the stateView
    getData() {
        if (this.stateView === "all") {
            return this.pieDefaultData;
        } else {
            return this.pieStateData[this.stateView];
        }
    };
    // create the default colors for the choropleth
    // finds the winning party by state
    // returns a map with {AT-1: color, AT-2: color, ...}
    // the color by iso ist the color of the winning party in this state
    createMapDefaultColors() {
        let mapColors = {};
        for (let iso in this.data.results) {
            let winningParty = "";
            let max = 0.0;
            for (let party in this.data.results[iso]) {
                if(this.data.results[iso][party] > max) {
                    max = this.data.results[iso][party];
                    winningParty = party;
                }
            }
            Object.assign(mapColors, {[iso]: [partyColors[winningParty]]});
        }
        return mapColors;
    };
    // creates the colors for the choropleth by party
    // finds for each party the maximum and minimum value to
    // create a d3.scaleLinear() object for each party
    // then it maps the stats to a color of different opacity
    // function returns data in form {party1: {AT-1: colorHue, ...}, party2: {...}, ...}
    createMapPartyColors() {
        let mapColors = {};
        for (let party in partyColors) {
            let mapColorsParty = {};
            // find minimum and maximum per party
            let min = 100.0;
            let max = 0.0;
            for (let iso in this.data.results) {
                if (this.data.results[iso][party] < min) {
                    min = this.data.results[iso][party];
                }
                if (this.data.results[iso][party] > max) {
                    max = this.data.results[iso][party];
                }
            }
            // create d3.scale object
            // map min, max to scale of range 0.3 to 1 opacity
            let scale = d3.scaleLinear().domain([min, max]).range([scaleMin, 1]);
            for (let iso in this.data.results) {
                // create HSL color from partyColor
                let color = d3.hsl(partyColors[party]);
                // change opacity
                color.opacity = scale(this.data.results[iso][party]);
                // assign to result per party
                Object.assign(mapColorsParty, {[iso]: [color]});
            }
            // assign results of one party to the whole object
            Object.assign(mapColors, {[party]: mapColorsParty});
        }
        return mapColors;
    }
    // creates the default data for the pie chart in desired output for d3
    // data is returned as [{name: partyName, value: ..., color: ...}, ...]
    createPieDefaultData() {
        let data = [];
        let resultPerState = {"OVP": 0.0, "SPO": 0.0, "FPO": 0.0, "NEOS": 0.0, "JETZT": 0.0, "GRUNE": 0.0, "SONST": 0.0};
        for (let iso in this.data.results) {
            for (let party in this.data.results[iso]) {
                // multiply each result by the number of votes by state
                resultPerState[party] += this.data.results[iso][party] * this.data.votes[iso];
            }
        }
        for (let key in resultPerState){
            // divide each result by the overall votes and round the results
            data.push({name: key, value: Math.round(100 * (resultPerState[key] /= this.data.votesAll)) / 100, color: partyColors[key]});
        }
        return data;
    };
    // creates the data for the pie chart by state in desired output for d3
    // data is returned as {iso: [{name: partyName, value: ..., color: ...}, ...], iso: ...}
    createPieStateData() {
        let data = {};
        for (let iso in this.data.results) {
            let dataByState = [];
            for (let party in this.data.results[iso]){
                dataByState.push({name: party, value: this.data.results[iso][party], color: partyColors[party]});
            }
            Object.assign(data, {[iso]: dataByState});
        }
        return data;
    };
}

// colors in HEX for each party (changed party IDs)
let partyColors = {
    "OVP":"#63C3D0",
    "SPO":"#ce000c",
    "FPO":"#0056A2",
    "NEOS":"#E3257B",
    "JETZT":"#ADADAD",
    "GRUNE":"#88B626",
    "SONST":"#222"
};

// object to map state names to iso codes to not use non-ASCII characters in keys
// and to make working with the geoJson in the choropleth easier
const stateIsoMap = {
    "Burgenland": "AT-1",
    "Kärnten": "AT-2",
    "Niederösterreich": "AT-3",
    "Oberösterreich": "AT-4",
    "Salzburg": "AT-5",
    "Steiermark": "AT-6",
    "Tirol": "AT-7",
    "Vorarlberg": "AT-8",
    "Wien": "AT-9"
};

// object to map party names to to not use non-ASCII characters in keys
const partyIdMap = {
    "ÖVP":"OVP",
    "SPÖ":"SPO",
    "FPÖ":"FPO",
    "NEOS":"NEOS",
    "JETZT":"JETZT",
    "GRÜNE":"GRUNE",
    "SONST.":"SONST"
};