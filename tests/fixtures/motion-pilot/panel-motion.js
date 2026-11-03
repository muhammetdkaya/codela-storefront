// Optional enhancement: a missing/blocked vendor must never break the storefront
// module graph or hold the first cart action. Until ready, use native WAAPI.
let animatePanelVendor = null;
export const panelMotionReady = import('codela-storefront/motion-mini').then(module => {
    if (typeof module.animate !== 'function') return false;
    animatePanelVendor = module.animate;
    return true;
}).catch(() => false);

// Presentation only. The overlay controller still owns dialog state, focus,
// scroll, responsive layout and cancellation identity. Durations arrive in ms.
export function animatePanelTransform(element, from, to, {duration, easing}) {
    if (!element?.animate || duration <= 0) return null;
    const value = element.style.getPropertyValue('transform');
    const priority = element.style.getPropertyPriority('transform');
    let animation = null, cancelled = false;
    const restore = () => {
        if (value) element.style.setProperty('transform', value, priority);
        else element.style.removeProperty('transform');
    };
    const motion = {
        onfinish: null,
        cancel() {
            if (cancelled) return;
            cancelled = true;
            // stop() clears Motion's queued native finish handler before it can
            // commit a stale endpoint. cancel() alone leaves that handler alive.
            if (animation?.stop) animation.stop();
            else if (animation) { animation.onfinish = null; animation.cancel(); }
            // Motion commits its final value. Never let that inline transform
            // survive a panel switch, resize, navigation or completed entrance.
            restore();
        },
    };
    const finish = () => { if (!cancelled) motion.onfinish?.(); };
    if (animatePanelVendor) try {
        const bezier = /^cubic-bezier\(([^)]+)\)$/.exec(easing);
        const aliases = {'ease':[.25,.1,.25,1], 'ease-in':'easeIn', 'ease-out':'easeOut', 'ease-in-out':'easeInOut'};
        const ease = bezier ? bezier[1].split(',').map(Number) : (aliases[easing] || easing);
        animation = animatePanelVendor(element, {transform:[from, to]}, {
            duration:duration / 1000, ease, onComplete:finish,
        });
    } catch { restore(); }
    if (!animation) {
        // Loading, blocked modules and runtime incompatibilities all keep the
        // same immediate native animation and cancellation contract.
        try {
            animation = element.animate([{transform:from}, {transform:to}], {duration, easing, fill:'forwards'});
            animation.onfinish = finish;
        } catch { return null; }
    }
    return motion;
}
