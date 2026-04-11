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

    // Count raw text length to decide granularity.
    // Short headings → per-character animation (looks great, few elements).
    // Long paragraphs → per-word animation (200+ GPU layers kills Safari).
    const textLen = heading.textContent.trim().length;
    const useWords = textLen > 120;

    const split = new SplitText(heading, {
      type: useWords ? "words" : "chars, words",
      wordsClass: "split-word",
    });

    const targets = useWords ? split.words : split.chars;

    // force3D: false — avoids promoting each element to its own compositor
    // layer. With 200+ elements, force3D: true creates 200+ GPU layers and
    // Safari's compositing pipeline can't keep up on scroll.
    gsap.set(targets, {
      opacity: 0.2,
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

    tl.to(targets, {
      opacity: 1,
      stagger: staggerValue,
      ease: "none",
    });
  });
}
