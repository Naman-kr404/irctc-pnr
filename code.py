import requests

# -----------------------------------
# Image URL
# -----------------------------------
img_url = "https://www.indianrail.gov.in/enquiry/captchaDraw.png"

# -----------------------------------
# Download image
# -----------------------------------
img_response = requests.get(img_url)

# Save image locally
with open("captcha.png", "wb") as f:
    f.write(img_response.content)

print("Image downloaded")

# -----------------------------------
# Send image to Express API
# -----------------------------------
api_url = "http://localhost:3000/solve-captcha"

with open("captcha.png", "rb") as f:

    files = {
        "image": f
    }

    response = requests.post(api_url, files=files)

# -----------------------------------
# Print API response
# -----------------------------------
print("API Response:")
print(response.json())