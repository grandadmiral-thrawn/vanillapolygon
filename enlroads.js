// needed by mapping library
var roads = {};
var mapRoads = [];
var placeKeys = [];
var shortRoute = {};
var to = "",
    from = "";

function removeWhiteSpace(str)
{
  return str.replace(/\s/g, '');
}

var nodeClicked = function(evt) {   
  var place = evt.target.getAttributeNS(null,"id");
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
  console.log(nodes)
  for (var i = 0; i < nodes.length; ++i) {
    console.log(nodes[i])
    nodes[i].addEventListener("click", nodeClicked)
  }
}

var getMapLocations = function(err, waypoints, roads, placeKeys, mapRoads) {
  if (err) {
    console.log(err)
  }
  console.log(waypoints)
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