/* Loaded only by the temporary Codela admin import panel. */
(() => {
  const panel = document.getElementById('codela-blog-import');
  if (!panel) return;
  const button = panel.querySelector('[data-import-button]');
  const status = panel.querySelector('[data-import-status]');
  const progress = panel.querySelector('[data-import-progress]');
  const review = panel.querySelector('[data-import-review]');
  let running = false;
  const guard = (event) => {
    if (!running) return;
    event.preventDefault();
    event.returnValue = '';
  };
  button.addEventListener('click', async () => {
    if (running) return;
    running = true;
    button.disabled = true;
    progress.hidden = false;
    panel.setAttribute('aria-busy', 'true');
    status.textContent = 'Yazılar ve kapak görselleri aktarılıyor…';
    window.addEventListener('beforeunload', guard);
    try {
      let done = false;
      while (!done) {
        if (!panel.isConnected) return;
        const response = await fetch(panel.dataset.url, {
          method: 'POST', credentials: 'same-origin',
          body: new URLSearchParams({ action: 'codela_sf_blog_import', nonce: panel.dataset.nonce }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          throw new Error(result?.data?.message || 'Sunucudan yanıt alınamadı. Bağlantınızı kontrol edip devam edin.');
        }
        const data = result.data;
        if (!Number.isInteger(data.count) || data.count < 0 || data.count > 10 || data.total !== 10 || typeof data.done !== 'boolean') {
          throw new Error('Aktarma yanıtı doğrulanamadı. Sayfayı yenileyip devam edin.');
        }
        progress.value = data.count;
        done = data.done;
        status.textContent = `${data.count} / ${data.total} yazı görselleriyle aktarıldı.`;
      }
      button.hidden = true;
      review.hidden = false;
      status.textContent = '10 yazı görselleri ve SEO bilgileriyle taslak olarak hazır. Yazılar ekranından inceleyip yayımlayabilirsiniz.';
      review.focus();
    } catch (error) {
      status.textContent = error.message || 'Aktarma durdu. Kaldığınız yerden devam edebilirsiniz.';
      button.textContent = 'Kaldığı yerden devam et';
      button.disabled = false;
    } finally {
      running = false;
      panel.removeAttribute('aria-busy');
      window.removeEventListener('beforeunload', guard);
    }
  });
})();
