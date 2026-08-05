/** Registers a DOM globally so components can be mounted under `bun test`. */
import { mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({ url: "http://localhost/app/" });

// Pin the language before anything imports `@/i18n`, whose init reads this key
// once at module load. Without it the locale would follow the host machine's
// `navigator.language` and the assertions would pass or fail by accident.
localStorage.setItem("freddy.lang", "fr");

// happy-dom has no canvas 2D context, so Chart.js fails to initialise and
// retries in a loop that starves the event loop — which showed up as random
// 5s timeouts on whichever test happened to run alongside a charting page.
// These tests exercise routing and data wiring, not chart internals, so the
// chart components are replaced with inert markers.
mock.module("react-chartjs-2", () => {
  const stub = (kind: string) => () => <canvas data-testid={`chart-${kind}`} />;
  return {
    Line: stub("line"),
    Bar: stub("bar"),
    Doughnut: stub("doughnut"),
    Pie: stub("pie"),
    Chart: stub("generic"),
  };
});
