var waypointFactory = function(x, y, type, areaHov) {
	// create a waypoint and give it a location,type, and area association
	return {x: x, y: y, type: type, area: areaHov}
}

var cursorPoint = function (evt, pointel, svgel, svgstateel) {
	// finds your cursor in the svg and returns that position to the state array as well as displaying that position in the blue blob
	var stateify = function(err, results) {
		if (err) {
			console.log(err)
		}
		svgstateel.push(results);
	}
  	pointel.x = evt.clientX;
  	pointel.y = evt.clientY;
  	stateify(null, pointel.matrixTransform(svgel.getScreenCTM().inverse()));
};

var circleFactory = function(appendTo, x, y, r, fillcolor) {
	// appends circles to something given cx, cy, r, and what to append to
	var circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
	circle.setAttributeNS(null, "r", r);
	circle.setAttributeNS(null, "cx", x);
	circle.setAttributeNS(null, "cy", y);
	circle.setAttributeNS(null, "fill", fillcolor);
	circle.setAttributeNS(null, "opacity", 1);
	circle.setAttributeNS(null, "stroke", "black");
	circle.setAttributeNS(null, "stroke-opacity", "1")
	appendTo.appendChild(circle)
}

var parsePath = function(element) {
	// parses just one path, in the syntax that would be created by someone actually writing an SVG
	var str = element.getAttributeNS(null, "d")
	var commands = str.split(/(?=[LMC])/);
	var pointArrays = commands.map(function(d){
		
		// if it starts with L space then clip the front
		if ((d[0] === "L") && (d[1] === " ")){
			d = d.slice(1, d.length);
		}
		// if it starts with M space then clip the front
		if ((d[0] === "M") && (d[1] === " ")){
			d = d.slice(1, d.length)
		}
		// if it ends with Z then clip the end
		if (d[d.length-1] === "Z"){
			d = d.slice(0, d.length-1)
		}
		// if it ends with space then clip the end
		if (d[d.length-1] === " "){
			d = d.slice(0, d.length-1)
		}
		// split on the space
    	var pointsArray = d.slice(1, d.length).split(" ");
    	var pairsArray = []; 
    	for(var i = 0; i < pointsArray.length; i += 2){
       		pairsArray.push([+pointsArray[i], +pointsArray[i+1]]);
    	}
    	return pairsArray;
	});
	return pointArrays;
}


var voronoiHelper = function(waypoints) {
	// draws delaunay Triangles 
	function redrawTriangle(triangle) {
  		triangle.classed("primary", function(d) { 
  			return d[0] === sites[0] || d[1] === sites[0] || d[2] === sites[0]; 
  		})
      .attr("d", function(d) { return "M" + d.join("L") + "Z"; });
	}
	
	//testdata
	var sites = [[123,3423],[3423,3321],[345,1234],[3456,3221],[890,1234],[560,1700]];
	var voronoi = d3.voronoi();

	console.log(voronoi.triangles(sites))

	var triangle = d3.selectAll("#delaunay")
		.attr("class", "triangles")
		.selectAll("path")
		.data(voronoi.triangles(sites))
		.enter()
		.append("path")
		.call(redrawTriangle)

	var link = d3.select("#voronoi")
		.attr("class", "links")
		.selectAll("line")
		.data(voronoi.links([sites]))
		.enter().append("line")
		///.call(redrawLink);
	//var corners = results.map(function(x){return x[0]})
	//var triangles = voronoi.triangles(corners);
	//document.getElementById("corners");
	//for (var i = 0; i < results.length; ++i) {
	//circleFactory(svgel, results[i][0][0], results[i][0][1], "50")
	//}
	//}

	//var pA = parsePath(svgel);
	// also outputs those paths to an array 
	//viewPaths(null, pA);
}


