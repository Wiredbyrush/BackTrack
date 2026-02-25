import cv2
import numpy as np
import json

def get_contours(image_path, color_lower, color_upper, min_area=1000, simplify_factor=0.005):
    img = cv2.imread(image_path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    mask = cv2.inRange(hsv, color_lower, color_upper)
    # morphological operations to connect components
    kernel = np.ones((5,5), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    results = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > min_area:
            epsilon = simplify_factor * cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            
            x, y, w, h = cv2.boundingRect(approx)
            points = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
            
            results.append({
                "area": float(area),
                "bounds": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
                "points": points
            })
            
    # Sort by descending area
    results.sort(key=lambda x: x["area"], reverse=True)
    return results

image_file = "/Users/rushwanthmahendran/FBLA Website coding and development/images/campus-bg.jpeg"

# Blue (Main building, Courts, Barn)
blue_lower = np.array([100, 100, 50])
blue_upper = np.array([130, 255, 255])
blue_shapes = get_contours(image_file, blue_lower, blue_upper, simplify_factor=0.003)

print("--- BLUE SHAPES ---")
for i, s in enumerate(blue_shapes):
    print(f"Index: {i}, Area: {s['area']}, Bounds: {s['bounds']}")
    
# Green (Stadium, Baseball/Softball)
green_lower = np.array([40, 50, 50])
green_upper = np.array([80, 255, 255])
green_shapes = get_contours(image_file, green_lower, green_upper, simplify_factor=0.003)

print("--- GREEN SHAPES ---")
for i, s in enumerate(green_shapes):
    print(f"Index: {i}, Area: {s['area']}, Bounds: {s['bounds']}")

# Save full point arrays to file for reference
with open("shapes.json", "w") as f:
    json.dump({"blue": blue_shapes, "green": green_shapes}, f, indent=2)

print("Coordinates saved to shapes.json")
