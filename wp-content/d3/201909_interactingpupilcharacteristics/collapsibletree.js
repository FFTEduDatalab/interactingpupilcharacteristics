var margin = {top: 120, right: 140, bottom: 120, left: 20},
	width = 1140 - margin.right - margin.left,
	height = 730 - margin.top - margin.bottom;

var loaded = 0,
	i = 0,
	clickCount = 0,
	buckets,
	bucketWidth,
	duration = 1250,
	requiredSpacing = {},
	minSpacing = {},
	root;

var buckets = {
	'ks2att': 7,
	'ks2readprog': 5,
	'ks2writprog': 6,
	'ks2matprog': 9,
	'ks4basics': 7,
	'ks4att': 5,
	'ks4prog': 6
};

var bucketWidths = {
	'ks2att': 0.1,
	'ks2readprog': 1,
	'ks2writprog': 1,
	'ks2matprog': 1,
	'ks4basics': 0.1,
	'ks4att': 10,
	'ks4prog': 0.5
};

var radiuses = {
	0: 30,
	1: 20,
	2: 10,
	3: 5,
	4: 3,
	5: 2.5
};

var titleSubheads = {
	'ks2att': 'Pupils reaching the expected standard in KS2 reading, writing and maths, 2018 (%)',
	'ks2readprog': 'Average pupil progress score in KS2 reading, 2018',
	'ks2writprog': 'Average pupil progress score in KS2 writing, 2018',
	'ks2matprog': 'Average pupil progress score in KS2 maths, 2018',
	'ks4att': 'Average pupil Attainment 8 score, 2018',
	'ks4prog': 'Average pupil Progress 8 score, 2018',
	'ks4basics': 'Pupils achieving a standard pass or better (grade 4+) in English and maths GCSEs, 2018 (%)'
};

var helpTooltips = {
	'ks2att': "This metric measures the proportion of pupils reaching the government's expected standard in reading, writing and maths at age 11.",
	'ks2readprog': 'This metric measures the progress made by pupils in reading between the ages of seven and 11.',
	'ks2writprog': 'This metric measures the progress made by pupils in writing between the ages of seven and 11.',
	'ks2matprog': 'This metric measures the progress made by pupils in maths between the ages of seven and 11.',
	'ks4att': 'Attainment 8 is one of the government’s headline accountability measures for secondary schools. It measures pupils’ attainment across eight subjects.',
	'ks4prog': 'Progress 8 is one of the government’s headline accountability measures for secondary schools. It measures the progress that pupils make between the ages of 11 and 16, comparing pupils’ attainment across eight subjects with that of other pupils who had the same attainment at age 11.',
	'ks4basics': 'Basics measures the proportion of pupils achieving a standard pass or better (grade 4+) in English and maths GCSEs.'
};

var prim =
'<input type="radio" id="measure_4" name="measure-switch" value="ks2matprog" onchange="loadDataset(value)"/>\
	<label for="measure_4">Maths progress</label>\
	<input type="radio" id="measure_3" name="measure-switch" value="ks2writprog" onchange="loadDataset(value)"/>\
	<label for="measure_3">Writing progress</label>\
	<input type="radio" id="measure_2" name="measure-switch" value="ks2readprog" onchange="loadDataset(value)"/>\
	<label for="measure_2">Reading progress</label>\
	<input type="radio" id="measure_1" name="measure-switch" value="ks2att" onchange="loadDataset(value)" checked/>\
	<label for="measure_1">RWM attainment</label>';

var sec =
'<input type="radio" id="measure_3" name="measure-switch" value="ks4prog" onchange="loadDataset(value)"/>\
	<label for="measure_3">Progress 8</label>\
	<input type="radio" id="measure_2" name="measure-switch" value="ks4att" onchange="loadDataset(value)"/>\
	<label for="measure_2">Attainment 8</label>\
	<input type="radio" id="measure_1" name="measure-switch" value="ks4basics" onchange="loadDataset(value)" checked/>\
	<label for="measure_1">Basics</label>';

