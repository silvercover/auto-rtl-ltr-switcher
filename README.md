# Auto RTL-LTR Switcher Chrome Extension

Switch text direction based on input language and add additional controls for toggling the page font (Vazirmatn) and overall page direction (RTL/LTR).

[Install Extension from Chrome Web Store](https://chromewebstore.google.com/detail/auto-rtlltr-switcher/iagbjlddhajgidlfcdpocafilcabjfbi)

## Chrome Browser Extension for Automatic Text Direction Adjustment

Many forms have sections for writing that are mostly left-to-right by default. This makes writing difficult and reduces readability. That’s why I created this simple extension, which automatically switches the text direction while typing.

## New Features:
- **Toggle Font:** With one click, you can toggle the page font to Vazirmatn (loaded from Google Fonts) and back to the default font.
- **Toggle Direction:** Manually toggle the entire page's direction (RTL/LTR) by clicking the extension icon.

## How to Manually Install the Extension:
- Extract the compressed file containing the source code you downloaded.
- Open Chrome and go to `chrome://extensions`.
- Enable Developer Mode.
- Click the "Load unpacked" button and select the extension folder.
- The extension will now be activated.

## How It Works:
When the user starts typing in any text box, the extension checks the input language:
- If the text contains Persian characters, the direction is set to right-to-left (RTL).
- If it contains Latin characters, it is set to left-to-right (LTR).
- Additionally, by clicking the extension icon, you can toggle the entire page's direction.

---

# افزونه مرورگر کروم برای تغییر جهت خودکار متن

این افزونه جهت متون را بر اساس زبان ورودی به‌صورت خودکار تنظیم می‌کند و کنترل‌های جدیدی برای تغییر فونت صفحه به فونت Vazirmatn (از طریق Google Fonts) و تغییر جهت کلی صفحه (RTL/LTR) اضافه شده است.

[نصب افزونه از طریق Chrome Store](https://chromewebstore.google.com/detail/auto-rtlltr-switcher/iagbjldlfcdpocafilcabjfbi)

## نصب دستی افزونه:
- یک پوشه با نام دلخواه شامل فایل‌های دانلودی (مانند آیکون‌ها، manifest.json و content.js) را آماده کنید.
- به مرورگر کروم رفته و آدرس `chrome://extensions` را باز کنید.
- حالت Developer Mode را فعال کنید.
- روی دکمه "Load unpacked" کلیک کرده و پوشه افزونه را انتخاب کنید.
- افزونه فعال خواهد شد.

## عملکرد:
وقتی کاربر در هر باکسی شروع به تایپ کند، افزونه زبان ورودی را بررسی می‌کند:
- اگر متن شامل حروف فارسی باشد، جهت به صورت راست‌به‌چپ (RTL) تنظیم می‌شود.
- اگر شامل حروف لاتین باشد، جهت به صورت چپ‌به‌راست (LTR) تنظیم می‌شود.
- علاوه بر این، با کلیک روی آیکن افزونه می‌توانید جهت کل صفحه را به صورت دستی تغییر دهید.
- همچنین با استفاده از کنترل‌های موجود در popup، می‌توانید فونت صفحه را به فونت Vazirmatn تغییر داده یا به فونت پیش‌فرض برگردانید.

![دمو](https://github.com/silvercover/auto-rtl-ltr-switcher/blob/main/demo.gif)
