$(document).ready(function() {
    Cufon.replace('#content h4.dash_sub',{
        fontFamily: 'GothamLight'
    });
    Cufon.replace('#content h4.dash_title',{
        fontFamily: 'GothamBold'
    });
    Cufon.replace('h3#county_label',{
        fontFamily: 'GothamBold'
    });
    Cufon.replace('#readout h1',{
        fontFamily: 'GothamBold'
    });
    Cufon.replace('#no_data h1', {
        fontFamily: 'GothamBold'
    });
    Cufon.replace('h3#distribution_band_label',{
        fontFamily: 'GothamBold'
    });
});

var width = 1000,
    height = 400,//860
	ts_width = 350,
	ts_height = 300,
	ts_left  = 20,
	ts_right = 20,
	yoy_height = 100;
	
var svg = d3.select("#map").attr({ width: width, height: height})
var time_series_svg = d3.select("#time_series").attr({ width: ts_width, height: ts_height})
var yoy_svg = d3.select("#yoy").attr({ width: ts_width, height: yoy_height})

var projection = d3.geo.albersUsa()
					.translate([350,200])
					.scale([800])

var path = d3.geo.path()
			.projection(projection);
			
var color = d3.scale.linear();
var numbers = [];
var airfares = {};
var tickets = {};
var yoys = {};
var column_name ="1993Q1" //quarter to draw initially
var slider_index = 1;
var quarters_array = []
var price_scale;
var time_scale;

var tooltip = d3.select("#interactive_area").append("div").attr("class", "tooltip")

function select_time_series(d){
	time_series_svg.select("path." + d.properties.abbreviation)
		.attr("stroke-opacity", 1)
}

function generate_yoy_for_state(d){
	yoy_svg.selectAll("rect.yoy")
		.attr("y", function(e) { return yoys[d.properties.abbreviation][e] < 0 ? bar_scale(0) : bar_scale(yoys[d.properties.abbreviation][e]) })
		.attr("height", function(e) { return Math.abs(bar_scale(yoys[d.properties.abbreviation][e]) - bar_scale(0)) })
		.attr("fill", function(e) { return e !== quarters_array[slider_index] ? "#CCC" : "#003e5f"})
}

function create_tooltip(d){
	var bounds = path.bounds(d)
	tooltip.style({
		left: bounds[1][0] + "px",
		top: (bounds[0][1] + (bounds[1][1] - bounds[0][1])/2)+ "px",
		opacity: 1
	})
	tooltip.html(d.properties.name 
		+ "<br/>Median airfare: $" 
		+ airfares[d.properties.abbreviation][quarters_array[slider_index]]
		+ "<br/>"
		+ Math.round(tickets[d.properties.abbreviation][quarters_array[slider_index]] / tickets["US"][quarters_array[slider_index]] * 10000) / 100
		+ "% all US Tickets"
		+ "<br/>YOY: "
		+ Math.round(yoys[d.properties.abbreviation][quarters_array[slider_index]] * 1000) / 10
		+ "%"
		)
}

function highlight_state(state_node, d, i) {
	state_node.attr("stroke", "orange" )
	select_time_series(d);
	generate_yoy_for_state(d);
	create_tooltip(d);
}

function clear_tooltip(){
	tooltip.style("opacity", 0);
}

function generate_yoy_for_US(){
	yoy_svg.selectAll("rect.yoy")
		.attr("y", function(e) { return yoys["US"][e] < 0 ? bar_scale(0) : bar_scale(yoys["US"][e]) })
		.attr("height", function(e) { return Math.abs(bar_scale(yoys["US"][e]) - bar_scale(0)) })
		.attr("fill", function(e) { return e !== quarters_array[slider_index] ? "#CCC" : "orange"})
}

function unselect_time_series(d){
	time_series_svg.select("path." + d.properties.abbreviation)
		.attr("stroke-opacity", 0.1)
}

function clear_state(state_node, d ,i) {
	state_node.attr("stroke", "#CCC")
	clear_tooltip();
	generate_yoy_for_US();
	unselect_time_series(d);	
}

function mouseover_state(d,i) {
	highlight_state(d3.select(this), d, i)
}

function mouseout_state(d,i) {
	clear_state(d3.select(this), d, i)
}

function text_fill(d,i) {
	if (["VT", "NH", "MA", "RI", "CT", "DE", "MD", "HI"].indexOf(d.properties.abbreviation) > -1 || airfares[d.properties.abbreviation][quarters_array[slider_index]] === "")
		return "#222"
	else if (airfares[d.properties.abbreviation][quarters_array[slider_index]] < 550)
		return "#222"
	else
		return "#d9e3e3"	
}

