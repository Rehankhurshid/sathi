gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

// hero interaction
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".hero-section",
    start: "top top",
    end: "bottom top",
    scrub: true,
  },
});

tl.to(
  ".hero-bg_wrap",
  {
    //yPercent: -5,
    scale: 1.15,
    ease: "none",
  },
  0,
)
  .to(".hero-obj_wrap", { yPercent: -12 }, 0)
  .to("#bottomCloud", { yPercent: -22 }, 0);
