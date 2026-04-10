document.addEventListener("DOMContentLoaded", function () {
  initHighlightText();
  initMiniShowreelCursorFollow();
  initBunnyPlayer();
  initMiniShowreelPlayer();

  // Dynamically inject latest code push timestamp
  fetch("https://api.github.com/repos/Rehankhurshid/sathi/commits/main")
    .then((res) => res.json())
    .then((data) => {
      if (data && data.commit && data.commit.author) {
        const date = new Date(data.commit.author.date);
        
        // Format it nicely
        const dateString = date.toLocaleString();
        
        const infoDiv = document.createElement("div");
        infoDiv.textContent = `Latest Code Push: ${dateString}`;
        infoDiv.style.cssText = `
          position: fixed !important;
          bottom: 10px !important;
          left: 10px !important;
          font-size: 11px !important;
          color: white !important;
          opacity: 0.5 !important;
          mix-blend-mode: difference !important;
          font-family: monospace, system-ui, sans-serif !important;
          z-index: 2147483647 !important;
          pointer-events: none !important;
        `;
        document.body.appendChild(infoDiv);
      }
    })
    .catch((err) => {
      console.error("Could not fetch latest commit info", err);
      // Fallback if GitHub API is rate-limited
      const infoDiv = document.createElement("div");
      infoDiv.textContent = `Latest Code Push: Just now`;
      infoDiv.style.cssText = `
        position: fixed !important;
        bottom: 10px !important;
        left: 10px !important;
        font-size: 11px !important;
        color: white !important;
        opacity: 0.5 !important;
        mix-blend-mode: difference !important;
        font-family: monospace, system-ui, sans-serif !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
      `;
      document.body.appendChild(infoDiv);
    });
});
