function initMiniShowreelCursorFollow() {
  const section = document.querySelector(".demo-section");
  const player = document.querySelector("[data-mini-showreel-player]");
  if (!section || !player) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  let posX = mouseX;
  let posY = mouseY;

  let lastX = mouseX;
  let lastY = mouseY;

  let velocity = 0;
  let isClosing = false;

  const followSpeed = 0.12;
  const tiltStrength = 12;
  const scaleStrength = 0.08;

  let targetRotateX = 0;
  let targetRotateY = 0;
  let currentRotateX = 0;
  let currentRotateY = 0;

  let targetScale = 1;
  let currentScale = 1;

  const rotationLerp = 0.08;
  const scaleLerp = 0.08;

  // Bounds cache
  let bounds = {
    minX: 0,
    maxX: window.innerWidth,
    minY: 0,
    maxY: window.innerHeight,
  };

  function updateBounds() {
    const sectionRect = section.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    const halfW = playerRect.width / 2;
    const halfH = playerRect.height / 2;

    bounds = {
      minX: halfW,
      minY: halfH,
      maxX: sectionRect.width - halfW,
      maxY: sectionRect.height - halfH,
    };
  }

  updateBounds();
  window.addEventListener("resize", updateBounds);

  // If using ScrollTrigger (important for pinned layouts)
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.addEventListener("refresh", updateBounds);
  }

  gsap.set(player, {
    position: "absolute",
    left: 0,
    top: 0,
    xPercent: -50,
    yPercent: -50,
    transformOrigin: "50% 50%",
    transformPerspective: 600,
  });

  /*player._resetToMouse = () => {
const rect = player.getBoundingClientRect();
posX = rect.left + rect.width / 2;
posY = rect.top + rect.height / 2;

gsap.set(player, {
x: posX,
y: posY
});
};*/

  player._resetToMouse = () => {
    const playerRect = player.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();

    // Convert viewport → section-local coordinates
    posX = playerRect.left - sectionRect.left + playerRect.width / 2;
    posY = playerRect.top - sectionRect.top + playerRect.height / 2;

    // Sync mouse position too (VERY IMPORTANT)
    mouseX = posX;
    mouseY = posY;

    gsap.set(player, {
      position: "absolute",
      left: 0,
      top: 0,
      xPercent: -50,
      yPercent: -50,
      transformOrigin: "50% 50%",
      transformPerspective: 600,
      x: posX,
      y: posY,
    });
  };

  section.addEventListener("mousemove", (e) => {
    const rect = section.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  player._setClosing = (val) => {
    isClosing = val;
  };

  gsap.ticker.add(() => {
    const isActive =
      player.getAttribute("data-mini-showreel-status") === "active";

    if (isActive || isClosing) return;

    // ✅ Clamp TARGET (not position) → smoother edge behavior
    const targetX = gsap.utils.clamp(bounds.minX, bounds.maxX, mouseX);
    const targetY = gsap.utils.clamp(bounds.minY, bounds.maxY, mouseY);

    // Smooth follow
    posX += (targetX - posX) * followSpeed;
    posY += (targetY - posY) * followSpeed;

    // Velocity for tilt + scale
    const dx = mouseX - lastX;
    const dy = mouseY - lastY;

    velocity = Math.sqrt(dx * dx + dy * dy);

    lastX = mouseX;
    lastY = mouseY;

    // Tilt effect
    targetRotateY = gsap.utils.clamp(-tiltStrength, tiltStrength, dx * 0.4);
    targetRotateX = gsap.utils.clamp(-tiltStrength, tiltStrength, -dy * 0.4);

    // Scale effect
    targetScale = 1 + Math.min(velocity * 0.002, scaleStrength);

    currentRotateX += (targetRotateX - currentRotateX) * rotationLerp;
    currentRotateY += (targetRotateY - currentRotateY) * rotationLerp;

    currentScale += (targetScale - currentScale) * scaleLerp;

    gsap.set(player, {
      x: posX,
      y: posY,
      rotateX: currentRotateX,
      rotateY: currentRotateY,
      scale: currentScale,
    });
  });
}
