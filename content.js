// تابع تنظیم جهت متن
function applyAutoDirection(element) {
  element.addEventListener('input', () => {
    const text = element.value || element.innerText; // گرفتن متن از input/textarea یا contenteditable
    const isRTL = /[\u0600-\u06FF]/.test(text); // بررسی زبان متن (حروف فارسی)
    element.style.direction = isRTL ? 'rtl' : 'ltr';
    element.style.textAlign = isRTL ? 'right' : 'left';
  });
}

// شناسایی و تنظیم برای عناصر موجود در صفحه
function initializeAutoDirection() {
  document.querySelectorAll('textarea, input, [contenteditable="true"]').forEach((element) => {
    applyAutoDirection(element);
  });
}

// نظارت بر تغییرات DOM برای عناصر جدید
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        if (
          node.matches('textarea, input') || // بررسی عناصر استاندارد
          node.isContentEditable // بررسی عناصر contenteditable
        ) {
          applyAutoDirection(node);
        }

        // بررسی عناصر داخل Shadow DOM یا گره‌های فرزند
        node.querySelectorAll?.('textarea, input, [contenteditable="true"]').forEach((child) => {
          applyAutoDirection(child);
        });
      }
    });
  });
});

// نظارت بر کل body
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// اجرای اولیه برای عناصر موجود
initializeAutoDirection();

