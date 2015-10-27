window.WSCounter = function() {

	// counters
	var timeCounter, globalCounter, redCounter, blueCounter, greenCounter;
	var redPercentage, bluePercentage, greenPercentage;

	// elements
	var globalCounterElement, greenCounterElement, blueCounterElement, redCounterElement;
	var greenPercentageElement, bluePercentageElement, redPercentageElement;

	// constants
	var transitionDuration = 100;
	var twoPi = 2 * Math.PI;
	var defaultColor = "#555555";
	var colors = {
		blue: "#556C9B",
		green: "#9FBE54",
		red: "#BE390B"
	};

	// pie chart related variables
	var arc = null,
		redDonutPortion = null,
		blueDonutPortion = null,
		greenDonutPortion = null;

	// time chart related variables
	var timeChartData = null;
	var timeChartTransitionInterval = null;
	var timeChartRemoveInterval = null;

	function arcTween(transition, newStartAngle, newEndAngle) {
		
	    transition.attrTween("d", function(d) {
	
	        var iStart = d3.interpolate(d.startAngle, newStartAngle);
	        var iEnd = d3.interpolate(d.endAngle, newEndAngle);
	        
	        return function(t) {
	            d.startAngle = iStart(t);
	            d.endAngle = iEnd(t);
	            return arc(d);
	        };
	    });
	};

	function initDonutChart() {
		
		var donutChartWrapper = document.getElementById("donutChartWrapper");
		var width = donutChartWrapper.offsetWidth,
			height = width,
		    outerRadius = Math.min(width, height) / 2.4,
		    innerRadius = (outerRadius / 5) * 2.9,
		    fontSize = (Math.min(width, height) / 5);
		
		arc = d3.svg.arc()
		    .innerRadius(innerRadius)
		    .outerRadius(outerRadius);
		
		redPercentage = 0, bluePercentage = 0, greenPercentage = 0;
		
		var svg = d3.select('#donutChartWrapper').append("svg")
		    .attr('viewBox','0 0 '+ Math.min(width,height) + ' ' + Math.min(width,height))
		    .append("g")
		    .attr("transform", "translate(" + width / 2 + "," + Math.min(width,height) / 2 + ")");
		
		globalCounterElement = svg.append("text")
		    .attr("text-anchor", "middle")
		    .style("font-size",fontSize + 'px')
		    .attr("fill", defaultColor)
		    .attr("dy", fontSize / 3)
		    .attr("dx", 2);
		
		redDonutPortion = svg.append("path")
			.datum({startAngle: 0, endAngle: 0})
			.style("fill", colors.red)
			.attr("d", arc);
		
		greenDonutPortion = svg.append("path")
		    .datum({startAngle: 0, endAngle: 0})
		    .style("fill", colors.green)
		    .attr("d", arc);
		
		blueDonutPortion = svg.append("path")
			.datum({startAngle: 0, endAngle: 0})
			.style("fill", colors.blue)
			.attr("d", arc);
	};

	var initTimeChart = function() {
		
		var timeChartWrapper = document.getElementById("timeChartWrapper");
		var width = timeChartWrapper.offsetWidth,
			height = 30;

		var now = new Date().getTime();
		var x = d3.time.scale().domain([now - 5000, now]).range([0, width]);
		var svg = d3.select("#timeChartWrapper").append("svg").attr("width", width).attr("height", height);

		timeChartTransitionInterval = setInterval(function() {
			
			var now = new Date();
			var threeSecAgo = new Date(now.getTime() - 3000);
			x.domain([threeSecAgo, now]);

			var circles = svg.selectAll("circle").data(timeChartData, function(d) {
				return d.date;
			});

			circles
				.transition()
				.ease("linear")
				.duration(100)
				.attr("cx", function(d) {
					return x(d.date);
				});

			circles.enter()
				.append("svg:circle")
				.attr("r", 4)
				.attr("fill", function(d) {
					return colors[d.color];
				})
				.attr("cy", height / 2)
				.attr("cx", function(d) {
					return x(d.date);
				});

			circles.exit().remove();

		}, 100);

		timeChartRemoveInterval = setInterval(function() {

			var now = new Date();
			var threeSecAgo = new Date(now.getTime() - 3000);

			for (var i = 0; i < timeChartData.length; i++) {
				if (timeChartData[i].date < threeSecAgo) {
					timeChartData.shift();
				} else {
					break;
				}
			}

		}, 500);
	};

	var add = function(color) {

		if (color == "red") {
			redCounter++;
			redCounterElement.innerHTML = redCounter;
		} else if (color == "green") {
			greenCounter++;
			greenCounterElement.innerHTML = greenCounter;
		} else if (color == "blue") {
			blueCounter++;
			blueCounterElement.innerHTML = blueCounter;
		} else {
			return;
		}

		globalCounter++;

		timeChartData.push({
			color: color,
			date: new Date()
		});
		
		redPercentage = redCounter * 100 / globalCounter;
		greenPercentage = greenCounter * 100 / globalCounter;
		bluePercentage = blueCounter * 100 / globalCounter;
		
		redPercentageElement.innerHTML = Math.round(redPercentage) + "%";
		greenPercentageElement.innerHTML = Math.round(greenPercentage) + "%";
		bluePercentageElement.innerHTML = Math.round(bluePercentage) + "%";

		// ----------------------- redraw donut

		var greenPortionEnd = greenPercentage / 100 * twoPi;
		var bluePortionEnd = greenPortionEnd + (bluePercentage / 100 * twoPi);

		globalCounterElement.text(globalCounter);

		greenDonutPortion
			.transition()
			.duration(transitionDuration)
			.call(arcTween, 0, greenPortionEnd);

		blueDonutPortion
			.transition()
			.duration(transitionDuration)
			.call(arcTween, greenPortionEnd, bluePortionEnd);

		redDonutPortion
			.transition()
			.duration(transitionDuration)
			.call(arcTween, bluePortionEnd, twoPi);
	};

	return {

		init: function() {

			greenCounterElement = document.getElementById("greenCounter");
			blueCounterElement = document.getElementById("blueCounter");
			redCounterElement = document.getElementById("redCounter");

			greenPercentageElement = document.getElementById("greenPercentage");
			bluePercentageElement = document.getElementById("bluePercentage");
			redPercentageElement = document.getElementById("redPercentage");

			var currentConnection = null, currentTimer = null;

			var statsElement = document.getElementById("stats");
			var timerElement = document.getElementById("timer");
			var connectionStatusElement = document.getElementById("connectionStatus");
			var actionLink = document.getElementById("actionLink");
			var errorMessageElement = document.getElementById("errorMessage");

			actionLink.onclick = function() {

				if (currentConnection != null) {
					currentConnection.send("quit");
					return
				}

				var connection = new WebSocket("ws://" + location.hostname + ":8025/websockets/counter");

				connection.onopen = function() {
					currentConnection = connection;
					actionLink.innerHTML = "Disconnect";
					actionLink.className = "redBackground";
					errorMessageElement.innerHTML = "";
					currentConnection.send("start");
					statsElement.style.display = "block";

					//change status
					connectionStatusElement.className = "green";
					connectionStatusElement.innerHTML = "Connected";

					//reset all
					timeCounter = 0, globalCounter = 0, redCounter = 0, blueCounter = 0, greenCounter = 0;
					redCounterElement.innerHTML = 0;
					greenCounterElement.innerHTML = 0;
					blueCounterElement.innerHTML = 0;
					timeChartData = [];

					//show & start timer
					timerElement.innerHTML = "";
					timerElement.style.display = "block";
					currentTimer = setInterval(function() {

						timeCounter++;

						var minutes = Math.round(timeCounter / 60);
						var seconds = timeCounter % 60;

						var timer;
						if (minutes != 0) {
							timer = minutes + " min " + seconds + " sec";
						} else {
							timer = seconds + " sec";
						}

						timerElement.innerHTML = timer;

					}, 1000);
				};

				connection.onclose = function(e) {

					if (currentConnection != null) {
						connectionStatusElement.innerHTML = "Disconnected";
					} else {
						connectionStatusElement.innerHTML = "Not connected";
						errorMessageElement.innerHTML = "Unsuccessful (type: " + e.type + ", code: " + e.code + ")";
					}
					currentConnection = null;
					connectionStatusElement.className = "red";
					actionLink.className = "greenBackground";
					actionLink.innerHTML = "Connect to server";
					clearInterval(currentTimer);
					clearInterval(timeChartTransitionInterval);
					clearInterval(timeChartRemoveInterval);

					greenDonutPortion = null, blueDonutPortion = null, redDonutPortion = null;
				};

				connection.onmessage = function(e) {
					var color = e.data.toLowerCase();
					add(color);
				};

				d3.selectAll("svg").remove();
				initDonutChart();
				initTimeChart();
			};
		}
	}
}();