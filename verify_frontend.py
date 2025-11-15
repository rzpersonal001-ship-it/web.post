from playwright.sync_api import sync_playwright

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Dashboard
    page.goto("http://localhost:3000/")
    page.screenshot(path="verification/01_dashboard.png")

    # New Post
    page.goto("http://localhost:3000/new-post")
    page.screenshot(path="verification/02_new-post.png")

    # Content Library
    page.goto("http://localhost:3000/library")
    page.screenshot(path="verification/03_library.png")

    # Schedules
    page.goto("http://localhost:3000/schedules")
    page.screenshot(path="verification/04_schedules.png")

    # Settings
    page.goto("http://localhost:3000/settings")
    page.screenshot(path="verification/05_settings.png")

    browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