function updateControls (value) {
	if (value == 'primary') {
		loadDataset('ks2att');
		document.getElementById('help-controls').classList.remove('sec');
		document.getElementById('help-controls').classList.add('prim');
		document.getElementById('measure-controls').classList.remove('sec');
		document.getElementById('measure-controls').classList.add('prim');
		return document.getElementById('measure-controls').innerHTML = prim;
	}
	else if (value == 'secondary') {
		loadDataset('ks4basics');
		document.getElementById('help-controls').classList.remove('prim');
		document.getElementById('help-controls').classList.add('sec');
		document.getElementById('measure-controls').classList.remove('prim');
		document.getElementById('measure-controls').classList.add('sec');
		return document.getElementById('measure-controls').innerHTML = sec;
	}
}

updateControls('primary');

var tree = d3.tree()
	.size([width, height])
	.separation(function (a, b) {
		return (a.parent == b.parent ? 1 : 2) / a.depth;
	});

var tip = d3.tip()		// initialise d3 tooltip
	.attr('class', 'd3-tip')
	.direction(function (d) {
		if (d.x >= width - 260) {
			return 'nw';
		}
		else if (d.y == 0) {
			return 'se';
		} else {
			return 'ne';
		}
	});

var svg = d3.select('.vis')
	.append('svg')
	.attr('width', width + margin.right + margin.left)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')		// creates a group element that will contain all objects within the SVG
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var quantize = d3.scaleQuantize();// domain and range are set as part of loading dataset

svg.append('g')
	.attr('class', 'legendQuant')
	.attr('transform', 'translate(' + width + ',-30)');		// for alignment with the top of first node (r=30)

var legend = d3.legendColor()		// https://d3-legend.susielu.com/
	.shapeWidth(30)
	.orient('vertical')
	.shapePadding(-2)
	.scale(quantize);

svg.append('g')
	.attr('class', 'button')
	.append('rect')
	.attr('transform', 'translate(0,-30)')		// for alignment with the top of first node (r=30)
	.attr('width', 80)
	.attr('height', 23)
	.attr('rx', 4)
	.attr('ry', 4)
	.attr('visibility', 'hidden')
	.on('click', function () {
		expandAll();
	});

svg.select('g.button')
	.append('text')
	.text('Expand all')
	.attr('transform', 'translate(8,-13)')		// for alignment with the top of first node (r=30)
	.attr('visibility', 'hidden')
	.on('click', function () {
		expandAll();
	});

svg.append('text')
	.attr('class', 'title header')
	.attr('id', 'title')
	.attr('text-anchor', 'start')
	.attr('x', 0)
	.attr('y', -90);

svg.append('text')
	.attr('class', 'title')
	.attr('text-anchor', 'start')
	.attr('x', 0)
	.attr('y', -70);

svg.append('text')
	.attr('class', 'notes header')
	.attr('y', height + margin.bottom - 50)
	.text('Notes');

svg.append('text')
	.attr('class', 'notes')
	.attr('y', height + margin.bottom - 40)
	.text('Pupils in state-funded establishments. Pupils are excluded where their ethnicity, EAL or disadvantage status is not recorded in the spring census of Year 6/Year 11.');

svg.append('text')
	.attr('class', 'notes')
	.attr('y', height + margin.bottom - 30)
	.text('Pupils’ first language includes those for whom first language is believed to be English/other than English. Coastal is defined as attending a school with 5.5km of the coast.');

svg.append('text')
	.attr('class', 'notes')
	.attr('y', height + margin.bottom - 20)
	.text('*Pupil subgroups are only shown when both subgroups consist of at least 10 pupils.');

svg.append('text')
	.attr('class', 'notes')
	.attr('y', height + margin.bottom - 10)
	.text('Source: FFT Education Datalab analysis of the National Pupil Database.');

