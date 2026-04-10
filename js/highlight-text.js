function initHighlightText() {
  const headings = document.querySelectorAll("[data-highlight-text]");
  if (!headings.length) return;

  headings.forEach((heading) => {
    const scrollStart =
      heading.getAttribute("data-highlight-scroll-start") || "top 75%";
    const scrollEnd =
      heading.getAttribute("data-highlight-scroll-end") || "bottom 70%";
    const staggerValue =
      parseFloat(heading.getAttribute("data-highlight-stagger")) || 0.05;

    const split = new SplitText(heading, {
      type: "chars, words",
      wordsClass: "split-word",
    });

    gsap.set(split.chars, {
      opacity: 0.2,
      force3D: true,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heading,
        start: scrollStart,
        end: scrollEnd,
        scrub: 1.2,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
      },
    });

    tl.to(split.chars, {
      opacity: 1,
      stagger: staggerValue,
      ease: "none",
    });
  });
}
