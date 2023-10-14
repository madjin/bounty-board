document.addEventListener('mousemove', function(ev) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = (ev.clientX + 10) + 'px';
    tooltip.style.top = (ev.clientY - 10) + 'px';
}, false);

const colorScale = d3.scaleLinear()
    .domain([5, 1000, 2000])
    .range(["#006400", "#32CD32", "#7FFF00"]) // Dark green to light green
    .interpolate(d3.interpolateRgb);

const servers = Array.from({ length: 200 }, (_, id) => ({
    id,
    name: `Server ${id + 1}`,
    users: Math.floor(Math.random() * 1996) + 5,
    url: `http://server${id + 1}.com`,
}));

// Add this block of code to populate the text list
const serverList = d3.select("#server-list");
servers.forEach(server => {
    const listItem = serverList.append("li");
    listItem.text(`${server.name}: ${server.users} users`);
    listItem.on("click", function() {
        window.location.href = server.url;
    });
});

// Initialize dimensions
let svgWidth = document.getElementById('svg-section').offsetWidth;
let svgHeight = window.innerHeight;

// Initialize viewBox dimensions
let viewBoxWidth = svgWidth;
let viewBoxHeight = svgHeight;

const svg = d3.select("#svg-section").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("viewBox", `${-viewBoxWidth / 2} ${-viewBoxHeight / 2} ${viewBoxWidth} ${viewBoxHeight}`)
    .style("background-color", "black");

// Add glitch filter
const filter = svg.append("defs")
    .append("filter")
    .attr("id", "glitch");
// Add your glitch filter settings here...

const g = svg.append("g");

const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on('zoom', zoomed);

function zoomed() {
    g.attr('transform', d3.event.transform);
}

svg.call(zoom).call(zoom.transform, d3.zoomIdentity.scale(0.5));

// Existing simulation
const simulation = d3.forceSimulation(servers)
    .force('charge', d3.forceManyBody().strength(30))
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.users)))
    .on('tick', ticked);

function ticked() {
    const circles = g.selectAll("circle")
        .data(servers, d => d.id);

    const newCircles = circles.enter()
        .append('circle')
        .attr('r', d => Math.sqrt(d.users))
        .attr('fill', d => colorScale(d.users));

    newCircles.merge(circles)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('fill', d => colorScale(d.users))
        .on("mouseover", function(d) {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.display = "inline";
            tooltip.innerText = `${d.name}: ${d.users} users`;
        })
        .on("mouseout", function() {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.display = "none";
        })
        .on("click", function(d) {
            window.location.href = d.url;
        });

    circles.exit().remove();

    applyFlickerEffect(circles.filter(d => d.users > 1500));
}

function applyFlickerEffect(selection) {
    selection.transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('opacity', 0.5)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('opacity', 1);
}

// Re-adjust on window resize
window.addEventListener("resize", function() {
    svgWidth = document.getElementById('svg-section').offsetWidth;
    svgHeight = window.innerHeight;

    viewBoxWidth = svgWidth;
    viewBoxHeight = svgHeight;

    svg.attr("width", svgWidth)
       .attr("height", svgHeight)
       .attr("viewBox", `${-viewBoxWidth / 2} ${-viewBoxHeight / 2} ${viewBoxWidth} ${viewBoxHeight}`);

    simulation.force('center', d3.forceCenter(0, 0))
              .restart();
});

async function fetchAndUpdateServerList() {
    try {
        const response = await fetch('/tasks.json');
        
        // Check if Content-Type is application/json
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
            throw new Error("Received non-JSON content type");
        }

        if (response.status === 200) {
            const data = await response.json();
            
            // Debug log
            console.log("Fetched data:", data);
            
            // Clear existing list
            const serverList = d3.select("#server-list");
            serverList.html("");
            
            // Update the server-list with fetched JSON data
            data.servers.forEach(server => {
                const listItem = serverList.append("li");
                listItem.text(`${server.name}: ${server.users} users`);
                listItem.on("click", function() {
                    window.location.href = server.url;
                });
            });
        } else {
            throw new Error(`Received unexpected status code: ${response.status}`);
        }
    } catch (error) {
        console.error("Error fetching server list: ", error);
    }
}


// Call this function to populate server list
fetchAndUpdateServerList();


// Call this function only once after the simulation is initialized
applyFlickerEffect(g.selectAll("circle").filter(d => d.users > 1500));
