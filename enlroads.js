// // empty variable to hold waypoints
var roads = {};

var pl = function() {
  // turns voronoi links between Nodes into actual paths with known lengths
  var outputpaths = []

  var d = document.getElementById("voronoi");

  for (var i = 0; i < d.children.length; ++i){
      if (d.children[i].getAttributeNS(null,"class") !== "ignore"){

        var newpath = "M " + d.children[i].getAttributeNS(null, "x1") + " " + d.children[i].getAttributeNS(null, "y1") + " L " + d.children[i].getAttributeNS(null, "x2") + " " + d.children[i].getAttributeNS(null, "y2");

        var newid = "connects-" + d.children[i].getAttributeNS(null, "x1") + "-" + d.children[i].getAttributeNS(null, "y1") + "-to-" + d.children[i].getAttributeNS(null, "x2") + "-" + d.children[i].getAttributeNS(null, "y2");
        d.children[i].setAttributeNS(null, "id", newid);

        var blankpath = document.createElementNS("http://www.w3.org/2000/svg","path");
        blankpath.setAttributeNS(null,"d", newpath);
        //push to array maybe for front end
        outputpaths.push({name: newid, length: Number(blankpath.getTotalLength().toFixed(0))});
        // internal processing

        console.log(d.children[i].getAttributeNS(null, "x1") +"," +d.children[i].getAttributeNS(null, "y1"))
        makeRoad(d.children[i].getAttributeNS(null, "x1") +"," +d.children[i].getAttributeNS(null, "y1"), d.children[i].getAttributeNS(null, "x2") +"," +d.children[i].getAttributeNS(null, "y2"), Number(blankpath.getTotalLength().toFixed(0)) )
      }
  }
  return outputpaths
}

// functionally create a road from a point to another point
function makeRoad(from, to, length)
{
  console.log(from)
  function addRoad(from, to)
    {
        if(!(from in roads))
            roads[from] = [];
      roads[from].push({to: to, distance: length});
    }
  addRoad(from, to);
  addRoad(to, from);
  console.log(roads)
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