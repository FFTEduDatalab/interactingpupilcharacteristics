var margin={top: 120, right: 140, bottom: 120, left: 20},
	width=1140 - margin.right - margin.left,
	height=730 - margin.top - margin.bottom;

var loaded=0,
	i=0,
	clickCount=0,
	buckets,
	bucketWidth,
	duration=1250,
	requiredSpacing={},
	minSpacing={},
	root;

var buckets={
	"ks4att":7,
	"ks4prog":9,
	"ks4basics":7
}

var bucketWidths={
	"ks4att":5,
	"ks4prog":0.2,
	"ks4basics":10
}

var radiuses={
	0:30,
	1:20,
	2:10,
	3:5,
	4:5,
	5:5
}

var colorLookup={
	7:[
		"rgb(230,0,126)",
		"rgb(199,28,143)",
		"rgb(168,57,159)",
		"rgb(138,85,176)",
		"rgb(107,113,192)",
		"rgb(76,142,209)",
		"rgb(45,170,225)"
	],
	9:[
		"rgb(230,0,126)",
		"rgb(207,21,138)",
		"rgb(184,43,151)",
		"rgb(161,64,163)",
		"rgb(138,85,176)",
		"rgb(114,106,188)",
		"rgb(91,128,200)",
		"rgb(68,149,213)",
		"rgb(45,170,225)"
	]
}

var titleSubheads={
	"ks2att":"Pupils reaching the expected standard in KS2 reading, writing and maths, 2017 (%)",
	"ks2prog":"Average combined pupil progress score in KS2 reading, writing and maths, 2017",
	"ks4att":"Average pupil Attainment 8 score, 2017",
	"ks4prog":"Average pupil Progress 8 score, 2017",
	"ks4basics":"Pupils achieving a standard pass or better (grade 4+) in English and maths GCSEs, 2017 (%)"
}

var prim=
	'<input type="radio" id="measure_2" name="switch2" value="ks2prog" onchange="loadDataset(value)"/>\
	<label for="measure_2">KS2 progress</label>\
	<input type="radio" id="measure_1" name="switch2" value="ks2att" onchange="loadDataset(value)" checked/>\
	<label for="measure_1">KS2 attainment</label>'

var sec=
	'<input type="radio" id="measure_3" name="measure-switch" value="ks4prog" onchange="loadDataset(value)"/>\
	<label for="measure_3">Progress 8</label>\
	<input type="radio" id="measure_2" name="measure-switch" value="ks4att" onchange="loadDataset(value)"/>\
	<label for="measure_2">Attainment 8</label>\
	<input type="radio" id="measure_1" name="measure-switch" value="ks4basics" onchange="loadDataset(value)" checked/>\
	<label for="measure_1">Basics</label>'

function updateControls(value) {
	if (value=='primary') {
		return document.getElementById("measureControls").innerHTML=prim;
	}
	else if (value=='secondary') {
		return document.getElementById("measureControls").innerHTML=sec;
	}
}

updateControls('primary')

var tree=d3.layout.tree()
	.size([width, height]);

var diagonal=d3.svg.diagonal()		// function that will be used to draw the links between the nodes
	.projection(function(d) { return [d.x, d.y]; });

var tip=d3.tip()		// initialise d3 tooltip
	.attr('class', 'd3-tip')
	.direction(function(d) {
		if (d.x>=width-260) {
			return 'nw'
		}
		else if (d.y==0) {
			return 'se'
		}
		else {
			return 'ne'
		}
	});

var svg=d3.select(".vis")
	.append("svg")
	.attr("width", width + margin.right + margin.left)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")		// creates a group element that will contain all objects within the SVG
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var quantize=d3.scale.quantize()		// domain and range are set as part of loading dataset

svg.append("g")
	.attr("class", "legendQuant")
	.attr("transform", "translate(" + width + ",-30)");		// for alignment with the top of first node (r=30)

