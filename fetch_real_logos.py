import urllib.request
import urllib.parse
import json
import os

schools = [
    ("East Forsyth High School (Georgia)", "East_Forsyth.png"),
    ("Forsyth Central High School", "Forsyth_Central.png"),
    ("Lambert High School", "Lambert.png"),
    ("North Forsyth High School (Georgia)", "North_Forsyth.png"),
    ("South Forsyth High School", "South_Forsyth.png"),
    ("West Forsyth High School (Georgia)", "West_Forsyth.png")
]

for title, filename in schools:
    escaped_title = urllib.parse.quote(title)
    # Also fetch pageprops to get the page_image_free if pageimages doesn't have it
    url = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&format=json&piprop=original&titles={escaped_title}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'original' in page_data:
                    img_url = page_data['original']['source']
                    print(f"Downloading original image {img_url} to {filename}")
                    
                    img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(img_req) as img_resp:
                        with open(f"/Users/rushwanthmahendran/FBLA Website coding and development/logos/{filename}", 'wb') as f:
                            f.write(img_resp.read())
                else:
                    print(f"No original image found for {title} in pageimages API.")
                    # Try to see if there's any image we can find differently or if the article name is wrong.
                    
    except Exception as e:
        print(f"Error on {title}: {e}")
