/**
 * Created by Shawn Rushefsky on 5/22/17.
 */

// Establish some colors to choose from. I've chosen light and bold versions of the same hue to facilitate
// easy visual emphasis
var dataColorsBold =[[31, 119, 180],
                [255, 127, 14],
                [44, 160, 44],
                [214, 39, 40],
                [148, 103, 189],
                [140, 86, 75],
                [227, 119, 194],
                [127, 127, 127],
                [188, 189, 34],
                [23,190, 207],
                [255, 255, 255],
                [32, 32, 32]];
var dataColorsLight = [
                [174, 199, 232],
                [255, 187, 120],
                [152, 223, 138],
                [255, 152, 150],
                [197, 176, 213],
                [196, 156, 148],
                [247, 182, 210],
                [199, 199, 199],
                [219, 219, 141],
                [158, 218, 229],
                [255, 255, 255],
                [32, 32, 32]];

var defaultMapLabel = "Earth";
var defaultBarChartTitle = "Select a Country";

var pathRef = {}; // This will hold a reference by name to the svg path for each country


var filters = {}; // Filter names as keys, boolean as values. eg. {"1995": False}

// Declaring, but not initializing, some global variables
var predict;
var wm;
var search;
var genderBox;
var yearBox;
var flowBox;

// hold the checkboxes and labels, associated with their name. eg: {1995: {check: <checkbox>, label: <label>}}
var genderChecks = {};
var yearChecks = {};
var radioButtons = {};
var flowDirection;

// A function to convert an rgb array [r, g, b] into the html format "rgb(r,g,b)"
function rgbToHTML(rgb){
    return "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
}

// The merge function to be used by mergeSort
function merge(array, p, q, r, valueFunction){
    var lowHalf = array.slice(p, q+1);
    var highHalf = array.slice(q+1, r+1);
    var k = p;
    var i = 0;
    var j = 0;
    while(i < lowHalf.length && j < highHalf.length){
        if(valueFunction(lowHalf[i]) < valueFunction(highHalf[j])){
            array[k] = lowHalf[i];
            i++;
        }
        else{
            array[k] = highHalf[j];
            j++;
        }
        k++;
    }
    while(i < lowHalf.length){
        array[k] = lowHalf[i];
        k++;
        i++;
    }
    while(j < highHalf.length){
        array[k] = highHalf[j];
        k++;
        j++;
    }
}

// Implementing mergeSort from scratch, just for fun
function mergeSort(array, valueFunction, p, r){
    if(typeof p === "undefined"){
        p = 0;
    }
    if(typeof r === "undefined"){
        r = array.length;
    }
    if(typeof valueFunction === "undefined"){
        valueFunction = function(x){return x;};
    }
    if(p < r){
        var q = Math.floor((p+r)/2);
        mergeSort(array, valueFunction, p, q);
        mergeSort(array, valueFunction, q+1, r);
        merge(array, p, q, r, valueFunction);
    }
}

// Calculate a color on a gradient, based on a float 'ratio' between 0 and 1.
function gradientCalc(color1, color2, ratio){
    var r = Math.round(color1[0]+ratio*(color2[0]-color1[0]));
    var g = Math.round(color1[1]+ratio*(color2[1]-color1[1]));
    var b = Math.round(color1[2]+ratio*(color2[2]-color1[2]));
    return [r, g, b]
}

// Helper function for setting up input checkboxes.
function makeLabeledCheckBox(d3Selection, label){
    filters[label] = true;
    var chk = d3Selection.append("input")
        .attr("type", "checkbox")
        .attr("id", label)
        .attr("class", "checkbox")
        .attr("checked", true)
        .on('click', function(){
            filters[label] = this.checked;
            if(wm.selected !== null){
                var selection = d3.select(pathRef[wm.selected][0]);
                selection.on('click')(selection.data()[0]);
            }
        });
    var chkLabel = d3Selection.append("label").attr("for", label).text(label);
    return {check: chk, label: chkLabel};
}

