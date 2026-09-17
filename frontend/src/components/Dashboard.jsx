import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import axios from "axios";
import AnalyticsChart from "./AnalyticsChart";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Dashboard() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectName, setProjectName] = useState("");

  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);

  // FIX 1: Declared before it is used in the useEffect below
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/projects/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [77.5946, 12.9716],
      zoom: 12,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: true,
      controls: { polygon: true, trash: true },
    });

    map.current.addControl(draw.current);
    fetchProjects();
  }, []);

  // Fetch Sites when a Project is selected
  useEffect(() => {
    if (!selectedProject) return;
    const fetchSites = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_URL}/projects/${selectedProject}/sites`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setSites(res.data);
        setSelectedSite(null);
        setAnalyticsData([]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSites();
  }, [selectedProject]);

  // Fetch Analytics when a Site is selected
  useEffect(() => {
    if (!selectedSite) return;
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_URL}/projects/sites/${selectedSite}/analytics`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setAnalyticsData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnalytics();
  }, [selectedSite]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/projects/`,
        { title: projectName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProjects([...projects, res.data]);
      setProjectName("");
    } catch (err) {
      console.error(err); // FIX 2: Variable utilized
      alert("Failed to create project");
    }
  };

  const handleSavePolygon = async () => {
    const data = draw.current.getSelected();
    if (data.features.length === 0) return alert("Draw a polygon first!");
    if (!selectedProject) return alert("Select a project first!");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/projects/${selectedProject}/sites`,
        {
          name: `Site - ${Date.now().toString().slice(-4)}`,
          boundary: data.features[0].geometry,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("Site saved!");
      draw.current.deleteAll();
      setSites([...sites, res.data]);
    } catch (err) {
      console.error(err); // FIX 3: Variable utilized
      alert("Error saving site");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="bg-emerald-800 p-4 text-white shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Darukaa.Earth Dashboard</h1>
        <div className="flex gap-4">
          <button
            onClick={handleSavePolygon}
            className="bg-emerald-600 px-4 py-2 rounded text-sm font-semibold hover:bg-emerald-500"
          >
            Save Polygon
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded text-sm font-semibold hover:bg-red-500"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 bg-gray-50 border-r p-4 flex flex-col gap-4 shadow-sm z-10 overflow-y-auto">
          <h2 className="font-bold text-gray-700">1. Projects</h2>
          <form onSubmit={handleCreateProject} className="flex gap-2">
            <input
              type="text"
              placeholder="New Project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="border p-2 rounded flex-1 text-sm focus:outline-emerald-600"
            />
            <button
              type="submit"
              className="bg-emerald-700 text-white px-3 rounded text-sm"
            >
              Add
            </button>
          </form>

          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProject(p.id)}
                className={`p-2 rounded cursor-pointer border ${selectedProject === p.id ? "border-emerald-600 bg-emerald-100" : "bg-white"}`}
              >
                <p className="font-semibold text-sm">{p.title}</p>
              </div>
            ))}
          </div>

          {selectedProject && (
            <>
              <hr className="my-2" />
              <h2 className="font-bold text-gray-700">2. Sites</h2>
              <div className="flex flex-col gap-2">
                {sites.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No sites yet. Draw a polygon and save.
                  </p>
                )}
                {sites.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSite(s.id)}
                    className={`p-2 rounded cursor-pointer border ${selectedSite === s.id ? "border-blue-600 bg-blue-50" : "bg-white"}`}
                  >
                    <p className="font-semibold text-sm text-gray-800">
                      {s.name}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedSite && (
            <>
              <hr className="my-2" />
              <h2 className="font-bold text-gray-700">3. Analytics</h2>
              <AnalyticsChart data={analyticsData} />
            </>
          )}
        </aside>

        <main className="flex-1 relative">
          <div ref={mapContainer} className="w-full h-full" />
        </main>
      </div>
    </div>
  );
}
