document.addEventListener('input', (event) => {
  const target = event.target;

  // بررسی می‌کنیم که آیا باکسی که در حال تایپ در آن هستیم یک input یا textarea است
  if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) {
    const text = target.value || target.innerText;

    // بررسی زبان متن با استفاده از regex
    const isRTL = /[\u0600-\u06FF]/.test(text);

    // تغییر جهت متن بر اساس زبان
    target.style.direction = isRTL ? 'rtl' : 'ltr';
    target.style.textAlign = isRTL ? 'right' : 'left';
  }
});
