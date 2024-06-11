#!/bin/bash

# Loop through all PNG files in the images/ folder
for png_file in *.png; do
    # Get the basename of the PNG file (without extension)
    basename=$(basename "$png_file" .png)

    # Replace "template" with the basename in the template.gltf file
    sed "s/frontplate/$basename/g" template.gltf > "$basename.gltf"

    echo "Generated images/$basename.gltf"
done