var legend=d3.legend.color()
	.shapeWidth(30)
	.orient('vertical')
	.scale(quantize);

svg.append("g")
	.attr("class", "button")
	.append("rect")
	.attr("transform", "translate(0,-30)")		// for alignment with the top of first node (r=30)
	.attr("width", 80)
	.attr("height", 23)
	.attr('rx', 4)
	.attr('ry', 4)
	.attr("visibility","hidden")
	.on('click', function() {
		expandAll();
	});

svg.select("g.button")
	.append("text")
	.text("Expand all")
	.attr("transform", "translate(8,-13)")		// for alignment with the top of first node (r=30)
	.attr("visibility","hidden")
	.on('click', function() {
		expandAll();
	});

svg.append("text")
	.attr("class", "title header")
	.attr("id", "title")
	.attr("text-anchor", "start")
	.attr("x", 0)
	.attr("y", -90);

svg.append("text")
	.attr("class", "title")
	.attr("text-anchor", "start")
	.attr("x", 0)
	.attr("y", -70);

svg.append("text")
	.attr("class", "notes header")
	.attr("y", height + margin.bottom - 40)
	.text("Notes");

svg.append("text")
	.attr("class", "notes")
	.attr("y", height + margin.bottom - 30)
	.text("Pupils in state-funded establishments. Coastal is defined as attending a school with 5.5km of the coast.");

svg.append("text")
	.attr("class", "notes")
	.attr("y", height + margin.bottom - 20)
	.text("*Pupil subgroups are only shown when both subgroups consist of at least 10 pupils.");

svg.append("text")
	.attr("class", "notes")
	.attr("y", height + margin.bottom - 10)
	.text("Source: FFT Education Datalab analysis of the National Pupil Database.");

svg.append("a")
	.attr("href", "interactingpupilcharacteristics.xlsx")
	.attr("target","blank")			// fends off error relating to downloading
	.append("text")
	.attr("class", "notes url")
	.attr("x", 312)
	.attr("y", height + margin.bottom - 10)
	.attr("href", "interactingpupilcharacteristics.xlsx")
	.text("Download the data");

svg.append("a")
	.attr("href", "https://ffteducationdatalab.org.uk")
	.append("image")
	.attr("href", "fft_education_datalab_logo_lo.png")
	.attr("x", width + margin.right - 180 - 20)
	.attr("y", height + margin.bottom - 45 - 10)
	.attr("height", "45px")
	.attr("width", "180px");

svg.call(tip);		// invoke the tip in the context of viz

