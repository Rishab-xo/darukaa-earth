import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { BarChart3 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function AnalyticsChart({ data }) {
  const [activeMetric, setActiveMetric] = useState("all");

  if (!data || data.length === 0)
    return (
      <div className="empty-state" style={{ padding: "24px 12px" }}>
        <BarChart3 size={28} className="empty-state-icon" />
        <span>No analytics data available yet.</span>
      </div>
    );

  const formattedLabels = data.map((d) =>
    new Date(d.recorded_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  );

  const carbonDataset = {
    label: "Carbon Sequestration (Tons)",
    data: data.map((d) => d.carbon_sequestration),
    borderColor: "#10b981",
    backgroundColor: (ctx) => {
      const chart = ctx.chart;
      const { ctx: context, chartArea } = chart;
      if (!chartArea) return "rgba(16, 185, 129, 0.08)";
      const gradient = context.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom,
      );
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.22)");
      gradient.addColorStop(0.7, "rgba(16, 185, 129, 0.04)");
      gradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");
      return gradient;
    },
    borderWidth: 2.2,
    pointRadius: 3.5,
    pointHoverRadius: 6.5,
    pointBackgroundColor: "#10b981",
    pointBorderColor: "#09090b",
    pointBorderWidth: 2,
    tension: 0.35,
    fill: true,
    yAxisID: "y",
  };

  const biodiversityDataset = {
    label: "Biodiversity Score (/100)",
    data: data.map((d) => d.biodiversity_index),
    borderColor: "#38bdf8",
    backgroundColor: (ctx) => {
      const chart = ctx.chart;
      const { ctx: context, chartArea } = chart;
      if (!chartArea) return "rgba(56, 189, 248, 0.08)";
      const gradient = context.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom,
      );
      gradient.addColorStop(0, "rgba(56, 189, 248, 0.18)");
      gradient.addColorStop(0.7, "rgba(56, 189, 248, 0.03)");
      gradient.addColorStop(1, "rgba(56, 189, 248, 0.0)");
      return gradient;
    },
    borderWidth: 2.2,
    pointRadius: 3.5,
    pointHoverRadius: 6.5,
    pointBackgroundColor: "#38bdf8",
    pointBorderColor: "#09090b",
    pointBorderWidth: 2,
    tension: 0.35,
    fill: true,
    yAxisID: "y1",
  };

  const datasets =
    activeMetric === "carbon"
      ? [carbonDataset]
      : activeMetric === "bio"
        ? [biodiversityDataset]
        : [carbonDataset, biodiversityDataset];

  const chartData = {
    labels: formattedLabels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // Custom header controls used instead for cleaner UI
      },
      tooltip: {
        backgroundColor: "#16161c",
        titleColor: "#ffffff",
        bodyColor: "rgba(255, 255, 255, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: { family: "Inter", size: 12, weight: "600" },
        bodyFont: { family: "Inter", size: 11.5 },
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            if (context.dataset.yAxisID === "y") {
              return ` Carbon: ${val} Tons`;
            }
            return ` Biodiversity: ${val} / 100`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgba(255, 255, 255, 0.4)",
          font: { family: "Inter", size: 10.5 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        grid: {
          color: "rgba(255, 255, 255, 0.04)",
          drawBorder: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        type: "linear",
        display: activeMetric === "all" || activeMetric === "carbon",
        position: "left",
        ticks: {
          color: "rgba(16, 185, 129, 0.8)",
          font: { family: "Inter", size: 10 },
          callback: (v) => `${v} T`,
        },
        grid: {
          color: "rgba(255, 255, 255, 0.04)",
          borderDash: [3, 3],
        },
        border: {
          display: false,
        },
      },
      y1: {
        type: "linear",
        display: activeMetric === "all" || activeMetric === "bio",
        position: "right",
        min: 0,
        max: 100,
        ticks: {
          color: "rgba(56, 189, 248, 0.8)",
          font: { family: "Inter", size: 10 },
          callback: (v) => `${v}`,
        },
        grid: {
          drawOnChartArea: false, // avoid overlapping grid lines
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div
      className="chart-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height: "350px",
      }}
    >
      {/* ─── Chart Sub-Header with metric toggles ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Telemetry Signals
          </span>
          <span
            style={{
              fontSize: "10.5px",
              padding: "2px 7px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)",
            }}
          >
            PostGIS Simulated
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setActiveMetric("all")}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              border:
                activeMetric === "all"
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid transparent",
              background:
                activeMetric === "all"
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
              color: activeMetric === "all" ? "#ffffff" : "var(--text-muted)",
              transition: "all 150ms ease",
            }}
          >
            All Metrics
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric("carbon")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              border:
                activeMetric === "carbon"
                  ? "1px solid rgba(16,185,129,0.35)"
                  : "1px solid transparent",
              background:
                activeMetric === "carbon"
                  ? "rgba(16,185,129,0.12)"
                  : "transparent",
              color:
                activeMetric === "carbon" ? "#34d399" : "var(--text-muted)",
              transition: "all 150ms ease",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10b981",
              }}
            />
            Carbon
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric("bio")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              border:
                activeMetric === "bio"
                  ? "1px solid rgba(56,189,248,0.35)"
                  : "1px solid transparent",
              background:
                activeMetric === "bio"
                  ? "rgba(56,189,248,0.12)"
                  : "transparent",
              color: activeMetric === "bio" ? "#38bdf8" : "var(--text-muted)",
              transition: "all 150ms ease",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#38bdf8",
              }}
            />
            Biodiversity
          </button>
        </div>
      </div>

      {/* ─── Chart canvas ─── */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
