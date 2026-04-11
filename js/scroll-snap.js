const snapZone = document.getElementById("snap-zone");
const snapItems = Array.from(document.querySelectorAll("[data-snap-item]"));
const FEATURE_COUNT = snapItems.length;
snapZone.style.height = FEATURE_COUNT * 100 + "vh";

// ── State ──
let isSnapping = false;
let currentSnapIndex = 0;
let isAnimating = false;
let isExiting = false;
let isCooling = false;
let lastDeltaY = 0;
let lastDirection = 0;
let lastExitDir = 0;       // Which direction we exited (±1), cleared after cooldown
let exitCooldownTimer = null;

// ── Helpers ──

function isInSnapZone() {
  const rect = snapZone.getBoundingClientRect();
  return rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
}

/**
 * Distinguish trackpad momentum from a deliberate new scroll.
 *
 * Momentum: rapid fire, same direction, DECAYING deltaY.
 * New scroll: direction change OR deltaY SPIKES upward (new finger touch).
 */
function isDeliberateScroll(e) {
  const absDelta = Math.abs(e.deltaY);
  const direction = e.deltaY > 0 ? 1 : -1;

  // Direction changed → new gesture
  if (direction !== lastDirection) {
    lastDeltaY = absDelta;
    lastDirection = direction;
    return true;
  }

  // deltaY spiked upward → new gesture
  if (absDelta > lastDeltaY * 1.3) {
    lastDeltaY = absDelta;
    lastDirection = direction;
    return true;
  }

  // Decaying or flat → momentum
  lastDeltaY = absDelta;
  lastDirection = direction;
  return false;
}

function scrollToItem(index) {
  const item = snapItems[index];
  if (!item) return;

  isAnimating = true;
  isCooling = false;
  const targetY = item.getBoundingClientRect().top + window.scrollY;

  gsap.to(window, {
    scrollTo: { y: targetY, autoKill: false },
    duration: 0.6,
    ease: "power2.inOut",
    onComplete: () => {
      isAnimating = false;
      isCooling = true;
      lastDeltaY = Infinity; // Forces first trailing event to read as "decaying"
    },
  });
}

function enterSnapMode() {
  if (isSnapping) return;
  isSnapping = true;
  lenis.stop();
}

function exitSnapMode(scrollTargetY, exitDirection) {
  if (!isSnapping) return;
  isSnapping = false;
  isAnimating = true;
  isExiting = true;
  isCooling = false;
  lastExitDir = exitDirection || 0;

  // Clear any previous cooldown
  clearTimeout(exitCooldownTimer);

  if (typeof scrollTargetY === "number") {
    gsap.to(window, {
      scrollTo: { y: scrollTargetY, autoKill: false },
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        isAnimating = false;
        isExiting = false;
        lenis.start();
        // Keep exit direction alive for a short cooldown to block re-entry
        exitCooldownTimer = setTimeout(() => { lastExitDir = 0; }, 600);
      },
    });
  } else {
    isAnimating = false;
    isExiting = false;
    lenis.start();
    exitCooldownTimer = setTimeout(() => { lastExitDir = 0; }, 600);
  }
}

// ── Wheel listener (passive: false → allows preventDefault) ──

window.addEventListener(
  "wheel",
  (e) => {
    const inSnap = isInSnapZone();

    // A) Not snapping yet
    if (!isSnapping) {
      // Exit animation in progress → swallow, don't re-enter
      if (isExiting) {
        e.preventDefault();
        return;
      }
      if (!inSnap) return;

      // Block re-entry if we JUST exited in this same direction
      // (Safari fires trailing wheel events after GSAP onComplete)
      const scrollDir = e.deltaY > 0 ? 1 : -1;
      if (lastExitDir !== 0 && scrollDir === lastExitDir) {
        e.preventDefault();
        return;
      }

      // Crossing into snap zone
      e.preventDefault();
      lastExitDir = 0;
      clearTimeout(exitCooldownTimer);
      enterSnapMode();
      lastDirection = e.deltaY > 0 ? 1 : -1;
      lastDeltaY = Math.abs(e.deltaY);

      currentSnapIndex = e.deltaY > 0 ? 0 : FEATURE_COUNT - 1;
      scrollToItem(currentSnapIndex);
      return;
    }

    // B) In snap mode — always prevent default
    e.preventDefault();

    // GSAP animating → swallow
    if (isAnimating) return;

    // Cooling: absorbing post-animation momentum
    if (isCooling) {
      if (!isDeliberateScroll(e)) return;
      isCooling = false;
    }

    // C) Accept deliberate scroll
    const direction = e.deltaY > 0 ? 1 : -1;
    const nextIndex = currentSnapIndex + direction;

    // Exit upward
    if (nextIndex < 0) {
      currentSnapIndex = 0;
      const topY = snapZone.getBoundingClientRect().top + window.scrollY - 2;
      exitSnapMode(topY, -1);
      return;
    }

    // Exit downward
    if (nextIndex >= FEATURE_COUNT) {
      currentSnapIndex = FEATURE_COUNT - 1;
      const bottomY =
        snapZone.getBoundingClientRect().bottom +
        window.scrollY -
        window.innerHeight +
        2;
      exitSnapMode(bottomY, 1);
      return;
    }

    currentSnapIndex = nextIndex;
    scrollToItem(currentSnapIndex);
  },
  { passive: false },
);

// ── Safety: re-enable Lenis if user leaves snap zone by other means ──
window.addEventListener(
  "scroll",
  () => {
    if (isAnimating) return;
    if (isSnapping && !isInSnapZone()) {
      exitSnapMode();
    }
  },
  { passive: true },
);