function loadDataset(value) {
	loaded=0
	var jsonFile=value + ".json"

	d3.json(jsonFile, function(error, json) {

		bucketWidth=bucketWidths[value]

		quantize.domain([Math.floor(d3.min(json, function(d) { return d.value; })/bucketWidth)*bucketWidth,Math.ceil(d3.max(json, function(d) { return d.value; })/bucketWidth)*bucketWidth])
			.range(colorLookup[buckets[value]]);
			// .range(d3.quantize(d3.interpolate("rgb(230,0,126)", "rgb(45,170,225)"), buckets[value]))		// d3 v4. See https://github.com/d3/d3-interpolate#quantize

		legend.labelFormat(function(d) {
			if (value=="ks4basics") {
				return d3.format(".0f")(d) + "%";
			}
			else {
				return d3.format(".1f")(d);
			}
		})

		svg.select(".legendQuant")
			.call(legend);

		tip.html(function(d) {
			if (value=='ks4basics' && d.name=='all') {
				return "<p class='tooltip-header'>" + d.header + "</p><p>A total of " + d.value + "% of <b>pupils nationally</b> achieved the basics measure in 2017." + "</p><p class='tooltip-pupils'>" + d.pupils.toLocaleString() + " pupils</p>"
			}
			else if (value=='ks4basics' && d.name!='all') {
				return "<p class='tooltip-header'>" + d.header + "</p><p>A total of " + d.value + "% of <b>" + d.tooltipText + "</b> achieved the basics measure in 2017." + "</p><p class='tooltip-pupils'>" + d.pupils.toLocaleString() + " pupils</p>"
			}
			else if (value=='ks4att' && d.name=='all') {
				return "<p class='tooltip-header'>" + d.header + "</p><p><b>Nationally</b>, pupils achieved an average Attainment 8 score of " + d.value + " in 2017." + "</p><p class='tooltip-pupils'>" + d.pupils.toLocaleString() + " pupils</p>"
			}
			else if (value=='ks4att' && d.name!='all') {
				return "<p class='tooltip-header'>" + d.header + "</p><p><b>" + d.tooltipText + "</b> achieved an average Attainment 8 score of " + d.value + " in 2017." + "</p><p class='tooltip-pupils'>" + d.pupils.toLocaleString() + " pupils</p>"
			}
			else if (value=='ks4prog' && d.name=='all') {
				return "<p class='tooltip-header'>" + d.header + "</p><p><b>Nationally</b>, pupils achieved an average Progress 8 score of " + d.value + " in 2017." + "</p><p class='tooltip-pupils'>" + d.pupils.toLocaleString() + " pupils</p>"
			}
			else if (value=='ks4prog' && d.name!='all') {
				return "<p class='tooltip-header'>" + d.header + "</p><p><b>" + d.tooltipText + "</b> achieved an average Progress 8 score of " + d.value + " in 2017." + "</p><p class='tooltip-pupils'>" + d.pupils.toLocaleString() + " pupils</p>"
			}
		});

		var dataMap=json.reduce(function(map, node) {		// turn flat data into hierarchical data, required by tree
			map[node.name] = node;
			return map;
		}, {});

		var treeData=[];

		json.forEach(function(node) {
			var parent=dataMap[node.parent];
			if (parent) {
				(parent.children || (parent.children = []))
				.push(node);
			} else {
				treeData.push(node);
			}
		});

		root=treeData[0]

		root.x0=width/2		// i.e. middle of the svg, taking into account svg margin
		root.y0=0		// i.e. top of the svg, taking into account svg margin

		d3.selectAll(".title").remove()

		svg.append("text")
			.attr("class", "title header")
			.attr("id", "title")
			.attr("text-anchor", "start")
			.attr("x", 0)
			.attr("y", -90)
			.text('How pupil characteristics interact to influence educational attainment and progress');

		svg.append("text")
			.attr("class", "title")
			.attr("text-anchor", "start")
			.attr("x", 0)
			.attr("y", -70)
			.text(titleSubheads[value]);

		draw(root);
	});
}

loadDataset("ks4basics")

d3.select(self.frameElement).style("height", "500px");

