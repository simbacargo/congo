/* Shared Chart.js config for the LCI dashboard (light "paper ledger" theme).
   Load after vendor/chart.umd.min.js. */
window.LCI = (function () {
  "use strict";

  // Categorical palette (CVD-checked on white). Two of these are sub-3:1 on
  // white, so charts must always keep legends or direct labels on.
  var palette = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948"];

  var statusColors = {
    PENDING: "#b45309",
    VERIFIED: "#1c5cab",
    REMITTED: "#15803d",
    PAID: "#15803d",
    SCHEDULED: "#475569",
    CANCELLED: "#b91c1c",
  };

  if (window.Chart) {
    Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = "#898781";
    Chart.defaults.borderColor = "#e1e0d9";
    Chart.defaults.plugins.tooltip.backgroundColor = "#1c2126";
    Chart.defaults.plugins.tooltip.titleFont = { weight: "600" };
    Chart.defaults.plugins.tooltip.cornerRadius = 6;
    Chart.defaults.plugins.tooltip.padding = 8;
  }

  var defaults = {
    responsive: true,
    maintainAspectRatio: true,
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
  };

  // White gap between doughnut segments so adjacent hues never touch.
  var doughnutSegment = { borderColor: "#ffffff", borderWidth: 2 };

  return {
    palette: palette,
    statusColors: statusColors,
    defaults: defaults,
    doughnutSegment: doughnutSegment,
    accent: "#1c5cab",
    accentSoft: "rgba(28, 92, 171, 0.08)",
    money: "#006300",
  };
})();
