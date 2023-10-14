document.addEventListener('mousemove', function(ev) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = (ev.clientX + 10) + 'px';
    tooltip.style.top = (ev.clientY - 10) + 'px';
}, false);

const colorScale = d3.scaleLinear()
    .domain([5, 1000, 2000])
    .range(["#006400", "#32CD32", "#7FFF00"]) // Dark green to light green
    .interpolate(d3.interpolateRgb);

const tasks = Array.from({ length: 200 }, (_, id) => ({
    id,
    name: `Task ${id + 1}`,
    users: Math.floor(Math.random() * 1996) + 5,
    url: `task${id + 1}`,
}));

// Add this block of code to populate the text list
const taskList = d3.select("#task-list");
tasks.forEach(task => {
    const listItem = taskList.append("li");
    listItem.text(`${task.name}: ${task.users} users`);
    listItem.on("click", function() {
        window.location.href = task.url;
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
const simulation = d3.forceSimulation(tasks)
    .force('charge', d3.forceManyBody().strength(30))
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.users)))
    .on('tick', ticked);

function ticked() {
    const circles = g.selectAll("circle")
        .data(tasks, d => d.id);

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

async function fetchAndUpdateTaskList() {
    try {
        const response = await fetch('/tasks.json');
        console.log('Fetch response:', response);

        const contentType = response.headers.get("content-type");
        console.log('Content-Type:', contentType);

        if (contentType && contentType.indexOf("application/json") !== -1) {
            if (response.status === 200) {
                const data = await response.json();
                console.log("Fetched data:", data);

                const taskList = d3.select("#task-list");
               taskList.html("");
                
                data.tasks.forEach(task => {
                    const listItem = taskList.append("li");
                    listItem.text(`${task.name}: ${task.users} users`);
                    listItem.on("click", function() {
                        window.location.href = task.url;
                    });
                });
            } else {
                console.error(`Received unexpected status code: ${response.status}`);
            }
        } else {
            throw new Error("Received non-JSON content type");
        }
    } catch (error) {
        console.error("Error fetching task list: ", error, error.stack);
    }
}



// Call this function to populate task list
fetchAndUpdateTaskList();


// Call this function only once after the simulation is initialized
applyFlickerEffect(g.selectAll("circle").filter(d => d.users > 1500));
