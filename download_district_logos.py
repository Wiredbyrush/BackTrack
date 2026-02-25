import urllib.request
import os

logos = {
    "East_Forsyth.png": "https://resources.finalsite.net/images/f_auto,q_auto/v1735562642/forsythk12gaus/ntwtbpsc7jmhz66adbxy/EastForsythHighPrimaryLogoImage.png",
    "Forsyth_Central.png": "https://resources.finalsite.net/images/f_auto,q_auto/v1734708432/forsythk12gaus/ax1hx9lkienuady1lvcr/fosythcentralhigh.jpg",
    "Lambert.png": "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1752256094/forsythk12gaus/hdquirwrljzvvgjo9sa1/LamertLogo.png",
    "North_Forsyth.png": "https://resources.finalsite.net/images/f_auto,q_auto/v1735563019/forsythk12gaus/xhoxiskwyvfboq29dpn7/NorthForsythHighPrimaryLogoImage.png",
    "South_Forsyth.png": "https://resources.finalsite.net/images/f_auto,q_auto/v1741061483/forsythk12gaus/ftmzcqa9xesevqxxclbe/southforsythhs_initial.png",
    "West_Forsyth.png": "https://resources.finalsite.net/images/f_auto,q_auto/v1735563280/forsythk12gaus/b6a7me51xgcdfracomar/WestForsythHighPrimaryLogoImage.png"
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.forsyth.k12.ga.us/',
    'Sec-Fetch-Dest': 'image',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site'
}

for filename, url in logos.items():
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            content = response.read()
            filepath = os.path.join('/Users/rushwanthmahendran/FBLA Website coding and development/logos', filename)
            with open(filepath, 'wb') as f:
                f.write(content)
            print(f"Successfully downloaded {filename} ({len(content)} bytes)")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
