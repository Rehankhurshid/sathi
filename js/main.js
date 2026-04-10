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
        Object.assign(infoDiv.style, {
          position: "fixed",
          bottom: "10px",
          left: "10px",
          fontSize: "10px",
          color: "#888",
          opacity: "0.4",
          fontFamily: "system-ui, -apple-system, sans-serif",
          zIndex: "999999",
          pointerEvents: "none",
        });
        document.body.appendChild(infoDiv);
      }
    })
    .catch((err) => console.error("Could not fetch latest commit info", err));
});