svg.append('a')
	.attr('href', '/wp-content/d3/201909_interactingpupilcharacteristics/interactingpupilcharacteristics.xlsx')
	.attr('target', 'blank')			// fends off error relating to downloading
	.append('text')
	.attr('class', 'notes url')
	.attr('x', 312)
	.attr('y', height + margin.bottom - 10)
	.attr('href', 'interactingpupilcharacteristics.xlsx')
	.text('Download the data');

svg.append('a')
	.attr('href', 'https://ffteducationdatalab.org.uk')
	.append('image')
	.attr('href', '/wp-content/d3/fft_education_datalab_logo_lo.png')
	.attr('x', width + margin.right - 180 - 20)
	.attr('y', height + margin.bottom - 45 - 10)
	.attr('height', '45px')
	.attr('width', '180px');

svg.call(tip);		// invoke the tip in the context of viz

function loadDataset (value) {
	var jsonFile = '/wp-content/d3/201909_interactingpupilcharacteristics/' + value + '.json';

	d3.json(jsonFile).then(function (json) {
		bucketWidth = bucketWidths[value];
		quantize.domain([Math.floor(d3.min(json, function (d) { return d.value; }) / bucketWidth) * bucketWidth, Math.ceil(d3.max(json, function (d) { return d.value; }) / bucketWidth) * bucketWidth])		// NB: d.value, not d.data.value here as we're operating on json rather than e.g. root
			.range(d3.quantize(d3.interpolate('rgb(230,0,126)', 'rgb(45,170,225)'), buckets[value]));

		if (value == 'ks2att' || value == 'ks4basics') {
			legend.labelFormat(d3.format('.0%'));
		}
		else if (value == 'ks4att' || value == 'ks2readprog' || value == 'ks2writprog' || value == 'ks2matprog') {
			legend.labelFormat(d3.format('.1f'));
		} else {
			legend.labelFormat(d3.format('.2f'));
		}

		svg.select('.legendQuant')
			.call(legend);

		tip.html(function (d) {
			if (d.data.header == 'EAL') {
				var ttHeader = 'English as an additional language';
			}
			else if (d.data.header == 'non-EAL') {
				var ttHeader = 'First language English (non-EAL)';
			}
			else if (d.data.header == 'mixed') {
				var ttHeader = 'Mixed ethnicity';
			} else {
				var ttHeader = d.data.header;
			}
			if (value == 'ks2att' && d.data.name == 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p>A total of ' + d.data.value * 1000 / 10 + '% of <b>pupils nationally</b> reached the expected standard in KS2 reading, writing and maths in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks2att' && d.data.name != 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p>A total of ' + d.data.value * 1000 / 10 + '% of <b>' + d.data.tooltipText + '</b> reached the expected standard in KS2 reading, writing and maths in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks2readprog' && d.data.name == 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>Nationally</b>, pupils achieved an average KS2 reading progress score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks2readprog' && d.data.name != 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>' + d.data.tooltipText + '</b> achieved an average KS2 reading progress score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks2writprog' && d.data.name == 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>Nationally</b>, pupils achieved an average KS2 writing progress score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks2writprog' && d.data.name != 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>' + d.data.tooltipText + '</b> achieved an average KS2 writing progress score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks2matprog' && d.data.name == 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>Nationally</b>, pupils achieved an average KS2 maths progress score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks2matprog' && d.data.name != 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>' + d.data.tooltipText + '</b> achieved an average KS2 maths progress score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks4basics' && d.data.name == 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p>A total of ' + d.data.value * 1000 / 10 + '% of <b>pupils nationally</b> achieved the basics measure in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks4basics' && d.data.name != 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p>A total of ' + d.data.value * 1000 / 10 + '% of <b>' + d.data.tooltipText + '</b> achieved the basics measure in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks4att' && d.data.name == 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>Nationally</b>, pupils achieved an average Attainment 8 score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks4att' && d.data.name != 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>' + d.data.tooltipText + '</b> achieved an average Attainment 8 score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks4prog' && d.data.name == 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>Nationally</b>, pupils achieved an average Progress 8 score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
			else if (value == 'ks4prog' && d.data.name != 'all') {
				return "<p class='tooltip-header'>" + ttHeader + '</p><p><b>' + d.data.tooltipText + '</b> achieved an average Progress 8 score of ' + d.data.value + ' in 2018.' + "</p><p class='tooltip-pupils'>" + d.data.pupils.toLocaleString() + ' pupils</p>';
			}
		});

		var dataMap = json.reduce(function (map, node) {		// turn flat data into hierarchical data, required by tree
			map[node.name] = node;
			return map;
		}, {});

		var jsonData = [];

		json.forEach(function (node) {
			var parent = dataMap[node.parent];
			if (parent) {
				(parent.children || (parent.children = []))
					.push(node);
			} else {
				jsonData.push(node);
			}
		});

		root = d3.hierarchy(jsonData[0], function (d) { return d.children; });
		root.x0 = width / 2;		// i.e. middle of the svg, taking into account svg margin
		root.y0 = 0;		// i.e. top of the svg, taking into account svg margin

		d3.selectAll('.title').remove();

		svg.append('text')
			.attr('class', 'title header')
			.attr('id', 'title')
			.attr('text-anchor', 'start')
			.attr('x', 0)
			.attr('y', -90)
			.text('How pupil characteristics influence education outcomes');

		svg.append('text')
			.attr('class', 'title')
			.attr('text-anchor', 'start')
			.attr('x', 0)
			.attr('y', -70)
			.text(titleSubheads[value]);

		document.getElementById('measure-description-text').innerHTML = helpTooltips[value];
		if (document.getElementsByClassName('node').length > 1) {
			toggleDescendants(root);
		} else {
			loaded = 0;		// start tree off collapsed
			draw(root);
		}

	});
}

function draw (source) {// function to draw nodes and links - either used on the entire dataset, or data relating to a particular node that has been clicked on

	if (loaded == 0) {		// start tree off collapsed
		collapseDescendants(root);
	}

	var treeData = tree(root),
		nodes = treeData.descendants(),
		links = treeData.descendants().slice(1);

	nodes.forEach(function (d) { d.y = d.depth * 100; });		// set node depth

	var node = svg.selectAll('g.node')		//	define function that adds each node that is required
		.data(nodes, function (d) {
			return d.id || (d.id = ++i);
		});

	var nodeEnter = node.enter()		// joins data to elements
		.append('g')		// appended as a group
		.attr('class', 'node')
		.classed('nochild', function (d) {		// conditionally adds an additional class (.attr can't be used to add additional classes)
			return !d.children && !d._children;		// see defn below
		})
		.attr('transform', function (d) {
			if (source.xf != null) {		// where expand all button is used, the position which nodes are in before the expansion starts are used as the starting point
				return 'translate(' + source.xf + ',' + source.yf + ')';
			} else {
				return 'translate(' + source.x0 + ',' + source.y0 + ')';
			}
		});

	nodeEnter.append('circle')		// add a circle in each node g we have added
		.attr('r', 1e-6)
		.style('stroke', function (d) {
			return quantize(d.data.value);
		})
		.style('fill', function (d) {
			return quantize(d.data.value);
		})
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide)
		.on('click', toggleDescendants);	// passes details of node to click function

	nodeEnter.append('text')		// add label text in each node g we have added. If a node has children, text is positioned to the left of the node, anchored at the end of the text; if a node has no children, text is positioned to the right of the node, anchored at the start of the text
		.attr('class', 'node-label')
		.attr('data-depth', function (d) {				// text labels don't have d.depth, so data-depth is added so that depth can be accessed when working with text labels
			return d.depth;
		})
		.text(function (d) {
			return d.data.header[0].toUpperCase() + d.data.header.slice(1);		// svg css has no text-transform property, therefore best to do this way
		})
		.attr('x', function (d) {
			if (d.data.position == 'left') {
				return -1 * (radiuses[d.depth] + 4);
			}
			else if (d.data.position == 'right') {
				return (radiuses[d.depth] + 4);
			}
		})
		.attr('dy', '.35em')		// bumps the text down to align with the centre of each node
		.attr('text-anchor', function (d) {
			if (d.data.position == 'left') {
				return 'end';
			}
			else if (d.data.position == 'right') {
				return 'start';
			}
		})
		.style('fill-opacity', 1e-6);

	var labels = document.getElementsByClassName('node-label');

	requiredSpacing = {};

	for (let label of labels) {
		if (requiredSpacing[label.getAttribute('data-depth')] == null) {
			requiredSpacing[label.getAttribute('data-depth')] = Math.ceil(label.getComputedTextLength() / 5) * 5;
		}
		else if ((Math.ceil(label.getComputedTextLength() / 5) * 5) > requiredSpacing[label.getAttribute('data-depth')]) {
			requiredSpacing[label.getAttribute('data-depth')] = Math.ceil(label.getComputedTextLength() / 5) * 5;
		}
	}

	minSpacing = {};

	nodes.forEach(function (d) {
		nodes.forEach(function (e) {
			if (d.depth == e.depth && d.parent != e.parent && d.data.position != e.data.position) {
				if (minSpacing[d.depth] == null) {
					minSpacing[d.depth] = Math.round(Math.abs(d.x - e.x)) / 2;
				}
				else if (Math.round(Math.abs(d.x - e.x)) / 2 < minSpacing[d.depth]) {
					minSpacing[d.depth] = Math.round(Math.abs(d.x - e.x)) / 2;
				}
			}
			else if (d.depth == e.depth && d.parent == e.parent && d.data.position == e.data.position && d.id != e.id) {		// if labels are positioned on the same side and they share a parent they won't crash into one another, but could crash into the node itself
				if (minSpacing[d.depth] == null) {
					minSpacing[d.depth] = Math.round(Math.abs(d.x - e.x));
				}
				else if (Math.round(Math.abs(d.x - e.x)) < minSpacing[d.depth]) {
					minSpacing[d.depth] = Math.round(Math.abs(d.x - e.x));
				}
			}
		});
	});

	var nodeUpdate = nodeEnter.merge(node)		// explicitly merge new nodes in, so we're operating on all links (as from d3 v4 forward entering elements are not implicitly incuded in the update selection)
		.transition()
		.duration(function () {
			if (loaded == 0) {
				return 0;		// no transition on initial load
			} else {
				return duration;
			}
		})
		.attr('transform', function (d) {
			return 'translate(' + d.x + ',' + d.y + ')';			// new position of each node
		});

	nodeUpdate.select('circle')
		.attr('r', function (d) {
			return radiuses[d.depth];
		})
		.attr('class', function (d) {
			if (d._children) {		// see defn below
				return 'filled';
			} else {
				return 'unfilled';
			}
		});

	nodeUpdate.select('text')
		.style('fill-opacity', function (d) {		// this changes the behaviour of nodeUpdate from what it started out as - meaning that for node text (only) it handles removal as well as addition
			if (minSpacing[d.depth] - radiuses[d.depth] * 2 - 8 < requiredSpacing[d.depth] || (d.data.position == 'left' && Math.ceil(d.x / 5) * 5 - requiredSpacing[d.depth] < margin.left) || (d.depth < 3 && d.data.position == 'right' && Math.ceil(d.x / 5) * 5 + requiredSpacing[d.depth] > width)) {		// on the RHS, the wider margin means only the second and third tiers is at risk of crashing into something
				return 1e-6;
			} else {
				return 1;
			}
		})
		.attr('class', 'node-label');

	var nodeExit = node.exit()
		.transition()
		.duration(function () {
			if (loaded == 0) {
				return 0;		// no transition on initial load
			} else {
				return duration;
			}
		})
		.attr('transform', function (d) {
			if (source.x) {		// handles an error that only occurs when switching datasets and rapidly using expand all
				return 'translate(' + source.x + ',' + source.y + ')';
			} else {
				return 'translate(' + root.x0 + ',' + root.y0 + ')';
			}
		})
		.remove();

	nodeExit.select('circle')
		.attr('r', 1e-6);

	nodeExit.select('text')
		.style('fill-opacity', 1e-6);

	var link = svg.selectAll('path.link')		// define function that adds each link that is required
		.data(links, function (d) { return d.id; });

	var linkEnter = link.enter()
		.insert('path', 'g')
		.attr('class', 'link')
		.attr('d', function (d) {
			if (source.xf != null) {
				var o = {x: source.xf, y: source.yf};// where expand all button is used, the position which nodes are in before the expansion starts are used as the starting point
				return diagonal(o, o);
			} else {
				var o = {x: source.x0, y: source.y0};// position of the clicked node, whether or not that is the parent
				return diagonal(o, o);
			}
		});

	var linkUpdate = linkEnter.merge(link)		// explicitly merge new links in, so we're operating on all links (as from d3 v4 forward entering elements are not implicitly incuded in the update selection)
		.transition()
		.duration(function () {
			if (loaded == 0) {
				return 0;		// no transition on initial load
			} else {
				return duration;
			}
		})
		.attr('d', function (d) {
			return diagonal(d, d.parent);
		});

	var linkExit = link.exit()
		.transition()
		.duration(function () {
			if (loaded == 0) {
				return 0;		// no transition on initial load
			} else {
				return duration;
			}
		})
		.attr('d', function (d) {
			if (source.x) {		// handles an error that only occurs when switching datasets and rapidly using expand all
				var o = {x: source.x, y: source.y};// position of the clicked node, whether or not that is the parent
				return diagonal(o, o);
			} else {
				var o = {x: root.x0, y: root.y0};
				return diagonal(o, o);
			}
		})
		.remove();

	nodes.forEach(function (d) {
		d.x0 = d.x;		// stash current position of nodes for subsequent use
		d.y0 = d.y;
	});

	loaded = 1;
}