// Helper function for setting up radio inputs
function makeRadioButton(d3Selection, name, value){
    var radio = d3Selection.append("input")
        .attr("type", "radio")
        .attr("id", name+":"+value)
        .attr("name", name)
        .attr("value", value)
        .attr("class", "checkbox")
        .on("change", function(){
            flowDirection = this.value;
            if(wm.selected !== null){
                var selection = d3.select(pathRef[wm.selected][0]);
                selection.on('click')(selection.data()[0]);
            }
        });
    var radioLabel = d3Selection.append("label")
        .attr("for", name+":"+value)
        .text(value);
    return {radio: radio, label: radioLabel};
}

// A function to calculate log[b]n.
function log(b, n) {
    return Math.log(n) / Math.log(b);
}


// A class to perform text auto-completion by use of a trie. Accepts an array of objects. Objects must have a 'key'
// field. Trie will be indexed by key.
function AutoComplete(source){
    var me = this;
    this.children = {};

    function TrieNode(letter){
        var me = this;
        this.letter = letter;
        this.children = {};
        this.end = false;
        this.data = null;

        this.addChild = function(char){
            if(!me.children.hasOwnProperty(char)){
                me.children[char] = new TrieNode(char);
            }
        };

        this.printChildren = function(){
            for(var k in me.children){
                if(!me.children.hasOwnProperty(k)){continue;}
                console.log(me.children[k].letter);
                me.children[k].printChildren();
            }
        };

        // Return the lexicographically first child node.
        this.minChild = function(){
            var min = null;
            for(var k in me.children){
                if(!me.children.hasOwnProperty(k)){continue;}
                if(min === null || me.children[k].letter < min){
                    min = me.children[k].letter;
                }
            }
            return me.children[min];
        };

        // Return an array with the data object from every child node.
        this.allChildren = function(){
            var all = [];
            for(var k in me.children){
                if(!me.children.hasOwnProperty(k)){continue;}
                if(me.children[k].end){
                    all.push(me.children[k].data);
                }
                all = all.concat(me.children[k].allChildren());
            }
            return all;
        }
    }


    this.addData = function(data){
        var ch = data.key.charAt(0).toUpperCase();
        if(!me.children.hasOwnProperty(ch)){
            me.children[ch] = new TrieNode(ch);
        }
        var activeNode = me.children[ch];
        for(var i = 1; i < data.key.length; i++){
            ch = data.key.charAt(i).toUpperCase();
            activeNode.addChild(ch);
            activeNode = activeNode.children[ch];
        }
        activeNode.end = true;
        activeNode.data = data;
    };

    this.printAll = function(){
        for(var k in me.children){
            if(!me.children.hasOwnProperty(k)){continue;}
            console.log(me.children[k].letter);
            me.children[k].printChildren();
        }
    };

    // Taking a substring 'fragment', guess the lexicographically first word, and return the attached data object.
    // return null if not found.
    this.guess = function(fragment){
        fragment = fragment.toUpperCase();
        var ch = fragment.charAt(0);
        if(!me.children.hasOwnProperty(ch)){
            return null;
        }
        var activeNode = me.children[ch];
        for(var i = 1; i < fragment.length; i++){
            ch = fragment.charAt(i);
            if(!activeNode.children.hasOwnProperty(ch)){
                return null;
            }
            activeNode = activeNode.children[ch];
        }
        while(Object.keys(activeNode.children).length > 0 && !activeNode.end){
            activeNode = activeNode.minChild();
        }
        return activeNode.data;
    };

    // Take a string fragment, and return an array of data objects who's key begins with the fragment.
    this.multiGuess = function(fragment){
        fragment = fragment.toUpperCase();
        var ch = fragment.charAt(0);
        if(!me.children.hasOwnProperty(ch)){
            return [];
        }
        var activeNode = me.children[ch];
        for(var i = 1; i < fragment.length; i++){
            ch = fragment.charAt(i);
            if(!activeNode.children.hasOwnProperty(ch)){
                return [];
            }
            activeNode = activeNode.children[ch];
        }
        var allData = [];
        if(activeNode.end){
            allData.push(activeNode.data);
        }
        allData = allData.concat(activeNode.allChildren());
        return allData;
    };

    if(typeof source !== "undefined"){
        for(var i = 0; i < source.length; i++){
            this.addData(source[i].key);
        }
    }

}

