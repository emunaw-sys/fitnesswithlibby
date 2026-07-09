"use client";

import { useEffect } from "react";

const WIDGET_SRC =
  "https://payv2.classfit.com/classes/widget/js/ab3861fc87a4a2f8a562539aff332386";

/**
 * Embeds the classfit booking widget. The third-party script looks for the
 * #VA-iframe-container element and injects the live schedule / booking iframe
 * into it, so we render the container and load the script once after mount.
 */
export default function BookingWidget() {
  useEffect(() => {
    // don't inject the script twice (StrictMode re-runs, client navigations)
    if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    document.body.appendChild(script);
    // no cleanup: the widget manages the container itself, and removing the
    // script tag would not unload an already-injected iframe
  }, []);

  return (
    <div
      id="VA-iframe-container"
      style={{ width: "100%", minHeight: 190 }}
    />
  );
}
