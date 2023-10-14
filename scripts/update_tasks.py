import os
import pandas as pd
from datetime import datetime
import re
from html import escape
import json  # <- Import json

# Starting with the directory where the CSVs are stored
directory = './bounties/'

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
json_file_path = 'tasks.json'  
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

# Directory to save the text files
output_directory = '.'

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
            <ul id="server-list"></ul>
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