function diagonal (p, c) {
	return 'M' + p.x + ',' + p.y
	+ ' C' + p.x + ',' + (p.y + c.y) / 2
	+ ' ' + c.x + ',' + (p.y + c.y) / 2
	+ ' ' + c.x + ',' + c.y;
}

function toggleDescendants (d) {
	clickCount += 1;
	if (clickCount >= -1) {		// XXX
		svg.selectAll('.button').selectAll('*')
			.attr('visibility', 'visible');
	}
	if (d.children) {
		collapseDescendants(d);
	} else {
		d.children = d._children;				// d._children is a temp variable to hold d.children value when node is collapsed
		d._children = null;
	}
	draw(d);
}

function collapseDescendants (d) {
	if (d.children) {
		d.children.forEach(function (e) {
			collapseDescendants(e);
		});
		d._children = d.children;
		d.children = null;
	}
}

function expandDescendants (d) {
	if (d._children) {
		d._children.forEach(function (e) {
			expandDescendants(e);
		});
		d.children = d._children;
		d._children = null;
		draw(d);
	}
	else if (d.children) {
		d.children.forEach(function (e) {
			expandDescendants(e);
		});
	}
}

function stashPosition (d) {		// used to stash the position of nodes before the expansion is drawn - so that e.g. right hand nodes aren't drawn from a position after left hand nodes have already been drawn
	if (d.children) {
		d.children.forEach(function (e) {
			stashPosition(e);
			e.xf = e.x;
			e.yf = e.y;
		});
	}
}

function clearPosition (d) {
	if (d.children) {
		d.children.forEach(function (e) {
			clearPosition(e);
			d.xf = null;
			d.yf = null;
		});
	}
}

function expandAll () {
	stashPosition(root);
	expandDescendants(root);
	clearPosition(root);
}
