import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export default function AnalyticsChart({ data }) {
  if (!data || data.length === 0)
    return (
      <p className="text-sm text-gray-500 mt-4">No analytics data available.</p>
    );

  const chartData = {
    labels: data.map((d) => new Date(d.recorded_date).toLocaleDateString()),
    datasets: [
      {
        label: "Carbon Sequestration (Tons)",
        data: data.map((d) => d.carbon_sequestration),
        borderColor: "#10b981", // emerald-500
        backgroundColor: "rgba(16, 185, 129, 0.5)",
      },
      {
        label: "Biodiversity Index",
        data: data.map((d) => d.biodiversity_index),
        borderColor: "#3b82f6", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      },
    ],
  };

  const options = { responsive: true, maintainAspectRatio: false };

  return (
    <div className="h-64 w-full bg-white p-4 rounded shadow-sm border mt-4">
      <Line data={chartData} options={options} />
    </div>
  );
}
