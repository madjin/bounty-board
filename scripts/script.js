document.addEventListener('mousemove', function(ev) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = (ev.clientX + 10) + 'px';
    tooltip.style.top = (ev.clientY - 10) + 'px';
}, false);

const defaultRadius = 10;
const fixedRadius = 20;

// Extract tasks from the DOM
const taskListItems = Array.from(document.querySelectorAll("#task-list li"));

const tasks = taskListItems.map((li, index) => {
    const anchor = li.querySelector('a');
    const link = anchor ? anchor.getAttribute('href') : null;
    const name = anchor ? anchor.textContent : null;
    const remainingText = li.textContent.replace(anchor ? anchor.textContent : '', '').trim();

    // Extracting taskId from the link
    const taskIdMatch = link ? link.match(/taskId=([a-z0-9-]+)/i) : null;
    const taskId = taskIdMatch ? taskIdMatch[1] : null;
    
    let amount;
    let currency;
    if (remainingText.includes("$TBD")) {
        amount = "$TBD";
        currency = null;
    } else {
        const amountMatch = remainingText.match(/\|\s*(\d+(\.\d{1,2})?)\s*(USDC|USDT)?\s*\|/);
        amount = amountMatch ? parseFloat(amountMatch[1]) : NaN;
        currency = amountMatch ? amountMatch[3] : null;
    }


    const dateMatch = remainingText.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
    const date = dateMatch ? new Date(dateMatch[0]) : null;

    return {
        index,
        link,
        name,
        taskId,
        amount,
        currency,
        date,
    };
});

// Populate the task list with D3
const taskList = d3.select("#task-list");
tasks.forEach(task => {
    const listItem = taskList.append("li");
    listItem.text(`${task.description}: ${isNaN(task.amount) ? '$TBD' : task.amount}$`);
    listItem.on("click", function() {
        window.location.href = task.link;
    });
});
console.log(tasks);

// Min max of amounts    
const maxAmount = d3.max(tasks, d => d.amount);
const minAmount = d3.min(tasks, d => d.amount);


// Color scale
const colorScale = d3.scaleLinear()
    .domain([minAmount, (maxAmount - minAmount) / 2, maxAmount])
    .range(["#006400", "#32CD32", "#7FFF00"]) // Dark green to light green
    .interpolate(d3.interpolateRgb);

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
    .style("background-color", "black")
    .call(d3.zoom().scaleExtent([0.5, 5])
        .on("zoom", function() {
            let event = d3.event; // Get the event in D3 v5
            g.attr("transform", event.transform);
        }))
    .on("contextmenu", function() {
        let event = d3.event; // Get the event in D3 v5
        // Prevent the default right-click menu from showing
        event.preventDefault();
    })
    .on("mousedown", function() {
        let event = d3.event; // Get the event in D3 v5
        // Check for right click (or middle mouse click for panning)
        if (event.button === 2 || event.button === 1) {
            let startX = event.clientX;
            let startY = event.clientY;

            const initialTranslate = d3.zoomTransform(svg.node());

            svg.on("mousemove.pan", function() {
                let event = d3.event; // Get the event in D3 v5
                let diffX = event.clientX - startX;
                let diffY = event.clientY - startY;

                let newTransform = d3.zoomIdentity
                    .translate(initialTranslate.x + diffX, initialTranslate.y + diffY)
                    .scale(initialTranslate.k);
                svg.call(d3.zoom().transform, newTransform);
            });

            svg.on("mouseup.pan", function() {
                svg.on("mousemove.pan", null);
                svg.on("mouseup.pan", null);
            });
        }
    });

const g = svg.append("g");

// New simulation setup
const simulation = d3.forceSimulation(tasks)
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide().radius(fixedRadius))
    .on('tick', ticked);

function ticked() {
    const circles = g.selectAll("circle")
        .data(tasks, d => d.id);

    const newCircles = circles.enter()
        .append('circle')
        .attr('fill', d => {
            if (isNaN(d.amount) || d.amount === undefined) {
                return 'gray';  // default color if data is invalid
            }
            return colorScale(d.amount);
        })
        .attr('r', fixedRadius)
        .on("mouseover", function(d) {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.display = "inline";
            tooltip.innerText = `${d.name}` + '|' + `${d.amount}` + '|' + `${d.date}` + '|' ;
        })
        .on("mouseout", function() {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.display = "none";
        })
        .on("click", function(d) {
            window.location.href = d.link;
        });

    newCircles.merge(circles)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

    circles.exit().remove();
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


