#!/bin/bash

# Create output directory if it doesn't exist
mkdir -p out

# Loop through all .glb files in the current directory
for file in *.glb; do
    # Extract the base filename without extension
    base_name=$(basename "$file")
    
    # Temporary file name for resized glb
    temp_file="temp_$base_name"
    
    # Resize the textures to 512x768
    gltf-transform resize "$file" "$temp_file" --width 512 --height 768
    
    # Convert textures to WebP and output to the out/ folder with the same name
    gltf-transform webp "$temp_file" "out/$base_name"
    
    # Remove the temporary file
    rm "$temp_file"
    
    echo "Processed $file -> out/$base_name"
done

echo "All files processed and saved in the out/ folder."
