var randomPointFiller = function(waypoints) {
	// puts at least a centroid in the main area
	var areas = document.getElementById("areas");
	var ct = document.getElementById("generated");
	var obs = document.getElementById("obstacles");
	var way = document.getElementById("waypoints");

	for (var i = 0; i < obs.children.length; ++ i) {
		var obscoords = parsePath(obstacles.children[i]);
		for (var ii = 0; ii < obscoords.length; ++ ii) {
			circleFactory(way, obscoords[ii][0][0].toFixed(0), obscoords[ii][0][1].toFixed(0), "40", "red", "mapNode");
			// we can't know where the obstacle is in the bulk approach so we just give it a temp
			waypoints.push({x: Number(obscoords[ii][0][0].toFixed(0)), y: Number(obscoords[ii][0][1].toFixed(0)), type: 'obstacle', area: "temp"})
		}			
	}

	for (var i = 0; i < areas.children.length; ++i) {
		var p = areas.children[i];
		var pts = parsePath(p.children[0])
		var ptsx = pts.map(function(x){return [x[0][0], x[0][1]]})
		var centroid = d3.polygonCentroid(ptsx);
		
		circleFactory(ct, centroid[0], centroid[1], "40", "cornflowerblue", "mapNode");
		waypoints.push({x: Number(centroid[0].toFixed(0)), y: Number(centroid[1].toFixed(0)), type: 'centroid', area: p.children[0].getAttributeNS(null, "id")});
	}
	//ct.setAttributeNS(null, "class", "hidden-centroid");
}

var mainAreaFiller = function(waypoints) {
	//creates the main area centroid
	var area = document.getElementById("main-outline");
	var pts = parsePath(area)
	var ptsx = pts.map(function(x){return [x[0][0], x[0][1]]})
	var ct = document.getElementById("generated");
	var centroid = d3.polygonCentroid(ptsx);
	circleFactory(ct, Number(centroid[0].toFixed(0)), Number(centroid[1].toFixed(0)), "40", "cornflowerblue", "mapNode");
	waypoints.push({x: Number(centroid[0].toFixed(0)), y: Number(centroid[1].toFixed(0)), type: 'centroid', area: "open"});
}