/*
	all_prices uses numbers array
*/
function create_all_prices_array(){
	for(var i = 0; i < numbers.length; i++){
		numbers[i] = +numbers[i];
	}

	numbers.sort(function(a,b){ return a - b;})
	all_prices = numbers.reduce(function (a,b) {return a.concat(b)}, []);
}

function get_median_of_prices(){
	overall_median = d3.median(all_prices)
}

function color_scale_based_price_quantiles(){
	price_quantiles = d3.scale.quantile().domain(all_prices).range([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19])

	color.domain([200, price_quantiles.quantiles()[18]])
		  .range(["#fffcf7","rgb(25, 102, 127)"])//, "white", "orange"])
		  .interpolate()
}

function create_abbreviations_for_states(abbrev, states){
	abbrev.forEach(function(d){
		for(var i = 0; i < states.length; i++){
			if(states[i].properties.name === d.name){
				states[i].properties.abbreviation = d.abbreviation;
			}
		}
	});
}

function create_states(states){
	svg.selectAll("path.states")
			.data(states)
			.enter()
			.append("path")
			.attr("class", function(d) { return "state " + d.properties.name + " " + d.properties.abbreviation;;})
			.attr("fill", function(d){
				if(d.properties.abbreviation === "HI"){
					return 0;
				}else{
					return color(airfares[d.properties.abbreviation][column_name]);
				}
			})
			.attr("stroke", "#CCC")
			.attr("d",path)
			.on("mouseover", mouseover_state)
			.on("mouseout", mouseout_state)
}

function attach_text_to_states(states){
		svg.selectAll("text.states")
			.data(states)
			.enter()
			.append("text")
			.attr("class", function(d) { return "state " + d.properties.name })
			.text(function(d){
				if(d.properties.abbreviation === "HI" || airfares[d.properties.abbreviation][column_name] === ""){
					return "$" + 0;
				}else{
					return "$" + airfares[d.properties.abbreviation][column_name];
				}
			})
		    .attr("x", function(d){
				if(d.properties.name === "Vermont"){
					return path.centroid(d)[0] - 20;
				}else if(d.properties.name === "New Hampshire"){
					return path.centroid(d)[0] + 70;
				}else if(d.properties.name === "Massachusetts"){
					return path.centroid(d)[0] + 70;
				}else if(d.properties.name === "Rhode Island"){
					return path.centroid(d)[0] + 60;
				}else if(d.properties.name === "Connecticut"){
					return path.centroid(d)[0] + 60;
				}else if(d.properties.name === "Delaware"){
					return path.centroid(d)[0] + 75;
				}else if(d.properties.name === "Maryland"){
					return path.centroid(d)[0] + 94;
				}else{
					return path.centroid(d)[0];
				}
		    })
		    .attr("y", function(d){
				if(d.properties.name === "Vermont"){
					return path.centroid(d)[1] - 50;
				}else if(d.properties.name === "New Hampshire"){
					return path.centroid(d)[1] + 5;
				}else if(d.properties.name === "Massachusetts"){
					return path.centroid(d)[1] + 5;	
				}else if(d.properties.name === "Rhode Island"){
					return path.centroid(d)[1] + 20;
				}else if(d.properties.name === "Connecticut"){
					return path.centroid(d)[1] + 30;
				}else if(d.properties.name === "Delaware"){
					return path.centroid(d)[1] + 5;
				}else if(d.properties.name === "Maryland"){
					return path.centroid(d)[1] + 15;
				}else{
					return path.centroid(d)[1];
				}
		    })
			.attr("text-anchor", "middle")
			.attr("font-size", "10px")
			.attr("fill", text_fill)
}

function create_label_lines(){
	svg.append("line").attr("class", "Vermont").attr("x1", "570px").attr("y1", "50px").attr("x2", "585px").attr("y2", "90px").attr("stroke", "black")
	svg.append("line").attr("class", "New Hampshire").attr("x1", "600px").attr("y1", "102px").attr("x2", "650px").attr("y2", "102px").attr("stroke", "black")
	svg.append("line").attr("class", "Massachusetts").attr("x1", "600px").attr("y1", "115px").attr("x2", "650px").attr("y2", "115px").attr("stroke", "black")
	svg.append("line").attr("class", "Rhode Island").attr("x1", "605px").attr("y1", "125px").attr("x2", "650px").attr("y2", "140px").attr("stroke", "black")
	svg.append("line").attr("class", "Connecticut").attr("x1", "590px").attr("y1", "127px").attr("x2", "640px").attr("y2", "150px").attr("stroke", "black")
	svg.append("line").attr("class", "Delaware").attr("x1", "580px").attr("y1", "175px").attr("x2", "640px").attr("y2", "175px").attr("stroke", "black")
	svg.append("line").attr("class", "Maryland").attr("x1","580px").attr("y1","185px").attr("x2","640px").attr("y2","185px").attr("stroke","black")
}

