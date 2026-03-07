from playwright.sync_api import sync_playwright

def verify_code_cell(page):
    page.goto("http://localhost:8787")

    # Wait for the table row to load
    page.wait_for_selector(".code-cell", state="visible")

    # Take a screenshot to show the focus outline
    cell = page.locator(".code-cell").first
    cell.focus()
    page.screenshot(path="verification.png")

    # Press Enter to test keyboard interaction
    page.keyboard.press("Enter")

    # Instead of waiting for visible, since Alpine toggles inline styles, wait for a short duration
    page.wait_for_timeout(500)

    # Take a screenshot to show the copied feedback
    page.screenshot(path="verification-copied.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        verify_code_cell(page)
    finally:
        browser.close()