var areaHelper = function(polys, waypoints, areaHov) {
	// display converted values in array
	// calculate areas using functions below.
	// rough number based on 1/48 scale in ft, so 
	var conversionFactor = 0.0004;

	// do the main outline to follow up the areas within it
	var mainOutlineHelper = function(err, polys) {
		if (err) {
			console.log(err)
		}
		// get the main outline, sample it, put the path into a polygon for gettting the area
		var mo = document.getElementById("main-outline");
		var polygonIn = polygonSampledFromPath(mo, 1000);
		var thisArea = polyArea(polygonIn);
		var id = mo.getAttributeNS(null, "id");

		// determine the corners of that area and draw them
		var corners = parsePath(mo);
		var fc = "cornflowerblue";

		for (var ii = 0; ii < corners.length; ++ii) {
			circleFactory(c, corners[ii][0][0], corners[ii][0][1], "30", fc)
			var waypoint = waypointFactory(corners[ii][0][0], corners[ii][0][1], "areas", areaHov)
			waypoints.push(waypoint)
		}

		polys.push({'polygon': polygonIn, 'area': thisArea, 'id': id, 'walkable': 0});
		var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
		var ts1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
		var ts2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
		var ts3 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");

		// for the main outline we put this text a little larger and to the left
		var xplacement = mo.getBBox().x*1.1;
		var yplacement = mo.getBBox().y*1.1;

		// put that text up there to look at
		t.setAttributeNS(null, "x", xplacement);
    	t.setAttributeNS(null, "y", yplacement);
		t.setAttributeNS(null, "font-size", "3em");
		t.setAttributeNS(null, "stroke", "transparent");
		t.setAttributeNS(null, "fill", "white");
		ts1.textContent = "id: " + id 
		ts2.setAttributeNS(null, "x", xplacement);
    	ts2.setAttributeNS(null, "dy", "1em");
    	ts2.textContent = "area: " + (thisArea*conversionFactor).toFixed(0) + " ft";
    	ts3.setAttributeNS(null, "x", xplacement);
    	ts3.setAttributeNS(null, "dy", "1em");
    	ts3.textContent = "walkable: " + 0;
    	t.appendChild(ts1);
    	t.appendChild(ts2);
    	t.appendChild(ts3);
    	mo.parentNode.appendChild(t);
    }

	// get existing areas and add to polys list
	var areas = document.getElementById("areas");
	for (var i = 0; i < areas.children.length; ++i) {
		
		// create text to append
		var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
		var ts1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
		var ts2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
		var ts3 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");

		// find the corners element in the SVG
		var c = document.getElementById("corners");

		// determine the corners of that area and draw them
		var corners = parsePath(areas.children[i].children[0]);
		var fc = areas.children[i].children[0].getAttributeNS(null, "fill");
		var id = areas.children[i].children[0].getAttributeNS(null, "id");

		// draw those corners onto the data
		for (var ii = 0; ii < corners.length; ++ii) {
			circleFactory(c, corners[ii][0][0], corners[ii][0][1], "30", fc)
			var waypoint = waypointFactory(corners[ii][0][0], corners[ii][0][1], "areas", id)
			waypoints.push(waypoint)
		}
		
		if (areas.children[i].children[0].getAttributeNS(null, "class") === "areas") {
			
			var polygonIn = polygonSampledFromPath(areas.children[i].children[0], 1000)
			var thisArea = polyArea(polygonIn);
			polys.push({'polygon': polygonIn, 'area': thisArea*conversionFactor, 'units': 'feet', 'id': id, 'walkable': 1});
			
			var xplacement = areas.children[i].getBBox().x*1.1;
			var yplacement = areas.children[i].getBBox().y*1.1;

			t.setAttributeNS(null, "x", xplacement);
        	t.setAttributeNS(null, "y", yplacement);
			t.setAttributeNS(null, "font-size", "2em");
			t.setAttributeNS(null, "stroke", "transparent");
			t.setAttributeNS(null, "fill", "white");
			t.setAttributeNS(null, "class", "hidden-details");
			ts1.textContent = "id: " + id 
			ts2.setAttributeNS(null, "x", xplacement);
        	ts2.setAttributeNS(null, "dy", "1em");
        	ts2.textContent = "area: " + (thisArea*conversionFactor).toFixed(0) + " ft";
        	ts3.setAttributeNS(null, "x", xplacement);
        	ts3.setAttributeNS(null, "dy", "1em");
        	ts3.textContent = "walkable: " + 0;
        	
        	t.appendChild(ts1);
        	t.appendChild(ts2);
        	t.appendChild(ts3);
        	
        	areas.children[i].appendChild(t);

        	// show details on mouseover; set the hovered area to that area's name
			areas.children[i].addEventListener("mouseover", function(evt) {
				evt.target.parentNode.children[1].setAttributeNS(null, "class", "details");
				areaHov = evt.target.getAttributeNS(null,"id");
			});

			// hide them on mouse out, set the hovered area to "open". if you go right into another area, it will get set to that name, otherwise, it will be open
			areas.children[i].addEventListener("mouseout", function(evt) {
				evt.target.parentNode.children[1].setAttributeNS(null, "class", "hidden-details");
				areaHov = "open";
			});
		}
	}
	mainOutlineHelper(null, polys)
}

