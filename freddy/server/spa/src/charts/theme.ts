/**
 * Chart.js theme — a direct port of static/js/charts.js so the SPA charts and
 * the Django dashboard charts are visually identical during the transition.
 *
 * Only the chart pieces actually used are registered, keeping the charts
 * chunk small (Chart.js is tree-shakeable via the modular build).
 */
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";

Chart.register(
  ArcElement, BarController, BarElement, CategoryScale, DoughnutController,
  Filler, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip,
);

/** Categorical palette, CVD-checked on white. Keep legends on: two of these
 *  sit below 3:1 contrast against white and can't carry meaning alone. */
export const palette = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948"];

export const statusColors: Record<string, string> = {
  PENDING: "#b45309",
  VERIFIED: "#1c5cab",
  REMITTED: "#15803d",
  PAID: "#15803d",
  SCHEDULED: "#475569",
  CANCELLED: "#b91c1c",
};

export const accent = "#1c5cab";
export const accentSoft = "rgba(28, 92, 171, 0.08)";
export const money = "#006300";

Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = "#898781";
Chart.defaults.borderColor = "#e1e0d9";
Chart.defaults.plugins.tooltip.backgroundColor = "#1c2126";
Chart.defaults.plugins.tooltip.titleFont = { weight: "bold" };
Chart.defaults.plugins.tooltip.cornerRadius = 6;
Chart.defaults.plugins.tooltip.padding = 8;

/**
 * Shared axis/legend styling for the cartesian charts.
 *
 * Chart.js types options per chart kind and they are not mutually assignable,
 * so this is spread into concretely-typed objects below rather than being
 * typed as a `"line" | "bar"` union.
 */
const cartesianBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "#6b6f76", boxWidth: 10, boxHeight: 10, font: { size: 10 } },
    },
  },
  scales: {
    x: {
      ticks: { color: "#898781", font: { size: 10 }, maxRotation: 0, autoSkip: true },
      grid: { display: false },
      border: { color: "#c3c2b7" },
    },
    y: {
      beginAtZero: true,
      ticks: { color: "#898781", font: { size: 10 } },
      grid: { color: "#eeede6" },
      border: { display: false },
    },
  },
} as const;

export const lineOptions: ChartOptions<"line"> = cartesianBase;
export const barOptions: ChartOptions<"bar"> = cartesianBase;

/** Horizontal bars, used for the driver health-coverage breakdown. */
export const horizontalBarOptions: ChartOptions<"bar"> = {
  ...cartesianBase,
  indexAxis: "y",
};

/** Doughnuts have no axes; a white gap keeps adjacent hues from touching. */
export const doughnutOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: "#6b6f76", boxWidth: 10, boxHeight: 10, font: { size: 10 } },
    },
  },
};

export const doughnutSegment = { borderColor: "#ffffff", borderWidth: 2 };
