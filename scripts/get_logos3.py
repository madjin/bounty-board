import os
import requests
from bs4 import BeautifulSoup
import asyncio
from playwright.async_api import async_playwright

async def fetch_logo_urls(file_path):
    base_url = "https://app.dework.xyz/"
    logo_urls = []

    # Read the lines from the file
    with open(file_path, 'r') as file:
        lines = file.readlines()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for line in lines:
            line = line.strip()
            full_url = f"{base_url}{line}"

            try:
                page = await browser.new_page()
                await page.goto(full_url)
                await page.wait_for_timeout(5000)  # Wait for the page to fully load

                # Get the page content
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')

                logo_span = soup.find('span', class_="ant-avatar ant-avatar-circle ant-avatar-image ant-avatar-icon bg-component")
                if not logo_span:
                    print(f"Logo not found for {full_url}")
                    continue

                logo_img = logo_span.find('img')
                if not logo_img or 'src' not in logo_img.attrs:
                    print(f"Logo image not found for {full_url}")
                    continue

                logo_url = logo_img['src']
                print(f"wget -nc {logo_url} -O logo_{line}.png")
                logo_urls.append((line, logo_url))

            except Exception as e:
                print(f"Error processing {full_url}: {e}")
            finally:
                await page.close()

        await browser.close()

    return logo_urls

def download_logo(line, logo_url):
    try:
        # Step 4: Download the logo image
        logo_response = requests.get(logo_url, stream=True)
        if logo_response.status_code != 200:
            return

        # Save the logo image
        logo_image_path = f"logo_{line}.png"
        with open(logo_image_path, 'wb') as f:
            for chunk in logo_response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Saved logo image as {logo_image_path} in {os.getcwd()}")

    except Exception as e:
        print(f"Error downloading logo from {logo_url}: {e}")

async def main():
    file_path = 'empty2.txt'
    logo_urls = await fetch_logo_urls(file_path)
    for line, logo_url in logo_urls:
        download_logo(line, logo_url)

# Run the main function
asyncio.run(main())
