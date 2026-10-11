/** Reusable storefront output formatting: HTML, URL and currency. */
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const decode = value => { const e = document.createElement('textarea'); e.innerHTML = String(value ?? ''); return e.value; };
export const safeURL = value => { try { const url = new URL(value, location.href); return ['http:','https:'].includes(url.protocol) ? escape(url.href) : ''; } catch { return ''; } };
export const money = (amount, meta) => {
    const digits = Number(meta.currency_minor_unit || 0);
    const n = Number(amount) / 10 ** digits;
    return new Intl.NumberFormat(document.documentElement.lang || 'en', {style:'currency', currency:meta.currency_code, minimumFractionDigits:digits, maximumFractionDigits:digits}).format(n);
};