var simplePolygonHelper = function(path, counter, polys) {
	// computes the area and makes display settings of a newly drawn polygon
	var conversionFactor = 0.0004;
	var polygonIn = polygonSampledFromPath(path, 1000);
	var thisArea = polyArea(polygonIn);
	var id = "areas-" + counter;
	path.setAttributeNS(null, "id", id);
	polys.push({'polygon': polygonIn, 'area': thisArea*conversionFactor, 'units': 'feet', 'id': id, 'walkable': 0});
	
	// create text to append
	var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
	var ts1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
	var ts2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
	var ts3 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");

	// where we will put that text
	var xplacement = path.parentNode.getBBox().x*1.1;
	var yplacement = path.parentNode.getBBox().y*1.1;

	t.setAttributeNS(null, "x", xplacement);
	t.setAttributeNS(null, "y", yplacement);
	t.setAttributeNS(null, "font-size", "2em");
	t.setAttributeNS(null, "stroke", "transparent");
	t.setAttributeNS(null, "fill", "white");
	t.setAttributeNS(null, "class", "hidden-details");
	ts1.textContent = "id: " + id 
	ts2.setAttributeNS(null, "x", xplacement);
	ts2.setAttributeNS(null, "dy", "1em");
	ts2.textContent = "area: " + (thisArea*conversionFactor).toFixed(0) + " ft";
	ts3.setAttributeNS(null, "x", xplacement);
	ts3.setAttributeNS(null, "dy", "1em");
	ts3.textContent = "walkable: " + 1;
	
	t.appendChild(ts1);
	t.appendChild(ts2);
	t.appendChild(ts3);
	
	console.log(path.parentNode)
	path.parentNode.appendChild(t);

	path.parentNode.addEventListener("mouseover", function(evt) {
		evt.target.parentNode.children[1].setAttributeNS(null, "class", "details");
		areaHov = evt.target.getAttributeNS(null,"id");
	});

	path.parentNode.addEventListener("mouseout", function(evt) {
		evt.target.parentNode.children[1].setAttributeNS(null, "class", "hidden-details");
		areaHov = "open";
	});
}

var polygonSampledFromPath = function(path, samples) {
	// for computing the areas we turn the path to a polygon
	var poly = document.createElementNS("http://www.w3.org/2000/svg","polygon");
	var points = [];
	var len = path.getTotalLength();
	var step = step = len/samples;
	for (var i = 0; i <= len; i += step) {
		var p = path.getPointAtLength(i);
		points.push(p.x + ',' + p.y)
	}
	poly.setAttribute('points', points.join(' '));
	return poly;
}

var polyArea = function(poly){
	// Compute the area of a polygon
	var area=0,pts=poly.points,len=pts.numberOfItems;
	for(var i=0;i<len;++i){
		var p1 = pts.getItem(i), p2=pts.getItem((i+len-1)%len);
		area += (p2.x+p1.x) * (p2.y-p1.y);
	}
	return Math.abs(area/2);
}


var listenDemo = function(evt) {
	console.log(evt.target)
}



var pointInPolygon = function (point, vs) {
        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        var xi, xj, i, intersect,
            x = point[0],
            y = point[1],
            inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
          xi = vs[i][0],
          yi = vs[i][1],
          xj = vs[j][0],
          yj = vs[j][1],
          intersect = ((yi > y) != (yj > y))
              && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      }