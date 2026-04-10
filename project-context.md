# SATHI Project Context

## Overview
- **Project Goal**: Enhance the SATHI Webflow site with advanced custom javascript behaviors that exceed Webflow's native capabilities.
- **Repository**: Hosted at `https://github.com/Rehankhurshid/sathi`.
- **Hosting / CDN**: Static files deployed securely to Vercel at `https://sathi-rho.vercel.app`.
- **Frontend Architecture**: The UI is built in Webflow (`https://sathi-web.webflow.io/`). Because of Webflow's 10,000 character custom code limit, all JavaScript logic has been decoupled and hosted on Vercel. Webflow imports these scripts via `<script>` tags.

## Directory Structure
The original monolithic code was split into multiple scalable modules within the `/js` directory:
- `main.js`: The central entry point. Runs exactly once on `DOMContentLoaded` and initializes all modules.
- `config.js`: Centralized constants (e.g., Parallax config).
- `parallax-hero.js`: Three.js powered WebGL parallax hero effect.
- `hero-scroll.js`: GSAP scroll-triggered animations.
- `navbar-interactions.js`: Dynamic blur and color state detection for the sticky navbar.
- `highlight-text.js`: GSAP SplitText logic for headings.
- `mini-showreel-player.js`: GSAP Flip lightbox video logic.
- `mini-showreel-cursor-follow.js`: Physics-based cursor trailing effect.
- `bunny-player.js`: Custom HLS.js streaming video solution.
- `scroll-snap.js`: Lenis-driven wheel event hijacking to force section snapping (fixing the rapid-flick overshoot).
- `v2/`: A duplicated directory attempted for cache-busting Vercel's edge network.

## Current State & Challenges
1. **Scroll Snapping**: We introduced a fix in `scroll-snap.js` to prevent the page from overshooting to the 2nd feature when flicking fast from the top hero. Logic was added to cleanly capture boundary entry.
2. **Caching**: We are currently experiencing an aggressive caching issue. Code pushed to GitHub correctly builds on Vercel, but Webflow does not appear to reflect the new scripts. 
3. **Debugging Setup**: 
   - A dynamic fetch to the GitHub API was added to `main.js` to pull and render the timestamp of the latest code push into the bottom left corner. 
   - A giant red border was temporarily injected to the body. Neither are showing up for the user, confirming that the new files aren't being fetched or executed on the live site.

## Next Troubleshooting Steps to Try
- Verify if Vercel is actually automatically deploying from GitHub. If the Git connection is paused/broken, the code is on GitHub but Vercel isn't building it.
- Verify if Webflow is stripping script source query parameters or if the import paths are correctly formed.
- Use Chrome DevTools `Network` tab inside Webflow to see which `main.js` is actually being downloaded, and what its HTTP Response Headers are.