function display_year(){
	d3.select("#interactive_area").append("h3").attr("class","year").text([column_name]);
}

/*
	Draws us map using fare_medians_state.csv
*/
function initial_draw_map(data){
	//data = fare_medians_state.csv
	create_all_prices_array();
	get_median_of_prices();
	color_scale_based_price_quantiles();
		//.range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)","rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,81,156)", "rgb(8,48,107)"])

	d3.json("us-states.json",function(states){
		states.features.pop()
		d3.json("states.json",function(abbrev){
			create_abbreviations_for_states(abbrev, states.features);
			create_states(states.features);
			attach_text_to_states(states.features)
			create_label_lines();
		});
		
	});
	display_year();
}


var ts_path = d3.svg.line()
	.y(function(d) { return price_scale(+d.value) })
	.x(function(d) { return time_scale(d.key) })

/*
	all_prices array uses d3.entries(airfares)
*/
function create_price_scale(states_to_draw){
	//all_prices: arrays of all values with arrays represented per state and used for price scale
	all_prices = states_to_draw.map(function(d) { 
		return d3.values(d.value)
			.map(function(e) { return +e }) 
	})
	
	price_min = d3.min(d3.min(all_prices))
	price_max = d3.max(d3.max(all_prices))

	price_scale = d3.scale.linear().range([ts_height, 0]).domain([price_min, price_max])
}

/*
	Generates time series paths for each state in an array
*/
function generate_state_paths_array(states_to_draw){
	//states_paths = key is state, value is array of objects with key as "title" and value as "price"
	states_paths = states_to_draw.map(function(d) { return {key: d.key, value: d3.entries(d.value) }})
}

/*
	Create time markers for each state 
*/
function create_time_markers(states_to_draw){
	var time_markers = time_series_svg.selectAll("circle.time_marker")
		.data(states_to_draw)
		
	time_markers.enter()
		.append("circle")
		.attr("class", function(d) { return "time_marker " + d.key })
		.attr("fill", function(d) { return d.key === "US" ? "orange" : "#003e5f" })
		.attr("fill-opacity", function(d) { return d.key === "US" ? 1 : 0 })
		.attr("r", 3)
		.attr("cx", function(d) { return time_scale(quarters_array[slider_index]) } )
		.attr("cy", function(d) { return price_scale(+d.value[quarters_array[slider_index]]) })
}

function create_time_series_paths(){
	var ts_paths = time_series_svg.selectAll("path.ts")
		.data(states_paths)
	
	ts_paths.enter()
		.append("path")
			
	ts_paths
		.attr("d", function(d) { 
			return ts_path(d.value
				.filter(function(e) { return e.key !== "State"})
			) 
		})
		.attr("class", function(d) { return "ts " + d.key })
		.attr("stroke", function(d) { return d.key === "US" ? "orange" : "#003e5f" })
		.attr("stroke-opacity", function(d) { return d.key === "US" ? 1 : 0.1 })
		.attr("fill", "none")
		.on("mouseover", function(d, i) {
			d3.select(this).attr("stroke-opacity", 1)
			time_series_svg.select("circle.time_marker." + d.key).attr("fill-opacity", 1)
			state_node = svg.select("path." + d.key)
			highlight_state(state_node, state_node.data()[0], i)
		})
		.on("mouseout", function(d, i) {
			d3.select(this).attr("stroke-opacity", d.key === "US" ? 1 : 0.1)
			time_series_svg.select("circle.time_marker." + d.key).attr("fill-opacity", d.key === "US" ? 1 : 0)
			state_node = svg.select("path." + d.key)
			clear_state(state_node, state_node.data()[0] , i)			
		})
}
/*
	Draws time series using d3.entries(airfares) with key as state and fare_median_states as values
	x-axis is the year, path is the prices, y-axis is the states
*/
function draw_time_series(states_to_draw) {
	//states_to_draw = d3.entries(airfares)
	create_price_scale(states_to_draw);
	generate_state_paths_array(states_to_draw);
	create_time_markers(states_to_draw);
	create_time_series_paths();	
	draw_bars(states_to_draw)
}

