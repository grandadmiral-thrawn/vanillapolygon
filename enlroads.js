// needed by mapping library
var roads = {};
var mapRoads = [];
var placeKeys = [];
var shortRoute = {};
var to = "";
var from = "";

function removeWhiteSpace(str)
{
  return str.replace(/\s/g, '');
}

function updateMap()
{
    //reset our highlighted styles
    d3.selectAll(".mapLinkActive").attr("class","mapLink");
    d3.selectAll(".mapNodeActive").attr("class","mapNode");

    var lastPlace = "";
    console.log(shortRoute)
    forEach(shortRoute.places, function(place){
        d3.select("#" + removeWhiteSpace(place)).attr("class","mapNodeActive");
        //Try both directions to find link
        d3.select("#" + removeWhiteSpace(place) + "-" + removeWhiteSpace(lastPlace)).attr("class","mapLinkActive");
        d3.select("#" + removeWhiteSpace(lastPlace) + "-" + removeWhiteSpace(place)).attr("class","mapLinkActive");
        lastPlace = place;
    });
}

function drawStraightRoute(){

  var shortPath = convertRoute(shortRoute);
  console.log(shortPath)

  //Clear out the old SVG if one exists.
  d3.select("#routeContainer").selectAll("svg").remove();

  var mapWidth = 1000;
  var mapHeight = 400;
  //Setup our chart size, radius of nodes, padding, and textSize
  var w = mapWidth - 120, 
    h = mapHeight - 40,
    r = 6,
    lp = 20, //padding for left side of chart range
    //padding for right, HACK way to make sure text labels aren't clipped.
    //the "correct" solution might be to draw the entire chart off screen check for clipping, then redraw on-screen.
    rp = 100, 
    xAx = h/3 + .5, // axis height
    textSize = 12;

    var x = d3.scaleLinear()
    .domain([0, shortRoute.length])
    .range([r+lp, w-rp]);

//Quantize scale to avoid overlaps
function fit(val){
    var scaled = x(val);
    return scaled-scaled%((r*2));
}

//Create the SVG needed to display the route
var chart = d3.select("#routeContainer").append("svg")
    .attr("width", w)
    .attr("height", h);

//Create the circles that will represent our map points
var node = d3.select("#routeContainer").select("svg").selectAll("circle")
    .data(shortPath);

//Create the text labels for the node names
var placeLabel = d3.select("#routeContainer").select("svg").selectAll("text")
    .data(shortPath);

var distanceLabel = d3.select("#routeContainer").select("svg").selectAll("distanceLabel")
    .data(shortPath);

var distancePath = d3.select("#routeContainer").select("svg").selectAll("distancePath")
    .attr("class","distancePath")
    .data(shortPath);

// Enter…
node.enter().append("circle")
    .attr("class","routeNode")
    .attr("cx",function(d) {
      return fit(d.distanceFromStart);})
    .attr("cy",xAx)
    .attr("r",r);

placeLabel.enter().append("text")
    .attr("class","placeLabel")
    .style("text-anchor","start")
    .style("font-size",textSize + "px")
    .text(function(d) {return d.place})
    .attr("transform",function(d) { return "translate(" + (fit(d.distanceFromStart) + r/2 ) + ", " + (xAx + r + (textSize/2)) + ") rotate(45)"; });

distanceLabel.enter().append("text")
    .attr("class","distanceLabel")
    .style("text-anchor","middle")
    .style("font-size", textSize*.8 + "px")
    .text(function(d) {return d.distanceFromLast})
    .attr("transform",function(d) { 
      if(d.distanceFromLast != 0) 
        return "translate(" + ((fit(d.distanceFromStart - d.distanceFromLast) + fit(d.distanceFromStart))/2.0)  + ", " + (xAx - 4*r - 5) + ")";     
       // return "translate(" + (fit(d.distanceFromStart - d.distanceFromLast) + (fit(d.distanceFromStart) - fit(d.distanceFromStart - d.distanceFromLast))/2.0)  + ", " + (xAx - 4*r - 5) + ")"; 
      else return ""});

distancePath.enter().append("path")
  .attr("class","distancePath")
  .attr("d",function(d){
      if(d.distanceFromLast != 0) {
        var a = d.distanceFromStart;
        var b = d.distanceFromLast;

        //Path definition for curly brackets
        return ("M " + fit(a) + " " + (xAx-r) +
          " Q " + fit(a) + " " + (xAx-2*r) + " " + (fit(a) - .25*(fit(a)-fit(a-b))) + " " + (xAx -2*r) + 
          " T " + ((fit(a - b) + fit(a))*.5) + " " + (xAx-4*r) +
          " M " + (fit(a - b)) + " " + (xAx-r) +
          " Q " + (fit(a - b)) + " " + (xAx-2*r) + " " + (fit(a) - .75*(fit(a)-fit(a-b))) + " " + (xAx - 2*r) + 
          " T " + ((fit(a - b) + fit(a))*.5) + " " + (xAx-4*r));
    }
      else return });

// Exit…
node.exit().remove();
placeLabel.exit().remove();
distanceLabel.exit().remove();
distancePath.exit().remove();

}

var nodeClicked = function(evt) {   
  var place = evt.target.getAttributeNS(null, "id");
  //console.log(place)
  //d3.select("#" + removeWhiteSpace(place)).attr("class","mapNodeActive");
  var p =document.getElementById(place);
  p.setAttributeNS(null,"class","mapNodeActive")
    console.log(from)
    console.log(to)
    from = to;
    to = place;

    if (from != "") {
      shortRoute = shortestRoute(from,to);
      updateMap();
      drawStraightRoute();
    }    
}

var convertRoute = function(route) 
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

