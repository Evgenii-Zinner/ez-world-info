from playwright.sync_api import sync_playwright

def verify_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="e2e/verification/video")
        page = context.new_page()

        try:
            page.goto("http://localhost:8787")
            page.wait_for_timeout(1000)

            # Open column settings
            columns_btn = page.get_by_role('button', name='⚙️ Columns')
            columns_btn.click()
            page.wait_for_timeout(500)
            columns_btn.click()

            # Click CSV export
            csv_btn = page.get_by_role('button', name='⬇️ CSV')
            with page.expect_download() as download_info:
                csv_btn.click()
            download_csv = download_info.value
            print(f"Downloaded CSV: {download_csv.suggested_filename}")
            page.wait_for_timeout(1000)

            # Click JSON export
            json_btn = page.get_by_role('button', name='⬇️ JSON')
            with page.expect_download() as download_info:
                json_btn.click()
            download_json = download_info.value
            print(f"Downloaded JSON: {download_json.suggested_filename}")

            page.screenshot(path="e2e/verification/screenshot.png")
            page.wait_for_timeout(1000)

        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    verify_feature()
