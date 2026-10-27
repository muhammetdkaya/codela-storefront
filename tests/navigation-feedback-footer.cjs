// Shared DOM contract, called inside a real browser by shell-navigation-browser.
// It deliberately makes no layout, keyboard or screen-reader simulation claims.
module.exports = function checkFooterFeedback() {
 const feedback = window.codelaSFFeedback;
 const footer = document.createElement('footer');
 footer.className = 'sf-footer';
 footer.setAttribute('aria-label', 'Existing legal links');
 footer.setAttribute('data-merchant-footer', 'preserved');
 footer.innerHTML = '<a href="/privacy/">Privacy</a>';
 document.body.append(footer);
 const link = footer.querySelector('a');
 const snapshot = () => JSON.stringify([...footer.attributes].map(a => [a.name, a.value]).sort());
 const results = [];
 const check = (value, message) => { if (!value) throw new Error(message); results.push(message); };
 const start = owner => feedback.begin({url:link.href,link,owner});
 try {
  const initial = snapshot();
  check(!footer.inert, 'Idle footer stays usable');
  for (const owner of ['document', 'router']) {
   const token = start(owner);
   check(feedback.active(token) && footer.inert, owner + ' feedback locks covered footer');
   check(feedback.end(token) && snapshot() === initial, owner + ' completion restores all footer attributes');
  }
  footer.setAttribute('inert', 'merchant');
  const locked = snapshot();
  const token = start('document');
  feedback.end(token);
  check(snapshot() === locked, 'Pre-existing inert value is restored exactly');
  footer.removeAttribute('inert');
  const old = start('router'), current = start('document');
  check(!feedback.end(old) && footer.inert && feedback.active(current), 'Stale completion cannot unlock newer feedback');
  feedback.end(current);
  check(snapshot() === initial, 'Repeated begin and finish restore original footer');
  start('document');
  document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}));
  check(snapshot() === initial && document.activeElement === link, 'Escape restores footer and originating link focus');
  start('document');
  window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true}));
  check(snapshot() === initial, 'History restoration releases footer');
  const originalTimer = window.setTimeout;
  let expire;
  try {
   window.setTimeout = (callback, ms) => ms === 10000 ? (expire = callback, 0) : originalTimer(callback, ms);
   start('router');
  } finally { window.setTimeout = originalTimer; }
  check(typeof expire === 'function', 'Timeout cleanup is registered');
  expire();
  check(snapshot() === initial && document.activeElement === link, 'Timeout releases footer and restores focus');
  // Failed router work leaves feedback until native fallback arrives or timeout.
  const fallback = start('router');
  check(footer.inert && feedback.active(fallback), 'Pending native fallback keeps covered footer inert');
  window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:false}));
  check(snapshot() === initial, 'Fallback pageshow restores original footer');
  check(!feedback.end(fallback) && snapshot() === initial, 'Late failure cleanup is harmless after pageshow');
  return results;
 } finally { feedback.end(); footer.remove(); }
};