// A class to present Vertical Bar Charts
function BarChart(data, options){
    var barThickness = options.barThickness || 20;
    var barSpace = options.barSpace || 5;
    var me = this;
    var w = options.width || 100;
    var h = options.height || 400;
    var x = options.x || 0;
    var y = options.y || 0;
    var boxDims = {
        x: x,
        y: y,
        width: w,
        height: h
    };
    var titleHeight = options.titleHeight || 24;
    var barColor = options.barColor || 0;
    this.orientation = options.orientation || "vertical";
    var bars = [];
    var text = [];
    var buffer = titleHeight*1.5;
    var myTitle = defaultBarChartTitle;
    var myData = null;
    var svgTitle;
    var barPos = function(d, i){
        bars.push(this);
        return buffer + (i * (barThickness+barSpace));
    };
    var textPos = function(d, i){
        text.push(this);
        var mBuffer = me.orientation === "vertical" ? buffer : titleHeight;
        return mBuffer + (barThickness*.9)+(i * (barThickness+barSpace));
    };
    var dataFunc = function(d){
        return d.value*dataScale;
    };
    var barDims = {
        vertical: {
            x: 0,
            y: barPos,
            height: barThickness,
            width: dataFunc,
            scaleDim: "height"
        },
        horizontal: {
            x: barPos,
            y: 0,
            width: barThickness,
            height: dataFunc,
            scaleDim: "width"
        }
    };
    var textDims = {
        vertical: {
            x: 0,
            y: textPos,
            rot: 0
        },
        horizontal: {
            x: textPos,
            y: 0,
            rot: 90
        }
    };
    var other = {
        height: "width",
        width: "height",
        x: "y",
        y: "x"
    };
    var dataScale = boxDims[other[barDims[me.orientation].scaleDim]] / Math.max.apply(null, data);
    // var div = d3.select("body")
        // .append("div")
        // .attr("class", "container")
        // .style("left", x+'px')
        // .style("top", y+'px')
        // .style("width", w+'px')
        // .style("height", h+'px');
    var svg = d3.select("body")
        .append("svg")
        .attr(barDims[me.orientation].scaleDim, data.length*(barThickness+barSpace)+buffer)
        .attr(other[barDims[me.orientation].scaleDim], boxDims[other[barDims[me.orientation].scaleDim]])
        .attr("viewBox", "0 0 "+w+" "+titleHeight*1.5);

    this.title = function(title){
        myTitle = title;
        svgTitle = svg.append("text")
            .text(title)
            .attr("y", titleHeight)
            .attr("font-size", titleHeight+'px')
            .attr("font-family", "sans-serif")
            .attr("fill", "black")
            .attr("x", w/2)
            .style("text-anchor", "middle");
            // .style("alignment-baseline", "middle")
    };

    this.title(defaultBarChartTitle);


    this.display = function(title, dataSet, color){
        barColor = color;
        myTitle = title;
        me.clear();
        myData = dataSet;
        d3.select('body').property("scrollTop", 0);

        bars.length = 0;
        text.length = 0;
        var maxVal = 1;
        if(dataSet.length > 0){
            mergeSort(dataSet, function(d){return -d.value;});
            maxVal = dataSet[0].value;
        }
        dataScale = boxDims[other[barDims[me.orientation].scaleDim]] / maxVal;
        var clicker = function(d){
            var path = d3.select(pathRef[d.label][0]);
            path.on("click")(path.data()[0]);
        };


        var mouseOver = function(bar){
            d3.select(bar).style("fill", rgbToHTML(dataColorsBold[barColor]));
        };
        var mouseOut = function(bar){
            d3.select(bar).style("fill", rgbToHTML(dataColorsLight[barColor]));
        };

        svg.attr(barDims[me.orientation].scaleDim, dataSet.length*(barThickness+barSpace)+buffer)
            .selectAll("rect")
            .data(dataSet)
            .enter()
            .append("rect")
                .attr("x", barDims[me.orientation].x)
                .attr("y", barDims[me.orientation].y)
                .style("height", barDims[me.orientation].height)
                .style("width", barDims[me.orientation].width)
                .style("fill", rgbToHTML(dataColorsLight[barColor]))
                .style("cursor", "pointer")
                .on("mouseover", function(d, i){
                    mouseOver(bars[i], text[i]);
                })
                .on("mouseout", function(d, i){
                    mouseOut(bars[i], text[i]);
                })
                .on("click", clicker);
        svg.selectAll("text")
            .data(dataSet)
            .enter()
            .append("text")

                .attr("x", textDims[me.orientation].x)
                .attr("y", textDims[me.orientation].y)
                .style("text-anchor", "start")
                .attr("transform", function(){
                    var mx = d3.select(this).attr("x");
                    var my = d3.select(this).attr("y");
                    return "rotate("+textDims[me.orientation].rot+", "+mx+", "+my+")";
                })
                .attr("fill", "black")
                .text(function(d){return d.label+"("+d.value.toLocaleString()+")";})
                .attr("font-size", (barThickness*.9)+'px')
                .attr("font-family", "sans-serif")
                .style("cursor", "pointer")
                .on("click", clicker)
                .on("mouseover", function(d, i){
                    mouseOver(bars[i]);
                })
                .on("mouseout", function(d, i){
                    mouseOut(bars[i]);
                });
        me.title(title);
        svg.attr("viewBox", "0 0 "+svg.attr("width")+" "+svg.attr("height"));
    };
    this.size = function(width){
        w = width;
        boxDims.width = w;
        svg.attr("width", w);
        if(myData !== null){
            me.display(myTitle, myData, barColor);
        }
        else{
            // svgTitle.attr("x", w/2);
        }
    };

    this.clear = function(){
        svg.selectAll("*").remove();
        myData = null;
        svg.attr("height", titleHeight*1.5);
        var oldBox = svg.attr("viewBox");
        if(oldBox !== null){
            var split = oldBox.split(" ");
            split[3] = titleHeight*1.5;
            var newBox = split.join(" ");
            svg.attr("viewBox", newBox);
        }
    }

}

