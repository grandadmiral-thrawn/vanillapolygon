//Setup Some Parameters
// var mapWidth = 900;
// var mapHeight = 600;
// var nodeSize = 7;
var mapRoads = [];
var placeKeys = [];
var shortRoute = {};
var to = "",
    from = "";

// var getMapLocations = function(waypoints) {
//     var mapLocations = []
//     if (waypoints && waypoints.length >=1){
//         for (var i = 0 ; i < ml.length ; ++ i) {
//             var id = ml[i].area + "_" ml[i].type +"-"+ ml[i].x + "-" + ml[i].y;
//             var obj = {x: ml[i].x, y: ml[i].y, id: id}
//             mapLocations.push(obj)
//         }
//     } else {
//         console.log("waypoints were not logged!")
//     }
//     return MapLocations
// }


// var mapLocations = [{x:11.062, y:118.5, id:"Conference-Room2" },
//                     {x:230.062, y:35.5, id:"Conference-Room3" },
//                     {x:150.062, y:111.5, id:"Water Fountain 2" },
//                     {x:150.062, y:224.5, id:"Sales Department" },
//                     {x:206.062, y:104.5, id:"Main Atrium" },
//                     {x:177.062, y:173.5, id:"Info Kiosk" },
//                     {x:311.062, y:114.5, id:"Check In" },
//                     {x:131.062, y:173.5, id:"Marketing" },
//                     {x:213.062, y:166.5, id:"Water Fountain" },
//                     {x:297.062, y:210.0, id:"Elevator Exit" },
//                     {x:319.062, y:74.5, id:"Extra Conference Room" },
//                     {x:425.062, y:97.5, id:"Conference Room 1" },
//                     {x:549.062, y:101.5, id:"Corridor to Building B"}];

//var mapOutline = "561.33,3473.05 1878.63,3473.05 1878.63,3340.0 2522.9,3340.0 2522.9,3473.05 3818,3473.05 3818,2909 4537,2909 4537,319 1878.63,319 1878.63,1271.42 2521,1271.42 2521,2568 1878.63,2568 1878.63,2191 561.33,2191"

//Get all possible places, we need this to lookup routes
// for(var temp in roads) placeKeys.push(temp);
// // Get our Links between Nodes/Places
// // Nodes, and PlaceKeys are in the same order, so we can lookup via the index and for our purposes assume they are 1:1
// forEach(mapLocations, function(place){
    
//     forEach(roads[place.id], function(road) {
//         console.log(roads)
//       mapRoads.push({source: place, target: mapLocations[placeKeys.indexOf(road.to)], dist: road.distance});
//     });
// });

// console.log(mapRoads)


//Translate the results of the Shortest path finder in to a friendlier format for D3 to visualize
//lookup all of the places in our roads object, and calculate distances from last place, and from start
function convertRoute(route) 
{
var newRoute = [];
var lastPlace = "";

map(function(place){
    newRoute.push({place: place, distanceFromLast: 0, distanceFromStart: 0});
    if(roads[lastPlace]) {
      forEach(roads[lastPlace],function(element){
        if(element.to == place) {
            newRoute[newRoute.length-1].distanceFromLast = element.distance;
            newRoute[newRoute.length-1].distanceFromStart = newRoute[newRoute.length-2].distanceFromStart + element.distance;
          }
      });
    }
    lastPlace = place;
},route.places);

return newRoute;
} 

// //Visualize the Shortest Path on a subway style Route Map
// function drawStraightRoute(){

// var shortPath = convertRoute(shortRoute);

// //Clear out the old SVG if one exists.
// d3.select("#routeContainer").selectAll("svg").remove();

// //Setup our chart size, radius of nodes, padding, and textSize
// var w = mapWidth - 120, 
//     h = mapHeight - 40,
//     r = 6,
//     lp = 20, //padding for left side of chart range
//     //padding for right, HACK way to make sure text labels aren't clipped.
//     //the "correct" solution might be to draw the entire chart off screen check for clipping, then redraw on-screen.
//     rp = 100, 
//     xAx = h/3 + .5, // axis height
//     textSize = 12;

//     var x = d3.scale.linear()
//     .domain([0, shortRoute.length])
//     .range([r+lp, w-rp]);

// //Quantize scale to avoid overlaps
// function fit(val){

//     var scaled = x(val);
//     return scaled-scaled%((r*2));
// }

// //Create the SVG needed to display the route
// var chart = d3.select("#routeContainer").append("svg")
//     .attr("width", w)
//     .attr("height", h);

// //Create the circles that will represent our map points
// var node = d3.select("#routeContainer").select("svg").selectAll("circle")
//     .data(shortPath);

// //Create the text labels for the node names
// var placeLabel = d3.select("#routeContainer").select("svg").selectAll("text")
//     .data(shortPath);

// var distanceLabel = d3.select("#routeContainer").select("svg").selectAll("distanceLabel")
//     .data(shortPath);

// var distancePath = d3.select("#routeContainer").select("svg").selectAll("distancePath")
//     .attr("class","distancePath")
//     .data(shortPath);

// // Enter…
// node.enter().append("circle")
//     .attr("class","routeNode")
//     .attr("cx",function(d) {
//       return fit(d.distanceFromStart);})
//     .attr("cy",xAx)
//     .attr("r",r);

