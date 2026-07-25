export const CATEGORIES_SECTION_ID = "categories";
export const CATEGORIES_HASH = `#${CATEGORIES_SECTION_ID}`;

/**
 * Smoothly scrolls to the homepage categories section.
 * Retries briefly so the target exists after client-side route transitions.
 */
export function scrollToCategoriesSection({ behavior = "smooth", maxAttempts = 24, intervalMs = 50 } = {}) {
  const attemptScroll = (attempt = 0) => {
    const section = document.getElementById(CATEGORIES_SECTION_ID);

    if (section) {
      section.scrollIntoView({ behavior, block: "start" });
      return;
    }

    if (attempt < maxAttempts) {
      window.setTimeout(() => attemptScroll(attempt + 1), intervalMs);
    }
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => attemptScroll());
  });
}