// A class to handle the world map
function WorldMap(barChart){
    var me = this;
    this.width = null;
    this.height = null;
    this.selected = null;
    this.barChart = barChart;
    var txt;
    var logBase = 2;

    // Add a blank svg for the map
    var svg = d3.select("body")
            .style("margin", 0)
        .append("svg")
            .attr("class", "allSVG");

    var dataFile;
    this.size = function(w){
        me.width = w;
        me.height = w/2;
        svg.attr("width", me.width).attr("height", me.height);
    };
    this.size(window.innerWidth);
    svg.attr("viewBox", "0 0 "+me.width+" "+me.height);
    this.displayMap = function(){

        // Make an ok guess at centering the map
        var center = d3.geoCentroid(dataFile);
        var scale  = 1;
        var offset = [me.width/2, me.height/2];
        var projection = d3.geoEquirectangular().scale(scale).center(center)
            .translate(offset);

        // create the path
        var path = d3.geoPath().projection(projection);

        // using the path determine the bounds of the current map and use
        // these to determine better values for the scale and translation
        var bounds  = path.bounds(dataFile);
        var hscale  = scale*me.width  / (bounds[1][0] - bounds[0][0]);
        var vscale  = scale*me.height / (bounds[1][1] - bounds[0][1]);
        scale = (hscale < vscale) ? hscale : vscale;
        offset  = [me.width - (bounds[0][0] + bounds[1][0])/2.2,
                        me.height - (bounds[0][1] + bounds[1][1])/1.5];

        // new projection
        projection = d3.geoEquirectangular().center(center)
            .scale(scale)
            .translate(offset);
        path = path.projection(projection);

        // Create the oceans
        svg.append("rect").attr("width", me.width).attr("height", me.height).attr("fill", "#C2DFFF")
            .on("click", function(){
                // Unselect everything and restore default appearance
                for(var n in pathRef){
                    if(!pathRef.hasOwnProperty(n)){continue;}
                    for(var i = 0; i < pathRef[n].length; i++){
                        var pth = d3.select(pathRef[n][i]);
                        pth.data()[0].tempHue = pth.data()[0].hue;
                        pth.data()[0].heat = 1;
                        pth
                            .style("fill", rgbToHTML(dataColorsLight[pth.data()[0].hue]))
                            .style("opacity", 1)
                            .style("stroke", "white")
                            .style("stroke-width", 1);
                    }
                }
                me.barChart.clear();
                me.barChart.title(defaultBarChartTitle);
                txt.text(defaultMapLabel);
                me.selected = null;
                hideLegend();
            });

        function countryClick(d){
            if(d.properties.hasOwnProperty('graph')){
                var myLabel = d.properties.graph.label;
                var neighbors = flowDirection === "Emigration" ? d.properties.graph.out_neighbors : d.properties.graph.in_neighbors;
                me.selected = myLabel;
                // Set this country to its default color, and full opacity
                d.tempHue = d.hue;
                var myPth = pathRef[myLabel];
                for(var i = 0; i < myPth.length; i++){
                    d3.select(myPth[i])
                        .style("fill", rgbToHTML(dataColorsBold[d.hue]))
                        .style("stroke", "white").data()[0].heat = 1;
                }


                // Set the whole map to white
                for(var n in pathRef){
                    if(n === myLabel || !pathRef.hasOwnProperty(n)) {
                        continue;
                    }
                    for(var i = 0; i < pathRef[n].length; i++){
                        // pathRef[n][i].tempHue = 10;
                        d3.select(pathRef[n][i])
                            .style("fill", "white")
                            .style("stroke", rgbToHTML(dataColorsBold[d.hue]))
                            .style("stroke-width", 1)
                            .data()[0].tempHue = 10;
                    }
                }

                // Go through and change the color and opacity of the destinations of migration from this
                // country, heat mapped logarithmically by number of migrants received.

                var barData = [];
                var getFilteredTotal = function(neighbor){
                    var fTotal = 0;
                    for(var yr in neighbor){
                        if(!neighbor.hasOwnProperty(yr) || yr === "total"){continue;}
                        if(filters[yr]){
                            var yrData = neighbor[yr];
                            if(filters["Male"] && yrData.hasOwnProperty('m')){
                                fTotal += yrData.m;
                            }
                            if(filters["Female"]&& yrData.hasOwnProperty('f')){
                                fTotal += yrData.f;
                            }
                        }
                    }
                    return fTotal;
                };
                var maxVal = null;
                for(var n in neighbors){
                    if(!neighbors.hasOwnProperty(n) || n === "max_val"){continue;}
                    var filteredTotal = getFilteredTotal(neighbors[n]);
                    if(maxVal === null || filteredTotal > maxVal){
                        maxVal = filteredTotal;
                    }
                }
                for(var n in neighbors){
                    if(!neighbors.hasOwnProperty(n) || !pathRef.hasOwnProperty(n) || n === "max_val"){continue;}
                    var barVal = getFilteredTotal(neighbors[n]);
                    if(barVal > 0){
                        barData.push({value: barVal, label: n});
                        for(var i = 0; i < pathRef[n].length; i++){
                            var pth = d3.select(pathRef[n][i]);
                            var heat = log(logBase, barVal) / log(logBase, maxVal);
                            var hue = gradientCalc([255,255,255], dataColorsBold[d.hue], heat);
                            pth.style("fill", rgbToHTML(hue))
                                .style("stroke", "white");
                            pth.data()[0].tempHue = d.hue;
                            pth.data()[0].heat = heat;

                        }
                    }


                }
                // Display the data in the bar chart
                var prefix = flowDirection === "Emigration" ? "From: " : "To: ";
                me.barChart.display(prefix+myLabel, barData, d.hue);

                // Display the legend
                showLegend();
                setGradientColor(d.hue);
                legendMax.text(maxVal.toLocaleString());
                legendMid.text(Math.round(Math.pow(logBase, (.5*log(logBase, maxVal)))).toLocaleString());
            }
        }

        // draw the map
        svg.selectAll("path")
            .data(dataFile.features)
            .enter().append("path")
                .attr("d", path)
                .attr("fill", function(d){
                    d.hue = d.properties.mapcolor9;
                    d.tempHue = d.hue;
                    d.heat = 1;
                    if(d.properties.hasOwnProperty('graph')) {
                        var label = d.properties.graph.label;
                        if(!pathRef.hasOwnProperty(label)){
                            pathRef[label] = []
                        }
                        pathRef[label].push(this);
                        search.predict.addData({key: label})
                    }
                    else if(d.properties.admin === "Antarctica"){
                        d3.select(this).style("opacity", .25);
                    }
                    return rgbToHTML(dataColorsLight[d.hue]);
                })
                .attr("stroke", "white")
                .attr("stroke-width", 1)
                .on("mouseover", function(d){
                    var heat = d.heat;
                    var hue = gradientCalc([255,255,255], dataColorsBold[d.tempHue], heat);
                    d3.select(this).style("stroke-width", 2).style("fill", rgbToHTML(hue));
                    txt.text(d.properties.admin);
                })
                .on("mouseout", function(d){
                    if(d.properties.hasOwnProperty('graph') && me.selected != d.properties.graph.label){
                        d3.select(this).style("stroke-width", 1);
                        if(me.selected === null){
                            d3.select(this).style("fill", rgbToHTML(dataColorsLight[d.tempHue]))
                        }
                    }
                    txt.text(defaultMapLabel)
                })
                .on("click", countryClick);

        // Create Map Text
        var txtHeight = 24;
        txt = svg.append("text")
            .text(defaultMapLabel)
            .attr("x", me.width/2)
            .attr("y", me.height-5)
            .attr("font-size", txtHeight+'px')
            .attr("font-family", "sans-serif")
            .attr("text-anchor", "middle");

        // Create a legend
        var legend = null;
        var legendMax = null;
        var legendMid = null;
        var legendMin = null;
        var legendHeight = me.height / 4;
        var legendWidth = legendHeight / 5;
        var legendY = .6*me.height;

        var gradient = svg.append("defs").append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");
        var setGradientColor = function(hue){
            gradient.selectAll("stop").remove();
            gradient.append('stop')
                .attr("offset", "0%")
                .attr("stop-color", "white")
                .attr("stop-opacity", 1);
            gradient.append('stop')
                .attr("offset", "100%")
                .attr("stop-color", rgbToHTML(dataColorsBold[hue]))
                .attr("stop-opacity", 1);
            legend.style("fill", "url(#gradient)");
        };
        var showLegend = function(){
            if(legend === null){
                legend = svg.append('rect')
                    .attr("x", 10)
                    .attr("y", legendY)
                    .attr("height", legendHeight)
                    .attr("width", legendWidth);
                legendMax = svg.append("text")
                    .attr("x", 12+legendWidth)
                    .attr("y", legendY)
                    .text("max");
                legendMid = svg.append("text")
                    .attr("x", 12+legendWidth)
                    .attr("y", legendY+(legendHeight/2));
                legendMin = svg.append("text")
                    .attr("x", 12+legendWidth)
                    .attr("y",legendY+legendHeight)
                    .text(0);
            }
        };

        var hideLegend = function(){
            if(legend !== null){
                legend.remove();
                legendMax.remove();
                legendMin.remove();
                legendMid.remove();
                legend = null;
            }

        }
    };

    // Get the datafile, and make a map
    d3.json("/json/CountryData.geojson", function(json) {
        dataFile = json;
        me.displayMap(dataFile);
    })

}

