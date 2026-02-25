import cv2
import numpy as np
import os
import glob

# Get all the generated PNGs in the logos folder
logo_dir = '/Users/rushwanthmahendran/FBLA Website coding and development/logos/'
png_files = glob.glob(os.path.join(logo_dir, '*.png'))

# Skip Denmark.png since the user uploaded that manually and it already has transparency
files_to_process = [f for f in png_files if 'Denmark.png' not in f and 'Alliance.png' not in f]

for file_path in files_to_process:
    try:
        # Read the image including alpha channel (though AI generation initially has none)
        img = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
        
        # If the image doesn't have an alpha channel, add one
        if img.shape[2] == 3:
            # Convert to BGRA
            img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
        # Define the black color range we want to remove (very dark colors)
        # Backgrounds generated are solid #000000, but we allow tiny variance for compression artifacts
        lower_black = np.array([0, 0, 0, 255])
        upper_black = np.array([10, 10, 10, 255])
        
        # Create a mask of the black pixels
        black_mask = cv2.inRange(img, lower_black, upper_black)
        
        # Set the alpha channel of black pixels to 0 (completely transparent)
        img[black_mask > 0] = [0, 0, 0, 0]
        
        # Save the image back
        cv2.imwrite(file_path, img)
        print(f"Processed transparency for: {os.path.basename(file_path)}")
        
    except Exception as e:
        print(f"Error processing {os.path.basename(file_path)}: {e}")

print("Background removal complete.")