function draw(source) {		// function to draw nodes and links - either used on the entire dataset, or data relating to a particular node that has been clicked on

	if (loaded==0) {		// start tree off collapsed
		collapseDescendants(root);
	}

	var nodes=tree.nodes(root).reverse(),		// define nodes using previously defined tree function
		links=tree.links(nodes);		// define links based on newly defined nodes using previously defined tree function

	nodes.forEach(function(d) { d.y=d.depth * 100; });		// set node depth

	var node=svg.selectAll("g.node")		//	define function that adds each node that is required
		.data(nodes, function(d) {
			return d.id || (d.id = ++i);
		});

	var nodeStart=node.enter()		// joins data to elements
		.append("g")		// appended as a group
		.attr("class", "node")
		.classed("nochild", function(d) {		// conditionally adds an additional class (.attr can't be used to add additional classes)
			return !d.children && !d._children;		// see defn below
		})
		.attr("transform", function(d) {
			if (source.xf!=null) {		// where expand all button is used, the position which nodes are in before the expansion starts are used as the starting point
				return "translate(" + source.xf + "," + source.yf + ")";
 			}
			else {
				return "translate(" + source.x0 + "," + source.y0 + ")";
			};
		});

	nodeStart.append("circle")		// add a circle in each node g we have added
		.attr("r", 1e-6)
		.style("stroke", function(d) {
			return quantize(d.value)
		})
		.style("fill", function(d) {
			return quantize(d.value)
		})
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide)
		.on("click", toggleDescendants);	// passes details of node to click function

	nodeStart.append("text")		// add label text in each node g we have added. If a node has children, text is positioned to the left of the node, anchored at the end of the text; if a node has no children, text is positioned to the right of the node, anchored at the start of the text
		.attr("class", "nodeLabel")
		.attr("data-depth", function(d) {				// text labels don't have d.depth, so data-depth is added so that depth can be accessed when working with text labels
			return d.depth;
		})
		.text(function(d) {
			return d.header[0].toUpperCase() + d.header.slice(1);		// svg css has no first-child pseudo-class, therefore best to do this way
		})
		.attr("x", function(d) {
			if (d.position=='left') {
				return -1*(radiuses[d.depth]+4);
			}
			else if (d.position=='right') {
				return (radiuses[d.depth]+4);
			}
		})
		.attr("dy", ".35em")		// bumps the text down to align with the centre of each node
		.attr("text-anchor", function(d) {
			if (d.position=='left') {
				return "end";
			}
			else if (d.position=='right') {
				return "start";
			}
		})
		.style("fill-opacity", 1e-6);

	var labels=d3.selectAll("text.nodeLabel")[0]		// selects the actual text elements

	requiredSpacing={}

	labels.forEach(function(d) {
		if (requiredSpacing[d.getAttribute("data-depth")]==null) {
			requiredSpacing[d.getAttribute("data-depth")]=Math.ceil(d.getComputedTextLength()/5)*5;
		}
		else if ((Math.ceil(d.getComputedTextLength()/5)*5)>requiredSpacing[d.getAttribute("data-depth")]) {
			requiredSpacing[d.getAttribute("data-depth")]=(Math.ceil(d.getComputedTextLength()/5)*5);
		}
	});

	minSpacing={}

	nodes.forEach(function(d) {
		nodes.forEach(function(e) {
			if ((d.depth==e.depth && d.parent!=e.parent && d.position!=e.position) || (d.depth==e.depth && d.parent==e.parent && d.position==e.position && d.id!=e.id)) {		// if labels are positioned on the same side or they share a parent they won't crash into one another, unless a node has more than one sibling in which case they can
				if (minSpacing[d.depth]==null) {
					minSpacing[d.depth]=Math.round(Math.abs(d.x-e.x));
				}
				else if (Math.abs(d.x-e.x)<minSpacing[d.depth]) {
					minSpacing[d.depth]=Math.round(Math.abs(d.x-e.x));
				}
			}
		})
	});

	var nodePositioned=node.transition()
		.duration(function() {
			if (loaded==0) {
				return 0;		// no transition on initial load
			}
			else {
				return duration;
			}
		})
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";				// new position of each node
		});

	nodePositioned.select("circle")
		.attr("r", function(d) {
			return radiuses[d.depth];
		})
		.attr("class", function(d) {
			if (d._children) {		// see defn below
				return "filled";
			} else {
				return "unfilled";
			}
		});

	nodePositioned.select("text")
		.style("fill-opacity", function(d) {		// this changes the behaviour of nodePositioned from what it started out as - meaning that for node text (only) it handles removal as well as addition
			if (minSpacing[d.depth]<requiredSpacing[d.depth]*2 || (d.position=='left' && Math.ceil(d.x/5)*5-radiuses[d.depth]-requiredSpacing[d.depth]<margin.left) || (d.depth==1 && d.position=='right' && Math.ceil(d.x/5)*5+radiuses[d.depth]+requiredSpacing[d.depth]>width)) {		// on the RHS, the wider margin means only the first tier is at risk of crashing into something
				return 1e-6;
			}
			else {
				return 1;
			}
		})
		.attr("class", function(d) {
			if (minSpacing[d.depth]<requiredSpacing[d.depth]*2 || (d.position=='left' && Math.ceil(d.x/5)*5-radiuses[d.depth]-requiredSpacing[d.depth]<margin.left) || (d.depth==1 && d.position=='right' && Math.ceil(d.x/5)*5+radiuses[d.depth]+requiredSpacing[d.depth]>width)) {
				return "nodeLabel nonselectable";				// done in hacky fashion because classed wasn't working here
			}
			else {
				return "nodeLabel";
			}
		});

	var nodeRemoved=node.exit()
		.transition()
		.duration(function() {
			if (loaded==0) {
				return 0;		// no transition on initial load
			}
			else {
				return duration;
			}
		})
		.attr("transform", function(d) {
			return "translate(" + source.x + "," + source.y + ")";				// new position of active node
		})
		.remove();

	nodeRemoved.select("circle")
		.attr("r", 1e-6);

	nodeRemoved.select("text")
		.style("fill-opacity", 1e-6);

	var link=svg.selectAll("path.link")		// define function that adds each link that is required
		.data(links, function(d) { return d.target.id; });

	link.enter()
		.insert("path", "g")
		.attr("class", "link")
		.attr("d", function(d) {
			if (source.xf!=null) {		// where expand all button is used, the position which nodes are in before the expansion starts are used as the starting point
				var o = {x: source.xf, y: source.yf};
				return diagonal({source: o, target: o});
 			}
			else {
				var o = {x: source.x0, y: source.y0};
				return diagonal({source: o, target: o});
			}
		});

	link.transition()
		.duration(function() {
			if (loaded==0) {
				return 0;		// no transition on initial load
			}
			else {
				return duration;
			}
		})
		.attr("d", diagonal);

	link.exit()
		.transition()
		.duration(function() {
			if (loaded==0) {
				return 0;		// no transition on initial load
			}
			else {
				return duration;
			}
		})
		.attr("d", function(d) {
			var o = {x: source.x, y: source.y};		// new position of active node
			return diagonal({source: o, target: o});
		})
		.remove();

	nodes.forEach(function(d) {
		d.x0 = d.x;		// stash current position of nodes for subsequent use
		d.y0 = d.y;
	});

	loaded=1
};