// A class to handle the search field
function SearchField(autoCompleter){
    var me = this;
    this.predict = autoCompleter;

    var txtHeight = 20;
    var searchResults = d3.select('body').append('div')
        .style("display", "none")
        .attr("class", "searchResults");

    var results = [];
    var selection = -1;

    var inputText = d3.select('body').append("input")
        .attr("type", "text")
        .attr('placeholder', "Search")
        .attr("id", "search")
        .on("keyup", function(){
            var key = d3.event.key;
            var dirs = {ArrowDown: 1, ArrowUp: -1};
            if(key === "ArrowDown" || key === "ArrowUp"){
                var old = selection;
                selection = -1 <= selection && selection < results.length ? selection+dirs[key] : selection;
                if(selection > -1){
                    d3.select(results[old]).style('background', "none");
                    d3.select(results[selection]).style("background", "grey");
                }

            }
            else if(key === "Enter"){
                if(-1 < selection && selection < results.length){
                    var rslt = d3.select(results[selection]);
                    rslt.on('click')(rslt.data()[0]);
                }
            }
            else{
                var txt = inputText.property("value");
                if(txt.length > 0){
                    var guess = me.predict.multiGuess(txt);
                    searchResults.selectAll("p").remove();
                    results.length = 0;
                    selection = -1;
                    if(guess.length > 0){
                        searchResults
                            .style("display", "initial")
                            .attr("height", txtHeight*guess.length+"px")
                            .selectAll("p")
                            .data(guess)
                            .enter()
                            .append("p")
                            .text(function(d){
                                results.push(this);
                                return d.key;
                            })
                            .attr("class", "searchResult")
                            .on("mouseover", function(){
                                d3.select(this).style("background", "grey");
                            })
                            .on("mouseout", function(){
                                d3.select(this).style("background", "none");
                            })
                            .on("click", function(d){
                                var pth = d3.select(pathRef[d.key][0]);
                                pth.on("click")(pth.data()[0]);
                                inputText.property("value", d.key);
                                searchResults.style("display", "none");
                            });
                    }


                }
                else{
                    searchResults.style("display", "none");
                }
            }

        });

    var bounds = document.getElementById("search").getBoundingClientRect();
    searchResults.style("top", bounds.bottom+"px");

}

