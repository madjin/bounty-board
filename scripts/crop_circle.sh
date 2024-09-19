#!/bin/bash

# Create the output directory if it doesn't exist
mkdir -p out

# Loop through all PNG files in the current directory
for file in *.png; do
  # Resize the image to 140x140 pixels
  convert "$file" -resize 140x140! "resized_$file"

  # Apply the circular mask
  convert "resized_$file" circle.png -alpha set -compose DstIn -composite -trim +repage "out/$file"

  # Clean up the intermediate resized file
  rm "resized_$file"
done
