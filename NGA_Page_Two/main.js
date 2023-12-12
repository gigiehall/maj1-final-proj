// Load data from CSV
d3.csv("ilse_art.csv").then(function (data) {
  // Parse 'displaydate' as a date
  data.forEach(function (d) {
    d.displaydate = new Date(+d.displaydate, 0, 1);
  });

  // Set up SVG container
  var width = 1600;
  var height = 400;
  var margin = { top: 200, right: 20, bottom: 20, left: 20 }; // Increased right margin for better visibility

  // Calculate the total width and height including margins
  var totalWidth = width + margin.left + margin.right;
  var totalHeight = height + margin.top + margin.bottom;

  var svg = d3
    .select("body")
    .append("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .append("g") // Append a group for the content
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Set a fixed range for the x-axis
  var xScale = d3
    .scaleTime()
    .domain([
      new Date(1910, 0, 1), // Start date
      new Date(1990, 0, 1), // End date
    ])
    .range([margin.left, width - margin.right]);

  var yScale = d3
    .scaleLinear()
    .domain([0, data.length])
    .range([height - margin.bottom, margin.top]);

  // Add background for X axis using the gradient
  var defs = svg.append("defs");

  var gradient = defs
    .append("linearGradient")
    .attr("id", "xAxisGradient")
    .attr("gradientTransform", "rotate(0)"); // Change the rotation to 0 degrees

  gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffff3e");
  gradient.append("stop").attr("offset", "100%").attr("stop-color", "#3780d7");

  // Add background for X axis using the gradient
  svg
    .append("rect")
    .attr("class", "x-axis-background")
    .attr("height", 30) // Adjust the height as needed
    .attr("fill", "url(#xAxisGradient)")
    .attr("rx", 15) // Set the border-radius for rounded corners
    .attr(
      "transform",
      "translate(" + -margin.left + "," + (height - margin.bottom) + ")"
    );

  // Create X-axis
  var xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y"));

  var xAxisGroup = svg
    .append("g")
    .attr("class", "axis-x")
    .attr("transform", "translate(0," + (height - margin.bottom) + ")")
    .call(xAxis)
    .select(".domain") // Select the axis line (domain)
    .style("stroke", "none"); // Make the axis line invisible

  // Nest data by displaydate
  var nestedData = d3
    .nest()
    .key((d) => d.displaydate)
    .entries(data);

  // Create groups for each year
  var groups = svg
    .selectAll(".year-group")
    .data(nestedData)
    .enter()
    .append("g")
    .attr("class", "year-group");

  // Create circles within each group with adjusted vertical spacing
  groups
    .selectAll("circle")
    .data((d) => d.values)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.displaydate))
    .attr("cy", height) // Start the circles at the bottom
    .attr("r", 9)
    .style("fill", "#d7d7d7")
    .on("mouseover", function (d) {
      d3.select(this).interrupt(); // Stop ongoing transitions
      d3.select(this).style("fill", "#AEAEAE");
      showTooltip(d);
    })
    .on("mouseout", function () {
      d3.select(this).interrupt(); // Stop ongoing transitions
      d3.select(this).style("fill", "#d7d7d7");
      hideTooltip();
    })
    .transition()
    .delay((d, i) => i * 50) // Adjust the delay for faster animation
    .duration(500) // Adjust the duration for overall animation speed
    .ease((t, i) =>
      i === data.length - 1 ? customEasing(t) : d3.easeCubicInOut(t)
    ) // Apply custom easing only for the last circle
    .attr("cy", (d, i) => yScale(i * 9 + 7));

  // Add image patterns
  var defs = svg.append("defs");
  var pattern = defs
    .append("pattern")
    .attr("id", "image-pattern")
    .attr("width", 1)
    .attr("height", 1)
    .append("image")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 20)
    .attr("height", 20);

  // Add tooltips
  function showTooltip(d) {
    // Extract the year from the Date object
    const year = new Date(d.displaydate).getFullYear();

    const mouseX = d3.event.clientX;
    const mouseY = d3.event.clientY;

    // Adjust the tooltip position if it's too close to the right edge
    const tooltipWidth = document.getElementById("tooltip").offsetWidth;
    const maxX = window.innerWidth - tooltipWidth - 20; // 20 is a buffer
    const adjustedX = Math.min(mouseX, maxX);

    // Adjust the tooltip position if it's too close to the bottom edge
    const tooltipHeight = document.getElementById("tooltip").offsetHeight;
    const maxY = window.innerHeight - tooltipHeight - 20; // 20 is a buffer
    const adjustedY = Math.min(mouseY, maxY);

    d3.select("#tooltip")
      .html(
        `${d.title}<br>${year}<br><img src="${d.iiifthumburl}" alt="${d.title}" width="auto" height="200": auto;">`
      )
      .style("left", adjustedX + 10 + "px")
      .style("top", adjustedY - 10 + "px")
      .style("opacity", 1);
  }

  function hideTooltip() {
    d3.select("#tooltip").style("opacity", 0);
  }
});

/////////// NAVIGATION ///////////

document.addEventListener("DOMContentLoaded", function () {
  // Get the current page URL
  const currentPageUrl = window.location.pathname;

  // Select all navigation links
  const navLinks = document.querySelectorAll(".navigation a");

  // Loop through each link and check if its href matches the current page URL
  navLinks.forEach(function (link) {
    const linkUrl = new URL(link.href).pathname;

    // If the link's href matches the current page URL, add an 'active' class
    if (linkUrl === currentPageUrl) {
      link.classList.add("active");
    }
  });
});
