from playwright.sync_api import sync_playwright

def verify_table():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:8787")
            page.goto("http://localhost:8787")

            # Wait for table to be visible
            print("Waiting for table...")
            page.wait_for_selector("table", state="visible")

            # Check if rows are rendered
            rows = page.locator("tbody tr")
            count = rows.count()
            print(f"Found {count} rows")

            if count == 0:
                print("Error: No rows found in the table. Alpine initialization might have failed.")
                page.screenshot(path="/home/jules/verification/failed_verification.png")
                raise Exception("Table is empty")

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="/home/jules/verification/verification.png")
            print("Screenshot saved to /home/jules/verification/verification.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_table()
