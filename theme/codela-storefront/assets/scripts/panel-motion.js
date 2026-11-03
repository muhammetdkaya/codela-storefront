// Presentation only. The overlay controller owns dialog state, focus, scroll,
// responsive layout and cancellation identity. Durations remain in milliseconds.
export function animatePanelTransform(element, from, to, {duration, easing}) {
    if (!element?.animate || duration <= 0) return null;
    const value = element.style.getPropertyValue('transform');
    const priority = element.style.getPropertyPriority('transform');
    let animation = null, cancelled = false;
    const motion = {
        onfinish: null,
        cancel() {
            if (cancelled) return;
            cancelled = true;
            if (animation) { animation.onfinish = null; animation.cancel(); }
            if (value) element.style.setProperty('transform', value, priority);
            else element.style.removeProperty('transform');
        },
    };
    try {
        animation = element.animate([{transform:from}, {transform:to}], {duration, easing, fill:'forwards'});
        animation.onfinish = () => { if (!cancelled) motion.onfinish?.(); };
    } catch { return null; }
    return motion;
}
