const loadTl = gsap.timeline({
  scrollTrigger: {
    trigger: document.body,
    start: "top -1150px",
    toggleActions: "play none none reverse",
  },
});

gsap.set(".navbar2_component", {
  backdropFilter: "blur(0px)",
  backgroundColor: "transparent",
  borderColor: "transparent",
});

loadTl.to(".navbar2_component", {
  backdropFilter: "blur(6px)",
  backgroundColor: "var(--base-color-neutral--nav-white)",
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
    );
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