var mainAreaDelauneyDemo = function(waypoints) {

	var areas = document.getElementById("areas");
	var voronoi = d3.voronoi();
	var pts = waypoints.map(function(x){return [x.x, x.y]})

	for (var i = 0; i < areas.children.length; ++i) {

		var id = areas.children[i].children[0].getAttributeNS(null, "id");
		console.log(id)
		var cssget = document.getElementById(id);
		var walkable = cssget.classList.contains("walkable");
		if (walkable !== true) {
			delaunayHelper(waypoints, id);
		} else {
			waypoints.map(function(x){if (x.area === id){
				x.area = "open";
			}});
		}
	}
	delaunayHelper(waypoints,"open")

	function drawCells(centroids) {
  		centroids
      	.attr("d", function(d) { console.log(d); if (d==null){
      		return null
      	} else {
      		return d == null ? null : "M " + d.join(" L" ) + "Z"; 
      	}
      	})
      	.attr("class", "mapLink")
      	.style("fill","none")
      	.attr("stroke","cyan")
      	.attr("stroke-width","2")
      	.attr("stroke-dasharray","20,20")
	}

	var centroids= d3.selectAll("#svg-floorplan")
		.append("g")
		.attr("id","test");

	centroids.selectAll(".centroids")
		.data(voronoi.polygons(pts))
		.enter()
		.append("path")
		.call(drawCells)

	var vor = document.getElementById("voronoi");
	var lines = vor.children;
	for (var i = 0; i < lines.length; ++ i) {
		lines[i].addEventListener("click", function(e){
			if (e.shiftKey) console.log(e.target)}
			, false);
	}	
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

var circleFactory = function(appendTo, x, y, r, fillcolor, givenClass) {
	// appends circles to something given cx, cy, r, and what to append to
	var circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
	circle.setAttributeNS(null, "r", r);
	circle.setAttributeNS(null, "cx", x);
	circle.setAttributeNS(null, "cy", y);
	circle.setAttributeNS(null, "fill", fillcolor);
	circle.setAttributeNS(null, "opacity", 1);
	circle.setAttributeNS(null, "stroke", "black");
	circle.setAttributeNS(null, "stroke-opacity", "1");
	circle.setAttributeNS(null, "class", givenClass);
	circle.setAttributeNS(null, "id", x + "," + y);

	circle.addEventListener("click", function(e) {
		if (e.shiftKey) {
			e.preventDefault();
			circle.setAttributeNS(null, "class", "ignore");
		}
	})
	appendTo.appendChild(circle)
}

var waypointFactory = function(x, y, type, areaHov) {
	// create a waypoint and give it a location,type, and area association
	return {x: x, y: y, type: type, area: areaHov}
}

var waypointFilter = function(xin, yin, type, areaHov, waypoints) {
	if (waypoints.length === 0) {
		return;
	} else {
		var similar2 = waypoints.filter(function(x){
		if (((x.x + 25) <=xin || (x.x-25) >= xin) && ((x.y + 25) <=yin || (x.y-25) >=yin)) {
			return x;
			}
		})
	}
	return x;
}

var latticegen = function(pathelement, waypoints){
	// generate a basic lattice for the wayfinding
	var bbox = pathelement.getBBox();
	var p = parsePath(pathelement);
	var polygon = p.map(function(x){return [x[0][0], x[0][1]]});
	var cent = d3.polygonCentroid(polygon);
	var rad = 40;

	// big enough for r=50 nodes
	var n = Math.ceil(bbox.width/150)
	var xscale = d3.scaleLinear().domain([0,n]).range([bbox.x+0.1*bbox.width,  bbox.x + bbox.width +0.1*bbox.width])
	var yscale = d3.scaleLinear().domain([0,n]).range([bbox.y+0.1*bbox.height, bbox.y + bbox.height +0.1*bbox.height])
	
	// get the generated points div and add the points as long as they don't over lay the centroid already there.
	var gen = document.getElementById("generated");

	for (var i = 0; i < n; ++i){
		for (var j = 0; j < n; ++j) {
			var point = [xscale(i), yscale(j)]
			// here I am trying to not overly the centroid
			var iscentroid = intersection(point[0], point[1], 30, cent[0], cent[1], 40);
			var contains = d3.polygonContains(polygon, point)

			if (contains === true && iscentroid === false) {
				var c = document.createElementNS("http://www.w3.org/2000/svg", "circle")
				c.setAttributeNS(null, "cx", point[0].toFixed(0))
				c.setAttributeNS(null, "cy", point[1].toFixed(1))
				c.setAttributeNS(null, "r", "10");
				c.setAttributeNS(null, "fill", "black");
				c.setAttributeNS(null, "class", "mapNode");
				c.setAttributeNS(null, "stroke", "white");
				c.setAttributeNS(null, "stroke-width", 2);
				c.setAttributeNS(null, "id", point[0].toFixed(0)+","+point[1].toFixed(1))
				gen.appendChild(c)
				waypoints.push({x: point[0], y: point[1], area: pathelement.getAttributeNS(null,"id"), type: "lattice"})
			}
		}
	}
}


var intersection = function(x0, y0, r0, x1, y1, r1) {
	//http://stackoverflow.com/questions/12219802/a-javascript-function-that-returns-the-x-y-points-of-intersection-between-two-ci/12221389#12221389
    var a, dx, dy, d, h, rx, ry;
    var x2, y2;

    /* dx and dy are the vertical and horizontal distances between
     * the circle centers.
     */
    dx = x1 - x0;
    dy = y1 - y0;

    /* Determine the straight-line distance between the centers. */
    d = Math.sqrt((dy*dy) + (dx*dx));

    /* Check for solvability. */
    if (d > (r0 + r1)) {
        /* no solution. circles do not intersect. */
        return false;
    }
    if (d < Math.abs(r0 - r1)) {
        /* no solution. one circle is contained in the other */
        return false;
    }

    /* 'point 2' is the point where the line through the circle
     * intersection points crosses the line between the circle
     * centers.  
     */

    /* Determine the distance from point 0 to point 2. */
    a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

    /* Determine the coordinates of point 2. */
    x2 = x0 + (dx * a/d);
    y2 = y0 + (dy * a/d);

    /* Determine the distance from point 2 to either of the
     * intersection points.
     */
    h = Math.sqrt((r0*r0) - (a*a));

    /* Now determine the offsets of the intersection points from
     * point 2.
     */
    rx = -dy * (h/d);
    ry = dx * (h/d);

    /* Determine the absolute intersection points. */
    var xi = x2 + rx;
    var xi_prime = x2 - rx;
    var yi = y2 + ry;
    var yi_prime = y2 - ry;

    return [xi, xi_prime, yi, yi_prime];
}

var voronoiHelper = function(waypoints, areaHov) {
	// voronoi polygon for one area
	var ah = areaHov[areaHov.length-1]
	//Make a voronoi object
	var voronoi = d3.voronoi();
	// put in the centroid
	centroidMaker(waypoints, areaHov)

	// all who are in that areas
	var s = waypoints.filter(function(x){if (x.area === ah){ return x}});
	var s2 = s.map(function(d) {return [d.x, d.y]});

	function drawCells(centroids) {
  		centroids
      	.attr("d", function(d) { console.log(d); if (d[0]==null){return null} else {return d == null ? null : "M " + d.join(" L" ) + "Z"; }})
      	.attr("class", "mapLink")
      	.style("fill","none")
      	.attr("stroke","yellow")
      	.attr("stroke-dasharray","5,5")
      	.attr("stroke-width","2")
	}

	var centroids= d3.selectAll("#centroids")
		.selectAll(".centroids")
		.data(voronoi.polygons(s2))
		.enter()
		.append("path")
		.call(drawCells)
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

var centroidMaker = function(waypoints, areaHov) {

	// create a centroid and some surrounding points for areas taht are walkable	
	var v = document.getElementById(areaHov[areaHov.length-1]);
	var s = parsePath(v);
		
	var polygon = s.map(function(x){return [x[0][0], x[0][1]]})
	var centroid = d3.polygonCentroid(polygon);
	
	var ct = document.getElementById("generated");
	circleFactory(ct, centroid[0], centroid[1], "40", "cornflowerblue", "mapNode");

	// create a lattice to represent other possible points in that region
	latticegen(v, waypoints);
	// add centroid to waypoints
	waypoints.push({x: Number(centroid[0].toFixed(0)), y: Number(centroid[1].toFixed(0)), type: 'centroid', area: areaHov[areaHov.length-1]})
}



var delaunayHelper = function(waypoints, areaHov) {
	// draws delaunay Triangles 
	function redrawTriangle(triangle) {
  	triangle
      .attr("d", function(d) { 
      	return "M" + d.join("L") + "Z"; 
      })
      .attr("class", "mapLink")
	}

	function redraw() {
  		var diagram = voronoi(s2);
  		triangle = triangle.data(diagram.triangles()), triangle.exit().remove();
  		triangle = triangle.enter().append("path").merge(triangle).call(redrawTriangle);
  		link = link.data(diagram.links()), link.exit().remove();
  		link = link.enter().append("line").merge(link).call(redrawLink);
  		site = site.data(s2).call(redrawSite);
	}

	function redrawLink(link) {
  	link
      .attr("x1", function(d) { return d.source[0]; })
      .attr("y1", function(d) { return d.source[1]; })
      .attr("x2", function(d) { return d.target[0]; })
      .attr("y2", function(d) { return d.target[1]; })
      .attr("class", "mapLink")
	}
	
	function redrawSite(site) {
  	site
      .attr("cx", function(d) { return d[0]; })
      .attr("cy", function(d) { return d[1]; })
	}

	//Make a voronoi object
	var voronoi = d3.voronoi();
	var aselected = document.getElementById(areaHov[areaHov.length-1]);

	latticegen(aselected, waypoints);

	// all who are in that area -- when the area is opened up in demo this is "open"
	var sa = waypoints.filter(function(x){if (x.area === areaHov[areaHov.length-1]){ return x}});
	
	// all the doors, even those not in that area
	var sd = waypoints.filter(function(x){if ((x.type === "door") && (x.area !== areaHov[areaHov.length-1])){return x}});
	var s = sa.concat(sd);
	
	if (areaHov[areaHov.length-1] === "area-1") {
		// just keep the obstacle out
		var so = waypoints.filter(function(x){if ((x.type === "obstacle") && (x.area ==="temp")){return x}});
		var s = s.concat(so);
	}

	if (areaHov[areaHov.length-1] === "open") {
		var s = waypoints.filter(function(x) {
			if ((x.type !== "corners") && (x.area ==="open")){
				return x}
		});
	}

	var s2 = s.map(function(d) {return [d.x, d.y]});
	var triangle = d3.selectAll("#delaunay")
		.attr("class", "triangles")
		.selectAll(".triangles")
		.data(voronoi.triangles(s2))
		.enter()
		.append("path")
		.call(redrawTriangle)

	var link = d3.select("#voronoi")
		.attr("class", "links")
		.selectAll(".links")
		.data(voronoi.links(s2))
		.enter().append("line")
		.call(redrawLink);
	}

var delaunayLimited = function(waypoints, areaHov) {

	// draws delaunay Triangles - in this case for a more limited set of points
	function redrawTriangle(triangle) {
  	triangle
      .attr("d", function(d) { 
      	return "M" + d.join("L") + "Z"; 
      })
      .attr("class", "mapTriangle")
	}

	function redraw() {
  		var diagram = voronoi(s2);
  		triangle = triangle.data(diagram.triangles()), triangle.exit().remove();
  		triangle = triangle.enter().append("path").merge(triangle).call(redrawTriangle);
  		link = link.data(diagram.links()), link.exit().remove();
  		link = link.enter().append("line").merge(link).call(redrawLink);
  		site = site.data(s2).call(redrawSite);
	}

	function redrawLink(link) {
  	link
      .attr("x1", function(d) { return d.source[0]; })
      .attr("y1", function(d) { return d.source[1]; })
      .attr("x2", function(d) { return d.target[0]; })
      .attr("y2", function(d) { return d.target[1]; })
      .attr("class", "mapLink")
	}
	
	function redrawSite(site) {
  	site
      .attr("cx", function(d) { return d[0]; })
      .attr("cy", function(d) { return d[1]; })
	}
	var voronoi = d3.voronoi();
	var aselected = document.getElementById(areaHov[areaHov.length-1]);

	// var p = document.getElementById("main-outline");
	// var pnodes = parsePath(p);

	// all who are in that area -- when the area is opened up in demo this is "open"
	var sa = waypoints.filter(function(x){if ((x.area === areaHov[areaHov.length-1]) && ((x.type==="poi") || (x.type==="door"))){ return x}});
	// all the doors, even those not in that area
	var sd = waypoints.filter(function(x){if (x.type === "door"){return x}});
	var s = sa.concat(sd);
	
	if (areaHov[areaHov.length-1] === "area-1") {
		// just keep the obstacle out
		var so = waypoints.filter(function(x){if ((x.type === "obstacle") && (x.area ==="temp")){return x}});
		var s = s.concat(so);
	}

	// if (areaHov[areaHov.length-1] === "open") {
	// 	var s = waypoints.filter(function(x) {
	// 		if ((x.type !== "corners") && (x.area ==="open")){
	// 			return x
	// 		}
	// 	});
	// }
	var s2 = s.map(function(d) {return [d.x, d.y]});	
	var triangle = d3.selectAll("#delaunay")
		.attr("class", "triangles")
		.selectAll(".triangles")
		.data(voronoi.triangles(s2))
		.enter()
		.append("path")
		.call(redrawTriangle)

	var link = d3.select("#voronoi")
		.attr("class", "links")
		.selectAll(".links")
		.data(voronoi.links(s2))
		.enter().append("line")
		.call(redrawLink);
	
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

		var walkable = mo.classList.contains("walkable");

		if (walkable === true) {
			polys.push({'polygon': polygonIn, 'area': thisArea, 'id': id, 'walkable': 1});
		} else {
			polys.push({'polygon': polygonIn, 'area': thisArea, 'id': id, 'walkable': 0});
		}

		// determine the corners of that area and draw them
		var corners = parsePath(mo);
		var fc = "cornflowerblue";

		var othercorners = document.getElementById("corners");
		var occhildren = othercorners.children;
		console.log(occhildren);

		for (var ii = 0; ii < corners.length; ++ii) {
			circleFactory(c, corners[ii][0][0], corners[ii][0][1], "30", fc, "mapNode")
			var waypoint = waypointFactory(corners[ii][0][0], corners[ii][0][1], "areas", "open")
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

    	// if you're not over a subclass you're over a main class
    	mo.addEventListener("mouseover", function(evt) {
    		evt.stopPropagation();
			//evt.target.parentNode.children[1].setAttributeNS(null, "class", "hidden-details");
			areaHov.push("open");
		});
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
			circleFactory(c, corners[ii][0][0], corners[ii][0][1], "30", fc, "mapNode")
			var waypoint = waypointFactory(corners[ii][0][0], corners[ii][0][1], "corners", id)
			waypoints.push(waypoint)
		}
		
		if ((areas.children[i].children[0].getAttributeNS(null, "class") === "areas walkable") || (areas.children[i].children[0].getAttributeNS(null, "class") === "areas not-walkable")) {
			
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
				
				areaHov.push(evt.target.parentNode.children[0].getAttributeNS(null, "id"));
			});

			// hide them on mouse out, set the hovered area to "open". if you go right into another area, it will get set to that name, otherwise, it will be open
			areas.children[i].addEventListener("mouseout", function(evt) {
				evt.target.parentNode.children[1].setAttributeNS(null, "class", "hidden-details");
				areaHov.push("open");
			});
		}
	}
	mainOutlineHelper(null, polys);
}

var simplePolygonHelper = function(path, polys) {
	// computes the area and makes display settings of a newly drawn polygon
	var conversionFactor = 0.0004;
	var polygonIn = polygonSampledFromPath(path, 1000);
	var thisArea = polyArea(polygonIn);

	var counter = document.getElementById("areas").children.length
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
	
	path.parentNode.appendChild(t);

	path.parentNode.addEventListener("mouseover", function(evt) {
		evt.target.parentNode.children[1].setAttributeNS(null, "class", "details");
		areaHov.push(path.getAttributeNS(null, "id"));
		console.log(areaHovareaHov[areaHov.length-1]);
	});

	path.parentNode.addEventListener("mouseout", function(evt) {
		evt.target.parentNode.children[1].setAttributeNS(null, "class", "hidden-details");
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