var placeKeysCB = function(err, roads, mapLocations, placeKeys, mapRoads) {
  if(err) {
    console.log(err)
  }
  for(var temp in roads) {
    placeKeys.push(temp);
  }
  // Get our Links between Nodes/Places
  // Nodes, and PlaceKeys are in the same order, so we can lookup via the index and for our purposes assume they are 1:1
  forEach(mapLocations, function(place){
      forEach(roads[place.x.toFixed(0) + "," + place.y.toFixed(0)], function(road) {
        mapRoads.push({source: place, target: mapLocations[placeKeys.indexOf(road.to)], dist: road.distance});
      });
  });
  
  var nodes = document.getElementsByClassName("mapNode");
  for (var i = 0; i < nodes.length; ++i) {
    //console.log(nodes[i])
    nodes[i].addEventListener("click", nodeClicked)
  }
}

var getMapLocations = function(err, waypoints, roads, placeKeys, mapRoads) {
  if (err) {
    console.log(err)
  }
  var mapLocations = [];

  // do not define open locations as actual locations
  for (var i = 0 ; i < waypoints.length ; ++ i) {
    if (waypoints[i].area !== "open") {
      var id = waypoints[i].area + "_" + waypoints[i].type +"-"+ waypoints[i].x + "-" + waypoints[i].y;
      var obj = {x: waypoints[i].x, y: waypoints[i].y, id: id}
      
      mapLocations.push(obj)
    } 
  }
  placeKeysCB(null, roads, mapLocations, placeKeys, mapRoads);
}

var pl = function(waypoints) {
  
  // turns voronoi links between Nodes into actual paths with known lengths
  var outputpaths = []
  var d = document.getElementById("voronoi");
  var test = document.getElementById("delaunay");

  for (var i = 0; i < d.children.length; ++i){
      if (d.children[i].getAttributeNS(null,"class") !== "ignore"){
        // create a path 
        var newpath = "M " + d.children[i].getAttributeNS(null, "x1") + " " + d.children[i].getAttributeNS(null, "y1") + " L " + d.children[i].getAttributeNS(null, "x2") + " " + d.children[i].getAttributeNS(null, "y2");

        // assign an id to that path based on its endpoints
        var newid = "connects-" + d.children[i].getAttributeNS(null, "x1") + "-" + d.children[i].getAttributeNS(null, "y1") + "-to-" + d.children[i].getAttributeNS(null, "x2") + "-" + d.children[i].getAttributeNS(null, "y2");
        d.children[i].setAttributeNS(null, "id", newid);

        // measure the path as path element
        var blankpath = document.createElementNS("http://www.w3.org/2000/svg","path");
        blankpath.setAttributeNS(null,"d", newpath);

        //push to array maybe for front end
        outputpaths.push({name: newid, length: Number(blankpath.getTotalLength().toFixed(0))});
        // internal processing

        makeRoad(d.children[i].getAttributeNS(null, "x1") +"," +d.children[i].getAttributeNS(null, "y1"), d.children[i].getAttributeNS(null, "x2") +"," +d.children[i].getAttributeNS(null, "y2"), Number(blankpath.getTotalLength().toFixed(0)) )
      }
  }

  getMapLocations(null, waypoints, roads, placeKeys, mapRoads)
}

// functionally create a road from a point to another point
function makeRoad(from, to, length)
{
  function addRoad(from, to)
    {
        if(!(from in roads))
            roads[from] = [];
      roads[from].push({to: to, distance: length});
    }
  addRoad(from, to);
  addRoad(to, from);
}

function makeRoads(start)
{
     for ( var i = 1; i < arguments.length; i+=2)
       makeRoad(start, arguments[i],arguments[i+1]);
}

function roadsFrom(place) {
    var found = roads[place];
    
    if (found == undefined)
        throw new error("No place named '" + place + "' found.");
    else
        return found;
}

function printRoads(start)
{
  var temp = roadsFrom(start);
  for( var x in temp)
    console.log(temp[x]);
}

function member(array, value) {
  for(var x in array){
    if(array[x] === value) return true;
  }
  return false;
}

function possibleRoutes(from, to) {
  function findRoutes(route) {
    function notVisited(road) {
      return !member(route.places, road.to);
    }
    function continueRoute(road) {
      return findRoutes({places: route.places.concat([road.to]), length: route.length + road.distance});
    }
    var end = route.places[route.places.length - 1];
    if (end == to)
      return [route];
    else
      return flatten(map(continueRoute, filter(notVisited,roadsFrom(end)) ) );
  }

  return findRoutes({places: [from], length: 0});
}

function shortestRoute(from,to) {
  var currentShortest = null;
  forEach(possibleRoutes(from,to), function(route){
    if(!currentShortest || currentShortest.length > route.length)
      currentShortest = route; 
  });
  return currentShortest;
}

function computeRealDistance(from, to){
  var sqrd = Math.pow(from, 2) + Math.pow(to,2);
  var dist = Math.sqrt(sqrd);
  return dist;
}



// //Load data in to our map
// // makeRoads("Conference-Room2", "Conference-Room3", 19, "Water Fountain 2", 15, "Sales Department", 15);
// // makeRoads("Main Atrium", "Conference-Room3", 6, "Water Fountain 2", 5, "Info Kiosk", 4, "Check In", 11);
// // makeRoads("Marketing", "Water Fountain 2", 8, "Sales Department", 4);
// // makeRoads("Info Kiosk", "Sales Department", 3, "Water Fountain", 1);
// // makeRoads("Elevator Exit", "Water Fountain", 6, "Check In", 5);
// // makeRoads("Water Fountain", "Main Atrium", 3);
// // makeRoads("Extra Conference Room", "Check In", 3);
// // makeRoads("Conference Room 1", "Check In", 13, "Corridor to Building B", 14);