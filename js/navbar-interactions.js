const loadTl = gsap.timeline({
  scrollTrigger: {
    trigger: document.body,
    start: "top -1150px",
    toggleActions: "play none none reverse",
  },
});

// Safari has a known compositing perf bug with backdrop-filter on scroll —
// even blur(0px) forces a full-viewport recomposite every frame.
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

gsap.set(".navbar2_component", {
  ...(isSafari ? {} : { backdropFilter: "blur(0px)" }),
  backgroundColor: "transparent",
  borderColor: "transparent",
});

loadTl.to(".navbar2_component", {
  ...(isSafari
    ? { backgroundColor: "rgba(255, 255, 255, 0.92)" }
    : {
      backdropFilter: "blur(6px)",
      backgroundColor: "var(--base-color-neutral--nav-white)",
    }),
  borderColor: "var(--base-color-neutral--neutral-lightest)",
  ease: "power2.out",
});

function createColorScrollTrigger({ trigger, color }) {
  gsap
    .timeline({
      scrollTrigger: {
        trigger: trigger,
        start: "top 5%",
        end: "top 6%",
        scrub: true,
      },
    })
    .to(".navbar2_component", {
      color: color,
      duration: 0.3,
    })
    .to(
      ".nav-cta_wrap .button-2",
      {
        color: color,
        backgroundColor: "var(--base-color-neutral--nav-dark)",
        duration: 0.3,
      },
      "<",
    ).to(".menu-icon2_line-top", {
      backgroundColor: color,
      duration: 0.3,
    }, "<")
    .to(".menu-icon2_line-middle", {
      backgroundColor: color,
      duration: 0.3,
    }, "<")
    .to(".menu-icon2_line-bottom", {
      backgroundColor: color,
      duration: 0.3,
    }, "<")
}

const navColorTriggers = [
  {
    trigger: ".features-section",
    color: "var(--base-color-neutral--light-brown)",
  },
  {
    trigger: ".book-section",
    color: "var(--base-color-neutral--white)",
  },
];

navColorTriggers.forEach((config) => createColorScrollTrigger(config));