function toggleDescendants(d) {
	clickCount+=1
	if (clickCount>=-1) {		// XXX
	// if (clickCount>=5) {
		svg.selectAll(".button").selectAll("*")
			.attr("visibility","visible")
	}

	if (d.children) {
		collapseDescendants(d);
	}
	else {
		d.children = d._children;				// d._children is a temp variable to hold d.children value when node is collapsed
		d._children = null;
	}
	draw(d);
};

function collapseDescendants(d) {
	if (d.children) {
		d.children.forEach(function(e){
			collapseDescendants(e)
		});
		d._children = d.children;
		d.children = null;
	};
}

function expandDescendants(d) {
	if (d._children) {
		d._children.forEach(function(e){
			expandDescendants(e)
		});
		d.children = d._children;
		d._children = null
		draw(d);
	}
	else if (d.children) {
		d.children.forEach(function(e){
			expandDescendants(e)
		});
	};
}

function stashPosition(d) {		// used to stash the position of nodes before the expansion is drawn - so that e.g. right hand nodes aren't drawn from a position after left hand nodes have already been drawn
	if (d.children) {
		d.children.forEach(function(e){
			stashPosition(e)
			e.xf = e.x;
			e.yf = e.y;
		});
	};
}

function clearPosition(d) {
	if (d.children) {
		d.children.forEach(function(e){
			clearPosition(e)
			d.xf = null;
			d.yf = null;
		});
	};
}

function expandAll() {
	stashPosition(root);
	expandDescendants(root);
	clearPosition(root);
}
