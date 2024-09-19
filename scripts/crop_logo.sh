#!/bin/bash

# Check if an image file is provided as an argument
if [ -z "$1" ]; then
    echo "Error: No image file provided."
    echo "Usage: $0 <image_file>"
    exit 1
fi

# Define the coordinates and dimensions of the logo region
logo_x=248
logo_y=58
logo_width=140
logo_height=140
logo_radius=70  # Radius of the circular mask

# Create a circular mask
convert -size "${logo_width}x${logo_height}" xc:none -fill white -draw "circle $logo_radius,$logo_radius $logo_radius,0" mask.png

# Crop the logo region with a circular transparent background
convert "$1" -alpha set \
    -crop "${logo_width}x${logo_height}+${logo_x}+${logo_y}" +repage \
    mask.png -alpha off -compose CopyOpacity -composite \
    -trim +repage \
    "${1%.*}_logo.png"

# Clean up the temporary mask file
rm mask.png

echo "Logo extracted as ${1%.*}_logo.png"