// Initialize the application
window.onload = function(){
    predict = new AutoComplete();
    search = new SearchField(predict);

    genderBox = d3.select("body")
        .append("div")
            .attr("class", "filterContainer");
    genderChecks.male = makeLabeledCheckBox(genderBox, "Male");
    genderChecks.female = makeLabeledCheckBox(genderBox, "Female");

    var years = [1990, 1995, 2000, 2005, 2010, 2015];
    yearBox = d3.select("body")
        .append("div")
            .attr("class", "filterContainer");
    for(var i = 0; i < years.length; i++){
    var yr = years[i].toString();
    yearChecks[yr] = makeLabeledCheckBox(yearBox, yr);
}

    flowBox = d3.select("body").append("div")
        .attr("class", "filterContainer");
    radioButtons["Emigration"] = makeRadioButton(flowBox, "direction", "Emigration");
    radioButtons["Immigration"] = makeRadioButton(flowBox, "direction", "Immigration");
    radioButtons["Emigration"].radio.attr("checked", true);
    flowDirection = "Emigration";
    wm = new WorldMap();
    wm.barChart = new BarChart([], {
        width: window.innerWidth,
        // height: window.innerWidth*(vertSplit/2),
        orientation: "vertical"
    });
};

// Keep the application scaled appropriately with window.innerWidth. Thanks to svgs, this is pretty straightforward.
window.onresize = function(){
    var w = window.innerWidth;
    wm.size(w);
    wm.barChart.size(w);
};