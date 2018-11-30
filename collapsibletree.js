var margin={top: 120, right: 20, bottom: 120, left: 20},
	width=1000 - margin.right - margin.left,
	height=800 - margin.top - margin.bottom;

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

var i=0,
	duration=750,
	root;

var tree=d3.layout.tree()
	.size([width, height]);

var diagonal=d3.svg.diagonal()		// function that will be used to draw the links between the nodes
	.projection(function(d) { return [d.x, d.y]; });

var tip = d3.tip()		// initialise d3 tooltip
	.attr('class', 'd3-tip')
	.direction('ne')
	.html(function(d) { return d.visible_name + "<br>" + d.value;})

var svg=d3.select("body")
	.append("svg")
	.attr("width", width + margin.right + margin.left)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")		// creates a group element that will contain all objects within the SVG
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.call(tip);		// invoke the tip in the context of viz

d3.json("treeDataflat_characteristics.json", function(error, json) {
	// turn flat data into hierarchical data, required by tree
	var dataMap = json.reduce(function(map, node) {
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

	root.x0=height/2		// i.e. middle of the svg, taking into account svg margin
	root.y0=0		// i.e. top of the svg, taking into account svg margin

	draw(root);
});

d3.select(self.frameElement).style("height", "500px");

function draw(source) {		// function to draw nodes and links - either used on the entire dataset, or data relating to a particular node that has been clicked on
	var nodes=tree.nodes(root).reverse(),		// define nodes using previously defined tree function
		links=tree.links(nodes);		// define links based on newly defined nodes using previously defined tree function

	nodes.forEach(function(d) { d.y=d.depth * 100; });		// set node depth

	//	define function that adds each node that is required
	var node = svg.selectAll("g.node")
		.data(nodes, function(d) { return d.id || (d.id = ++i); });

	var nodeEnter=node.enter()		// joins data to elements
		.append("g")		// appended as a group
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
		.on("click", toggleDescendants);	// passes details of node to click function

	nodeEnter.append("circle")		// add a circle in each node g we have added
		.attr("r", 1e-6)
		.style("stroke", function(d) { return colorLookup[Math.floor(Math.random()*10+1)] })
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide)
		.on("click", toggleDescendants);	// passes details of node to click function

	nodeEnter.append("text")		// add label text in each node g we have added. If a node has children, text is positioned to the left of the node, anchored at the end of the text; if a node has no children, text is positioned to the right of the node, anchored at the start of the text
		.attr("x", function(d) { return (d.value + 4) * -1 })
		.attr("dy", ".35em")		// bumps the text down to align with the centre of each node
		.attr("text-anchor", "end")
		.text(function(d) {
			if (d.depth<3){
				return d.visible_name;
			}})
		.style("fill-opacity", 1e-6);

	var nodeUpdate = node.transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	nodeUpdate.select("circle")
		.attr("r", function(d) { return d.value; })
		.attr("class", function(d) {
			if (d._children) {		// d._children is temp variable used to hold d.children value
				return "filled";
			} else {
				return "unfilled";
			}
		});

	nodeUpdate.select("text")
		.style("fill-opacity", 1);

	var nodeExit = node.exit().transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
		.remove();

	nodeExit.select("circle")
		.attr("r", 1e-6);

	nodeExit.select("text")
	  .style("fill-opacity", 1e-6);

	// define function that adds each link that is required
	var link = svg.selectAll("path.link")
		.data(links, function(d) { return d.target.id; });

	// Enter any new links at the parent's previous position.
	link.enter().insert("path", "g")
		.attr("class", "link")
		.attr("d", function(d) {
		var o = {x: source.x0, y: source.y0};
			return diagonal({source: o, target: o});
		});

	// Transition links to their new position.
	link.transition()
		.duration(duration)
		.attr("d", diagonal);

	// Transition exiting nodes to the parent's new position.
	link.exit().transition()
		.duration(duration)
		.attr("d", function(d) {
			var o = {x: source.x, y: source.y};
			return diagonal({source: o, target: o});
		})
		.remove();

	nodes.forEach(function(d) {		// stash the old positions for transition.
		d.x0 = d.x;
		d.y0 = d.y;
	});

};

function toggleDescendants(d) {
	if (d.children) {
		collapseDescendants(d);
	} else {
		d.children = d._children;				// d._children is a temp variable to hold d.children value		// d._children is a temp variable to hold d.children value
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
	if (d.children) {
		d.children.forEach(function(e){
			expandDescendants(e)
		});
	}
	else if (d._children) {
		d._children.forEach(function(e){
			expandDescendants(e)
		});
		d.children = d._children;
		d._children = null;
	};
}

function expandAll() {
	expandDescendants(root);
	draw(root);
}