// placeLabel.enter().append("text")
//     .attr("class","placeLabel")
//     .style("text-anchor","start")
//     .style("font-size",textSize + "px")
//     .text(function(d) {return d.place})
//     .attr("transform",function(d) { return "translate(" + (fit(d.distanceFromStart) + r/2 ) + ", " + (xAx + r + (textSize/2)) + ") rotate(45)"; });

// distanceLabel.enter().append("text")
//     .attr("class","distanceLabel")
//     .style("text-anchor","middle")
//     .style("font-size", textSize*.8 + "px")
//     .text(function(d) {return d.distanceFromLast})
//     .attr("transform",function(d) { 
//       if(d.distanceFromLast != 0) 
//         return "translate(" + ((fit(d.distanceFromStart - d.distanceFromLast) + fit(d.distanceFromStart))/2.0)  + ", " + (xAx - 4*r - 5) + ")";     
//        // return "translate(" + (fit(d.distanceFromStart - d.distanceFromLast) + (fit(d.distanceFromStart) - fit(d.distanceFromStart - d.distanceFromLast))/2.0)  + ", " + (xAx - 4*r - 5) + ")"; 
//       else return ""});

// distancePath.enter().append("path")
//   .attr("class","distancePath")
//   .attr("d",function(d){
//       if(d.distanceFromLast != 0) {
//         var a = d.distanceFromStart;
//         var b = d.distanceFromLast;

//         //Path definition for curly brackets
//         return ("M " + fit(a) + " " + (xAx-r) +
//           " Q " + fit(a) + " " + (xAx-2*r) + " " + (fit(a) - .25*(fit(a)-fit(a-b))) + " " + (xAx -2*r) + 
//           " T " + ((fit(a - b) + fit(a))*.5) + " " + (xAx-4*r) +
//           " M " + (fit(a - b)) + " " + (xAx-r) +
//           " Q " + (fit(a - b)) + " " + (xAx-2*r) + " " + (fit(a) - .75*(fit(a)-fit(a-b))) + " " + (xAx - 2*r) + 
//           " T " + ((fit(a - b) + fit(a))*.5) + " " + (xAx-4*r));
//     }
//       else return });

// // Exit…
// node.exit().remove();
// placeLabel.exit().remove();
// distanceLabel.exit().remove();
// distancePath.exit().remove();

// }

function nodeClicked(place)
{   
    d3.select("#" + removeWhiteSpace(place)).attr("class","mapNodeActive");

    from = to;
    to = place;

    if (from != "") {
      shortRoute = shortestRoute(from,to);
      updateMap();
      drawStraightRoute();
    }
    
}

function updateMap()
{
    //reset our highlighted styles
    d3.selectAll(".mapLinkActive").attr("class","mapLink");
    d3.selectAll(".mapNodeActive").attr("class","mapNode");

    var lastPlace = "";
    forEach(shortRoute.places, function(place){
        d3.select("#" + removeWhiteSpace(place)).attr("class","mapNodeActive");
        //Try both directions to find link
        d3.select("#" + removeWhiteSpace(place) + "-" + removeWhiteSpace(lastPlace)).attr("class","mapLinkActive");
        d3.select("#" + removeWhiteSpace(lastPlace) + "-" + removeWhiteSpace(place)).attr("class","mapLinkActive");
        lastPlace = place;
    });
}

function drawMap()
{
    var svg = d3.select("#mapContainer").append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

    var outline = d3.select("#mapContainer").select("svg")
    .append("polyline")
    .attr("points",mapOutline)
    .attr("class","mapOutline");
    
    var nodes = d3.select("#mapContainer").select("svg").selectAll("mapNode")
    .attr("class", "mapNode").data(mapLocations);

    var links = d3.select("#mapContainer").select("svg").selectAll("mapLinks")
    .attr("class", "mapLinks").data(mapRoads);

    var labels = d3.select("#mapContainer").select("svg").selectAll("mapLabels")
    .attr("class", "mapLabels").data(mapLocations);

    links.enter().append("line")
    	.attr("class","mapLink")
    	.attr("id",function(d){ return removeWhiteSpace(d.source.id) + "-" + removeWhiteSpace(d.target.id);})
    	.attr("x1",function(d){ return d.source.x;})
    	.attr("y1",function(d){ return d.source.y;})
    	.attr("x2",function(d){ return d.target.x;})
    	.attr("y2",function(d){ return d.target.y;});

    nodes.enter().append("circle")
    	.attr("class","mapNode")
    	.attr("id",function(d){ return removeWhiteSpace(d.id);})
    	.attr("cx",function(d){ return d.x;})
    	.attr("cy",function(d){ return d.y;})
    	.attr("r", nodeSize)
    	.on("click", function(d) { nodeClicked(d.id); });

    labels.enter().append("text")
    .attr("class","mapLabels")
    .text(function(d){ return d.id;})
    .style("fill","white")
    .style("text-anchor", function(d){
        if(d.x < 100) return "start"; // Hack to prevent label clipping
        if(d.x > 400) return "end"; // Hack to prevent label clipping
        else return "middle";
    })
    .attr("transform", function(d){ 
      if(d.id == "Hanakee Pearl Lodge") return "translate(" + d.x + ", " + (d.y - 10) + ")"; // Hack to prevent label overlap
      return "translate(" + d.x + ", " + (d.y + 14) + ")";});
    
    outline.exit().remove();
    links.exit().remove();
    nodes.exit().remove();
}

function removeWhiteSpace(str)
{
  return str.replace(/\s/g, '');
}

drawMap();