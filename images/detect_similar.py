import os
from PIL import Image
import imagehash

def find_similar_images(directory, similarity_threshold=99):
    # List all PNG files in the directory
    png_files = [file for file in os.listdir(directory) if file.lower().endswith('.png')]

    # Iterate through each pair of images
    for i, img1_name in enumerate(png_files):
        img1_path = os.path.join(directory, img1_name)
        img1_hash = imagehash.average_hash(Image.open(img1_path))

        for img2_name in png_files[i+1:]:
            img2_path = os.path.join(directory, img2_name)
            img2_hash = imagehash.average_hash(Image.open(img2_path))

            # Calculate similarity between hashes
            similarity = (1 - (img1_hash - img2_hash) / len(img1_hash.hash)) * 100

            # If similarity is above threshold, print the pair
            if similarity >= similarity_threshold:
                print(f"Similarity between {img1_name} and {img2_name}: {similarity:.2f}%")

if __name__ == "__main__":
    directory = "."  # Current directory
    similarity_threshold = 99  # Threshold for similarity (in percentage)
    find_similar_images(directory, similarity_threshold)
