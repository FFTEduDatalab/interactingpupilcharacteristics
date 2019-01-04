var margin={top: 120, right: 20, bottom: 120, left: 20},
	width=1000 - margin.right - margin.left,
	height=800 - margin.top - margin.bottom;

var loaded=0,
	i=0,
	duration=1250,
	root;

var colorLookup=[
	(1, "rgb(230,0,126)"),
	(2, "rgb(213,15,135)"),
	(3, "rgb(196,31,144)"),
	(4, "rgb(180,46,153)"),
	(5, "rgb(163,62,162)"),
	(6, "rgb(146,77,171)"),
	(7, "rgb(129,93,180)"),
	(8, "rgb(112,108,189)"),
	(9, "rgb(95,124,198)"),
	(10, "rgb(79,139,207)"),
	(11, "rgb(62,155,216)"),
	(12, "rgb(45,170,225)")
]

titleHeaders={
	"ks2att":"Primary attainment by pupil characteristics",
	"ks2prog":"Primary progress by pupil characteristics",
	"ks4att":"Secondary attainment by pupil characteristics",
	"ks4prog":"Secondary progress by pupil characteristics"
}

titleSubheads={
	"ks2att":"Reaching the expected standard in KS2 reading, writing and maths, 2017",
	"ks2prog":"Average combined progress in KS2 reading, writing and maths, 2017",
	"ks4att":"Attainment 8 score, 2017",
	"ks4prog":"Progress 8 score, 2017"
}

var tree=d3.layout.tree()
	.size([width, height]);

var diagonal=d3.svg.diagonal()		// function that will be used to draw the links between the nodes
	.projection(function(d) { return [d.x, d.y]; });

var tip = d3.tip()		// initialise d3 tooltip
	.attr('class', 'd3-tip')
	.direction('ne')
	.html(function(d) { return d.visible_name + "<br>" + d.pupils.toLocaleString() + " pupils" + "<br>" + d.value + "%";})

var svg=d3.select("body")
	.append("svg")
	.attr("width", width + margin.right + margin.left)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")		// creates a group element that will contain all objects within the SVG
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("text")
	.attr("class", "title header")
	.attr("id", "title")
	.attr("text-anchor", "middle")
	.attr("x", width/2)
	.attr("y", -90)
	.text(titleHeaders["ks2att"]);

svg.append("text")
	.attr("class", "title")
	.attr("text-anchor", "middle")
	.attr("x", width/2)
	.attr("y", -70)
	.text(titleSubheads["ks2att"]);

svg.append("text")
	.attr("class", "notes header")
	.attr("y", height + margin.bottom - 40)
	.text("Notes");

svg.append("text")
	.attr("class", "notes")
	.attr("y", height + margin.bottom - 30)
	.text("Pupils in state-funded establishments.");

svg.append("text")
	.attr("class", "notes")
	.attr("y", height + margin.bottom - 20)
	.text("*Pupil subgroups are only shown when both subgroups consist of at least 10 pupils.");

svg.append("text")
	.attr("class", "notes")
	.attr("y", height + margin.bottom - 10)
	.text("Source: FFT Education Datalab analysis of the National Pupil Database");

svg.append("image")
	.attr("href", "fft_education_datalab_logo_lo.png")
	.attr("x", width + margin.right - 180 - 20)
	.attr("y", height + margin.bottom - 45 - 10)
	.attr("height", "45px")
	.attr("width", "180px");

svg.call(tip);		// invoke the tip in the context of viz

function loadDataset(value) {
	loaded = 0

	var jsonFile = "ks4att.json"
	// var jsonFile = "treeDataflat_characteristics_" + value + ".json"
	d3.json(jsonFile, function(error, json) {
		var dataMap = json.reduce(function(map, node) {		// turn flat data into hierarchical data, required by tree
			map[node.name] = node;
			return map;
		}, {});

		var treeData = [];

		json.forEach(function(node) {
			var parent = dataMap[node.parent];
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
			.attr("text-anchor", "middle")
			.attr("x", width/2)
			.attr("y", -90)
			.text(titleHeaders[value]);

		svg.append("text")
			.attr("class", "title")
			.attr("text-anchor", "middle")
			.attr("x", width/2)
			.attr("y", -70)
			.text(titleSubheads[value]);

		draw(root);
	});
}

loadDataset("ks2att")

d3.select(self.frameElement).style("height", "500px");

function draw(source) {		// function to draw nodes and links - either used on the entire dataset, or data relating to a particular node that has been clicked on

	if (loaded==0) {		// start tree off collapsed
		collapseDescendants(root);
	}

	var nodes=tree.nodes(root).reverse(),		// define nodes using previously defined tree function
		links=tree.links(nodes);		// define links based on newly defined nodes using previously defined tree function

	nodes.forEach(function(d) { d.y=d.depth * 100; });		// set node depth

	var node = svg.selectAll("g.node")		//	define function that adds each node that is required
		.data(nodes, function(d) { return d.id || (d.id = ++i); });

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
			}
		});

	nodeStart.append("circle")		// add a circle in each node g we have added
		.attr("r", 1e-6)
		.style("stroke", function(d) { return colorLookup[Math.floor(Math.random()*10+1)] })
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide)
		.on("click", toggleDescendants);	// passes details of node to click function

	nodeStart.append("text")		// add label text in each node g we have added. If a node has children, text is positioned to the left of the node, anchored at the end of the text; if a node has no children, text is positioned to the right of the node, anchored at the start of the text
		.text(function(d) {
			if (d.depth<3){
				return d.visible_name;
			}})
		.attr("x", function(d) {
			if (d.depth==0) {
				return (30+4)*-1;
			}
			else if (d.depth==1) {
				return (20+4)*-1;
			}
			else if (d.depth==2) {
				return (10+4)*-1;
			}
			else if (d.depth>2) {
				return (5+4)*-1;
			}
		})
		.attr("dy", ".35em")		// bumps the text down to align with the centre of each node
		.attr("text-anchor", "end")
		.style("fill-opacity", 1e-6);

	var nodePositioned = node.transition()
		.duration(function() {
			if (loaded==0) {
				return 0;		// no transition on initial load
			}
			else {
				return duration;
			}
		})
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });		// new position of each node

	nodePositioned.select("circle")
		.attr("r", function(d) {
			if (d.depth==0) {
				return 30;
			}
			else if (d.depth==1) {
				return 20;
			}
			else if (d.depth==2) {
				return 10;
			}
			else if (d.depth>2) {
				return 5;
			}
		})
		.attr("class", function(d) {
			if (d._children) {		// see defn below
				return "filled";
			} else {
				return "unfilled";
			}
		});

	nodePositioned.select("text")
		.style("fill-opacity", 1);

	var nodeRemoved = node.exit().transition()
		.duration(function() {
			if (loaded==0) {
				return 0;		// no transition on initial load
			}
			else {
				return duration;
			}
		})
		.attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })		// new position of active node
		.remove();

	nodeRemoved.select("circle")
		.attr("r", 1e-6);

	nodeRemoved.select("text")
		.style("fill-opacity", 1e-6);

	var link = svg.selectAll("path.link")		// define function that adds each link that is required
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

	link.exit().transition()
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
