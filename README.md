

![image](https://github.com/gm3/bounty-board/assets/7612104/d18da500-d657-4858-b2ee-ace9c90721de)

# Bounty-Board 0.01a

### Project Details
- DeWork Bounty Board that auto updates with a runner, just have to pull request or add new CSV files into the `bounties` folder.

## Features

<details>

</details>
    
### Code

#### update-tasks.yml
https://github.com/gm3/bounty-board/blob/main/.github/workflows/update_tasks.yml


<details>   
    
```
name: Update Tasks Text Files

on:
  push:
    paths:
      - '**.csv'

jobs:
  update_files:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3  # Use the latest version if available

      - name: Set up Python
        uses: actions/setup-python@v3  # Use the latest version if available
        with:
          python-version: 3.8

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pandas

      - name: Run script to update text files
        run: python scripts/update_tasks.py

      - name: Check for file changes
        id: git-check
        run: echo ::set-output name=status::$(git status --porcelain)

      - name: Configure Git
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"

      - name: List files in scripts directory
        run: ls -l ./scripts/    

      - name: Commit and push changes
        run: |
          git add ./scripts/*.txt index.html tasks.json
          git commit -m "Update tasks text files" || echo "No changes to commit"
          git pull --rebase origin main
          git push origin main
        if: steps.git-check.outputs.status != ''
```
    
</details>


---


#### update_tasks.py

<details>
    
```
import os
import pandas as pd
from datetime import datetime
import re
from html import escape
import json  # <- Import json

# Starting with the directory where the CSVs are stored
directory = './bounties/'
# Directory to save the text files
output_directory = '.'

# Checking and printing the number of CSV files detected
csv_files = [f for f in os.listdir(directory) if f.endswith('.csv')]
print(f"Number of CSV files detected: {len(csv_files)}")

# List to store tasks details
tasks = []

# Loop through each CSV
for filename in csv_files:
    try:
        # Read the CSV
        df = pd.read_csv(os.path.join(directory, filename))

        # Extract the required details
        for index, row in df.iterrows():
            task_name = row.get('Name', 'N/A')
            amount = row.get('Reward', '$TBD') if pd.notna(row.get('Reward')) else '$TBD'
            task_link = row.get('Link', '#')  # Extract the link or use a placeholder if not present
            activity = row.get('Activities', None)
            if activity and "created on" in activity:
                date_posted = ' '.join(activity.split("created on")[1].split()[0:4])
            else:
                date_posted = 'N/A'

            tasks.append({
                'name': task_name,
                'amount': amount,
                'date_posted': date_posted,
                'link': task_link  # Add the link to the task details
            })

        print(f"Extracted {df.shape[0]} tasks from {filename}.")
    except Exception as e:
        print(f"Error processing file {filename}: {e}")

# Save tasks to a JSON file after extracting tasks from all CSVs
json_file_path = os.path.join(output_directory, "tasks.json")
with open(json_file_path, "w") as f:
    json.dump(tasks, f)
print(f"JSON file generated: {json_file_path}")

print(f"Total tasks extracted: {len(tasks)}")

# Filter out tasks with valid date_posted
filtered_tasks = [task for task in tasks if task['date_posted'] != 'N/A']

month_abbr_to_num = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
}

# Convert date_posted to a datetime object for all tasks
for task in filtered_tasks:
    cleaned_date = task['date_posted'].strip()
    try:
        match = re.match(r"(\w{3}) (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2})", cleaned_date)
        if match:
            month_str, day_str, year_str, hour_str, minute_str = match.groups()
            task['date_posted_dt'] = datetime(int(year_str), month_abbr_to_num[month_str], int(day_str), int(hour_str), int(minute_str))
        else:
            raise ValueError("Invalid date format")
    except ValueError:
        print(f"Error parsing date: {cleaned_date} for task: {task['name']}")
        task['date_posted_dt'] = datetime.min

# Sort tasks by date_posted to get the newest tasks
sorted_tasks = sorted(filtered_tasks, key=lambda x: x['date_posted_dt'], reverse=True)

top_5_tasks = sorted_tasks[:5]

# Format the tasks to display just the amount and the name
formatted_tasks = [f"{task['amount']} | {task['name']} | " for task in top_5_tasks]



# ... [Rest of the script] ...

# Create a simple HTML page with the list of bounties
html_output = """
<!DOCTYPE html>
<html>
<head>
    <title>MetaBounty Hunter</title>
    <script src="https://d3js.org/d3.v5.min.js"></script>
    <link rel="stylesheet" type="text/css" href="style.css">

</head>
<body class="container">
    <div id="container" class="container">
        <div id="text-section" class="text-section">
            <h1>All Bounties</h1>
            <ul id="task-list">
"""

# Iterate through all tasks and generate list items for "All Bounties"
for task in tasks:
        print(f"Processing task: {task}")  # Debug: print the task being processed

        # Only escape if it's a string
        amount = escape(task.get('amount', '$TBD')) if isinstance(task.get('amount', '$TBD'), str) else task.get('amount', '$TBD')
        date_posted_dt = task.get('date_posted_dt', 'No Date')
        date_posted_dt = escape(str(date_posted_dt)) if isinstance(date_posted_dt, datetime) else 'No Date'
        link = escape(task.get('link', '#')) if isinstance(task.get('link', '#'), str) else task.get('link', '#')
        name = escape(task.get('name', 'Unnamed Task')) if isinstance(task.get('name', 'Unnamed Task'), str) else task.get('name', 'Unnamed Task')
        
        html_output += f'<li><a href="{link}" target="_blank">{name}</a> | {amount} | {date_posted_dt} </li>\n'

html_output += """            
            </ul>
        </div>
        <div id="svg-section">
            <div id="graph"></div>
        </div>
        <div id="content" class="content">
                    <h1>New Bounties</h1>
                    <ul>
"""

print(f"top_5_tasks contains: {top_5_tasks}")  # Debug: check if top_5_tasks is populated

if top_5_tasks:
    for task in top_5_tasks:
        print(f"Processing task: {task}")  # Debug: print the task being processed

        # Only escape if it's a string
        amount = escape(task.get('amount', '$TBD')) if isinstance(task.get('amount', '$TBD'), str) else task.get('amount', '$TBD')
        date_posted_dt = task.get('date_posted_dt', 'No Date')
        date_posted_dt = escape(str(date_posted_dt)) if isinstance(date_posted_dt, datetime) else 'No Date'
        link = escape(task.get('link', '#')) if isinstance(task.get('link', '#'), str) else task.get('link', '#')
        name = escape(task.get('name', 'Unnamed Task')) if isinstance(task.get('name', 'Unnamed Task'), str) else task.get('name', 'Unnamed Task')
        
        html_output += f'<li><a href="{link}" target="_blank">{name}</a> | {amount} | {date_posted_dt} </li>\n'
else:
    print("top_5_tasks is empty.")  # Debug: if top_5_tasks is empty, this line will print


html_output += """
                    </ul>
           
        </div>
    </div>
    
    <div id="tooltip" style="display:none;">
        <!-- Tooltip content -->
    </div>
    <script src="scripts/script.js"></script>

    <!-- HUD with badges -->
    <div class="hud">
        <img src="images/1.png" alt="Badge 1" class="badge" data-tooltip="This is Badge 1">
        <img src="images/2.png" alt="Badge 2" class="badge" data-tooltip="This is Badge 2">
        <img src="images/3.png" alt="Badge 3" class="badge" data-tooltip="This is Badge 3">
        <img src="images/4.png" alt="Badge 4" class="badge" data-tooltip="This is Badge 4">
        <img src="images/5.png" alt="Badge 5" class="badge" data-tooltip="This is Badge 5">
        <img src="images/6.png" alt="Badge 6" class="badge" data-tooltip="This is Badge 6">
        <img src="images/7.png" alt="Badge 7" class="badge" data-tooltip="This is Badge 7">
        <a href="https://discord.gg/m3-org" target="_blank"><img src="images/8.png" alt="Badge 8" class="badge" data-tooltip="This is Badge 8"></a>
        <a href="https://zora.co/collect/eth:0xb67ff46dfde55ad2fe05881433e5687fd1000312" target="_blank"><img src="images/9.png" alt="Badge 9" class="badge" data-tooltip="This is Badge 9"></a>
        <a href="https://github.com/M3-org/charter" target="_blank"><img src="images/10.png" alt="Badge 10" class="badge" data-tooltip="This is Badge 10"></a>
        <!-- Add more badges as needed -->
    </div>
</body>
</html>

    
"""

# Save the generated HTML to a file
html_file_path = os.path.join(output_directory, "index.html")
with open(html_file_path, 'w', encoding="utf-8") as html_file:
    html_file.write(html_output)

print(f"HTML page generated: {html_file_path}")

# ... [Rest of the script] ...


absolute_directory = './scripts/'

# Check and create target directory
if not os.path.exists(absolute_directory):
    os.makedirs(absolute_directory)

# Generate the text files
for index, task in enumerate(formatted_tasks, 1):
    file_path = os.path.join(absolute_directory, f"task{index}.txt")
    with open(file_path, "w") as file:
        file.write(task)
    print(f"Saved: {file_path}")

print("Text files updated successfully!")
```
    
</details>



---



#### script.js
https://github.com/gm3/bounty-board/blob/main/scripts/script.js
<details>

```
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
// Populate the task list with D3
const taskList = d3.select("#task-list");
tasks.forEach(task => {
    const listItem = taskList.append("li");
    listItem.text(`${task.description}: ${isNaN(task.amount) ? '$TBD' : task.amount}$`);
    listItem.on("click", function() {
        window.open(task.link, '_blank');
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
                tooltip.innerText = `${d.name}` + '|' + `${d.amount}` + '|' + `${d.date}` + '|';
            })
            .on("mouseout", function() {
                const tooltip = document.getElementById('tooltip');
                tooltip.style.display = "none";
            })
            .on("click", function(d) {
                window.open(d.link, '_blank');
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
```
    
</details>
    
    

---

# Things to do



## Other Ideas for Tracking Updates from the AI:



---



