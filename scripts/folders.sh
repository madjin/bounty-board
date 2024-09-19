#!/bin/bash

# Sort the list by the second column and remove duplicates
sort -t, -k2,2 list2.txt | awk -F, '!seen[$2]++' > sorted_list.txt

# Iterate over the sorted list and create folders
while read -r line; do
    # Split the line into columns
    IFS=',' read -ra cols <<< "$line"

    # Remove periods from the second column
    folder_name="${cols[1]//./}"

    # Create the folder if it doesn't exist
    if [ ! -d "$folder_name" ]; then
        mkdir "$folder_name"
        echo "Created folder: $folder_name"
    fi
done < sorted_list.txt
