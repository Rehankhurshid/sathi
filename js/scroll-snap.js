const snapZone = document.getElementById("snap-zone");
const snapItems = Array.from(document.querySelectorAll("[data-snap-item]"));
const FEATURE_COUNT = snapItems.length;
snapZone.style.height = FEATURE_COUNT * 100 + "vh";

let isSnapping = false;
let currentSnapIndex = 0;
let isScrollingToSnap = false;
let lastWheelTime = 0;


function isInSnapZone() {
  const rect = snapZone.getBoundingClientRect();
  return rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
}

function scrollToItem(index) {
  const item = snapItems[index];
  if (!item) return;
  isScrollingToSnap = true;
  const targetY = item.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: targetY, behavior: "smooth" });
  setTimeout(() => {
    isScrollingToSnap = false;
  }, 700);
}

function enterSnapMode() {
  if (isSnapping) return;
  isSnapping = true;
  lenis.stop();
}

function exitSnapMode(scrollTargetY) {
  if (!isSnapping) return;
  isSnapping = false;
  if (typeof scrollTargetY === "number") {
    window.scrollTo({ top: scrollTargetY, behavior: "smooth" });
    setTimeout(() => lenis.start(), 700);
  } else {
    lenis.start();
  }
}

window.addEventListener(
  "wheel",
  (e) => {
    const now = Date.now();
    const inSnap = isInSnapZone();

    // 1. If we are currently outside the zone and not snapping, let Native/Lenis scroll freely
    if (!isSnapping) {
      if (!inSnap) return;

      // CROSSING THE BOUNDARY INWARD
      enterSnapMode();
      lastWheelTime = now;

      // Determine entry item based on scroll direction
      if (e.deltaY > 0) {
        currentSnapIndex = 0;
      } else {
        currentSnapIndex = FEATURE_COUNT - 1;
      }

      scrollToItem(currentSnapIndex);
      return;
    }

    // 2. WE ARE NOW TRAPPED IN SNAP MODE
    
    // If the window is currently being smooth-scrolled to an item, OR if trackpad momentum 
    // is trailing, we ABSORB the wheel event by resetting the cooldown timer.
    // This forces the user's trackpad to be completely silent for 400ms before accepting a new flick.
    if (isScrollingToSnap || now - lastWheelTime < 400) {
      lastWheelTime = now; // ABSOLUTELY CRITICAL: kills trailing trackpad momentum sweeps
      return;
    }

    // 3. User has waited, trackpad momentum is dead. Register new deliberate flick.
    lastWheelTime = now;

    const direction = e.deltaY > 0 ? 1 : -1;
    const nextIndex = currentSnapIndex + direction;

    // CROSSING THE BOUNDARY OUTWARD
    if (nextIndex < 0) {
      currentSnapIndex = 0;
      const topY = snapZone.getBoundingClientRect().top + window.scrollY - 2;
      exitSnapMode(topY);
      return;
    }

    if (nextIndex >= FEATURE_COUNT) {
      currentSnapIndex = FEATURE_COUNT - 1;
      const bottomY =
        snapZone.getBoundingClientRect().bottom +
        window.scrollY -
        window.innerHeight +
        2;
      exitSnapMode(bottomY);
      return;
    }

    // SNAP TO NEXT ITEM
    currentSnapIndex = nextIndex;
    scrollToItem(currentSnapIndex);
  },
  { passive: true },
);

// ── Safety: re-enable Lenis if user navigates away from snap zone
//    (e.g. via keyboard, browser back, or programmatic scroll) ──
window.addEventListener(
  "scroll",
  () => {
    if (isScrollingToSnap) return;
    if (isSnapping && !isInSnapZone()) {
      exitSnapMode();
    }
  },
  { passive: true },
);
