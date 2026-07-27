import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Scroll to top automatically on route changes except POP (browser back/forward)
    if (navType !== "POP") {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, [pathname, navType]);

  return null;
}