function draw_bars(states_to_draw) {
	var bar_width = 2
	bar_scale = d3.scale.linear().range([yoy_height, 0]).domain([-.25,.25])

	var bars = yoy_svg.selectAll("rect.yoy")
		.data(quarters_array.filter(function(d) {return d !== "State"}))
		.enter()
		.append("rect")
		.attr("class", function(d) { return "yoy " + d})
		.attr("x", function(d) { return time_scale(d) - bar_width / 2})
		.attr("y", function(d) { return yoys["US"][d] < 0 ? bar_scale(0) : bar_scale(yoys["US"][d]) })
		.attr("height", function(d) { return Math.abs(bar_scale(yoys["US"][d]) - bar_scale(0)) })
		.attr("width", bar_width )
		.attr("fill", function(d) { return d !== quarters_array[slider_index] ? "#CCC" : "orange"})
}

//match state with fare_medians_state using "airfare" object
function match_states_with_prices(data){
	data.forEach(function(d){
		airfares[d.State] = d
		numbers = numbers.concat(d3.values(d)
			.filter(function(d) {
				return !isNaN(d) && d !== "";
			}))
	})
}
	
//match total_pass_state using "ticket" object
function match_states_with_tickets(ticket_data){
	ticket_data.forEach(function(d) { tickets[d.State] = d });
}

//match total_pass_state using "yoys" object
function match_states_with_yoy(yoy_data){
	yoy_data.forEach(function(d) { yoys[d.State] = d });
}

//get all keys of the total_pass_state.csv and create time scale
function create_time_scale(data){
	quarters_array = d3.keys(data[0])
	time_scale = d3.scale.ordinal().domain(quarters_array).rangePoints([0+ts_left,ts_width - ts_right])
}

function display_year_and_avg_us_fare(ui){
	d3.select("#interactive_area h3.year").text(quarters_array[ui.value]);
	d3.select("#us_details").text("Avg US Fare: $" 
		+ Math.round(airfares["US"][quarters_array[slider_index]]) 
		+ " (YOY: " 
		+ Math.round(yoys["US"][quarters_array[slider_index]] * 100) 
		+ "%)")
}

function change_state_color(){
	d3.selectAll("path.state")
 		.attr("fill", function(d){
			if(d.properties.abbreviation === "HI"){
				return 0;
			}else{
				return color(airfares[d.properties.abbreviation][quarters_array[slider_index]]);
			}
		})
		.on("mouseover", mouseover_state)
		.on("mouseout", mouseout_state)
}

function change_text_on_state(data, ui){
	d3.selectAll("text.state")
		.text(function(d){
			if(d.properties.abbreviation === "HI" || airfares[d.properties.abbreviation][d3.keys(data[0])[ui.value]] === ""){
				return "$" + 0;
			}else{
				return "$" + airfares[d.properties.abbreviation][d3.keys(data[0])[ui.value]];
			}
		})
		.attr("fill", text_fill)
}

function move_time_marker(){
	time_series_svg.selectAll("circle.time_marker")
		.attr("cx", function(d) { return time_scale(quarters_array[slider_index]) } )
		.attr("cy", function(d) { return price_scale(+d.value[quarters_array[slider_index]]) })
}

function highlight_yoy_bar(){
	yoy_svg.selectAll("rect.yoy")
		.attr("fill", function(d) { return d !== quarters_array[slider_index] ? "#CCC" : "orange"})
}

function create_slider(data){
	$(function(){
		$("#slider").slider({
			min:1,
			max:quarters_array.length-1,
			slide: function(event, ui){
				slider_index = ui.value;
				display_year_and_avg_us_fare(ui);
				change_state_color();
				change_text_on_state(data, ui);
				move_time_marker();
				highlight_yoy_bar();
			
			}
		});
	});
}
/*
	Load in total_pass_state.csv, fare_median_pchya.csv, fare_medians_state.csv
*/
d3.csv("total_pass_state.csv", function(ticket_data) {
	d3.csv("fare_median_pchya.csv", function(yoy_data) {
	d3.csv("fare_medians_state.csv", function(data){
		match_states_with_prices(data);
		match_states_with_tickets(ticket_data);
		match_states_with_yoy(yoy_data)
		create_time_scale(data);
		initial_draw_map(data)
		draw_time_series(d3.entries(airfares)) 
		create_slider(data);
		//draw_time_series([{key:"US", value:airfares["US"]}])
	})
	})
})

// d3.csv("Airfares_by_State.csv", function(data){
// 	draw_map("1993Q1", data)
// 	d3.select("#interactive_area").selectAll("a")
// 		.data(d3.keys(data[0]))
// 		.enter()
// 		.append("a")
// 		.html(function(d){ 
// 			if(d !== "State"){
// 				if(d.indexOf("Q4") === -1){
// 					return d + " | ";
// 				}else{
// 					return d + "<br/>";
// 				}
// 			}
// 		})
// 		.attr("href", "javascript:;")
// 		.on("click", function(d){
// 			draw_map(d,data);
// 		})
// })