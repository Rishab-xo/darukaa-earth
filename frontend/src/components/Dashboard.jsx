import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import axios from "axios";
import AnalyticsChart from "./AnalyticsChart";
import InteractiveWalkthrough, {
  WalkthroughHelpButton,
} from "./InteractiveWalkthrough";
import { Footer } from "@/components/ui/large-name-footer";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {
  Globe2,
  Save,
  LogOut,
  FolderKanban,
  MapPin,
  BarChart3,
  Plus,
  ChevronLeft,
  Menu,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Calendar,
  Search,
  Trash2,
  Pencil,
  AlertTriangle,
} from "lucide-react";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/* ─── Toast hook ─── */
let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, duration);
  }, []);

  return { toasts, addToast };
}

function ToastIcon({ type }) {
  if (type === "success")
    return <CheckCircle2 size={16} className="toast-icon" />;
  if (type === "error") return <AlertCircle size={16} className="toast-icon" />;
  return <Info size={16} className="toast-icon" />;
}

export default function Dashboard() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [projectToRename, setProjectToRename] = useState(null);
  const [renameProjectTitle, setRenameProjectTitle] = useState("");
  const [renamingProject, setRenamingProject] = useState(false);

  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loadingSites, setLoadingSites] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [siteToRename, setSiteToRename] = useState(null);
  const [renameSiteName, setRenameSiteName] = useState("");
  const [renamingSite, setRenamingSite] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);
  const [deletingSite, setDeletingSite] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [walkthroughStepId, setWalkthroughStepId] = useState(null);
  const advanceWalkthroughRef = useRef(null);

  const { toasts, addToast } = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/projects/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject((prev) => prev ?? data[0].id);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      addToast("Failed to fetch projects", "error");
    } finally {
      setLoadingProjects(false);
    }
  }, [addToast]);

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
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

    return () => {
      // Clean up map instance if unmounted
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [fetchProjects]);

  // Responsive map resize observer: guarantees map adapts dynamically to any container size change
  useEffect(() => {
    if (!mapContainer.current) return;
    const observer = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize();
      }
    });
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, []);

  // Ensure map resizes smoothly during and after sidebar transition
  useEffect(() => {
    const t1 = setTimeout(() => map.current?.resize(), 80);
    const t2 = setTimeout(() => map.current?.resize(), 200);
    const t3 = setTimeout(() => map.current?.resize(), 420);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [sidebarOpen]);

  // Fetch Sites when a Project is selected
  useEffect(() => {
    if (!selectedProject) return;
    let isMounted = true;
    const fetchSites = async () => {
      try {
        setLoadingSites(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_URL}/projects/${selectedProject}/sites`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!isMounted) return;
        const siteList = res.data || [];
        setSites(siteList);
        if (siteList.length > 0) {
          setSelectedSite(siteList[0].id);
        } else {
          setSelectedSite(null);
          setAnalyticsData([]);
        }
      } catch (err) {
        console.error("Error fetching sites:", err);
      } finally {
        if (isMounted) {
          setLoadingSites(false);
        }
      }
    };
    fetchSites();
    return () => {
      isMounted = false;
    };
  }, [selectedProject]);

  // Fetch Analytics when a Site is selected
  useEffect(() => {
    if (!selectedSite) return;
    let isMounted = true;
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_URL}/projects/sites/${selectedSite}/analytics`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!isMounted) return;
        setAnalyticsData(res.data || []);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      }
    };
    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [selectedSite]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/projects/`,
        { title: projectName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProjects((prev) => [...prev, res.data]);
      setSelectedProject(res.data.id);
      setProjectName("");
      addToast(`Project "${res.data.title}" created`, "success");

      // Signal walkthrough: project created
      if (walkthroughStepId === "create-project") {
        setTimeout(() => advanceWalkthroughRef.current?.(), 500);
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to create project", "error");
    }
  };

  // When a site is selected, render its saved polygon on the map & fit bounds
  useEffect(() => {
    if (!draw.current || !selectedSite) return;
    const site = sites.find((s) => s.id === selectedSite);
    if (site && site.boundary) {
      draw.current.deleteAll();
      try {
        draw.current.add({
          type: "Feature",
          id: `site-${site.id}`,
          properties: { name: site.name },
          geometry: site.boundary,
        });

        // Zoom to polygon bounds if valid coordinates exist
        if (site.boundary.coordinates?.[0]?.length > 0 && map.current) {
          const coords = site.boundary.coordinates[0];
          const bounds = coords.reduce(
            (b, coord) => b.extend(coord),
            new mapboxgl.LngLatBounds(coords[0], coords[0]),
          );
          map.current.fitBounds(bounds, {
            padding: 90,
            maxZoom: 15,
            duration: 900,
          });
        }
      } catch (e) {
        console.warn("Could not display polygon on map:", e);
      }
    }
  }, [selectedSite, sites]);

  // Walkthrough: detect polygon drawn on map
  useEffect(() => {
    if (walkthroughStepId === "draw-polygon" && map.current) {
      const onDrawCreate = () => {
        setTimeout(() => advanceWalkthroughRef.current?.(), 600);
      };
      map.current.on("draw.create", onDrawCreate);
      return () => map.current?.off("draw.create", onDrawCreate);
    }
  }, [walkthroughStepId]);

  const handleSavePolygon = async () => {
    if (!draw.current) return;
    const selectedFeatures = draw.current.getSelected();
    const allFeatures = draw.current.getAll();
    const featureToSave =
      selectedFeatures?.features?.length > 0
        ? selectedFeatures.features[0]
        : allFeatures?.features?.length > 0
          ? allFeatures.features[allFeatures.features.length - 1]
          : null;

    if (!featureToSave) {
      addToast(
        "Draw a polygon on the map first using the polygon tool",
        "info",
      );
      return;
    }
    if (!selectedProject) {
      addToast("Select or create a project first", "info");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/projects/${selectedProject}/sites`,
        {
          name: `Site - ${Date.now().toString().slice(-4)}`,
          boundary: featureToSave.geometry,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      addToast("Site boundary saved successfully!", "success");
      draw.current.deleteAll();
      setSites((prev) => [...prev, res.data]);
      setSelectedSite(res.data.id);

      // Signal walkthrough: polygon saved
      if (walkthroughStepId === "save-boundary") {
        setTimeout(() => advanceWalkthroughRef.current?.(), 500);
      }
    } catch (err) {
      console.error(err);
      addToast("Error saving site boundary", "error");
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      setDeletingProject(true);
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/projects/${projectToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedProjects = projects.filter(
        (p) => p.id !== projectToDelete.id,
      );
      setProjects(updatedProjects);

      if (selectedProject === projectToDelete.id) {
        if (updatedProjects.length > 0) {
          setSelectedProject(updatedProjects[0].id);
        } else {
          setSelectedProject(null);
          setSites([]);
          setSelectedSite(null);
          setAnalyticsData([]);
          draw.current?.deleteAll();
        }
      }

      addToast(`Project "${projectToDelete.title}" deleted`, "info");
      setProjectToDelete(null);
    } catch (err) {
      console.error("Error deleting project:", err);
      addToast("Failed to delete project", "error");
    } finally {
      setDeletingProject(false);
    }
  };

  const handleRenameProject = async (e) => {
    e?.preventDefault();
    if (!projectToRename || !renameProjectTitle.trim()) return;
    try {
      setRenamingProject(true);
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${API_URL}/projects/${projectToRename.id}`,
        { title: renameProjectTitle.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectToRename.id ? { ...p, title: res.data.title } : p,
        ),
      );
      addToast(`Project renamed to "${res.data.title}"`, "success");
      setProjectToRename(null);
      setRenameProjectTitle("");
    } catch (err) {
      console.error("Error renaming project:", err);
      addToast("Failed to rename project", "error");
    } finally {
      setRenamingProject(false);
    }
  };

  const handleRenameSite = async (e) => {
    e?.preventDefault();
    if (!siteToRename || !renameSiteName.trim()) return;
    try {
      setRenamingSite(true);
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${API_URL}/projects/sites/${siteToRename.id}`,
        { name: renameSiteName.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSites((prev) =>
        prev.map((s) =>
          s.id === siteToRename.id ? { ...s, name: res.data.name } : s,
        ),
      );
      addToast(`Site renamed to "${res.data.name}"`, "success");
      setSiteToRename(null);
      setRenameSiteName("");
    } catch (err) {
      console.error("Error renaming site:", err);
      addToast("Failed to rename site", "error");
    } finally {
      setRenamingSite(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!siteToDelete) return;
    try {
      setDeletingSite(true);
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/projects/sites/${siteToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedSites = sites.filter((s) => s.id !== siteToDelete.id);
      setSites(updatedSites);

      if (selectedSite === siteToDelete.id) {
        if (updatedSites.length > 0) {
          setSelectedSite(updatedSites[0].id);
        } else {
          setSelectedSite(null);
          setAnalyticsData([]);
          draw.current?.deleteAll();
        }
      }

      addToast(`Site "${siteToDelete.name}" deleted`, "info");
      setSiteToDelete(null);
    } catch (err) {
      console.error("Error deleting site:", err);
      addToast("Failed to delete site", "error");
    } finally {
      setDeletingSite(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const selectedProjectData = projects.find((p) => p.id === selectedProject);
  const selectedSiteData = sites.find((s) => s.id === selectedSite);

  const filteredProjects = projects.filter((p) =>
    p.title?.toLowerCase().includes(projectSearch.toLowerCase().trim()),
  );

  // Computed summary metrics for analytics
  const totalCarbon = analyticsData
    .reduce((acc, curr) => acc + (curr.carbon_sequestration || 0), 0)
    .toFixed(1);

  const avgBiodiversity = analyticsData.length
    ? Math.round(
        analyticsData.reduce(
          (acc, curr) => acc + (curr.biodiversity_index || 0),
          0,
        ) / analyticsData.length,
      )
    : 0;

  return (
    <div className="dashboard-root">
      {/* ─── Header ─── */}
      <header className="dash-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Mobile hamburger */}
          <button
            className="btn-icon mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="dash-brand">
            <Globe2 size={22} className="dash-brand-icon" />
            <span className="dash-brand-text">Darukaa.Earth</span>
          </div>
        </div>

        <div className="dash-header-actions">
          <button
            id="walkthrough-save-btn"
            className="btn btn-accent"
            onClick={handleSavePolygon}
          >
            <Save size={14} />
            Save Polygon
          </button>
          <WalkthroughHelpButton onClick={() => setWalkthroughOpen(true)} />
          <button
            className="btn-icon"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="dash-body">
        {/* Mobile overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "" : "hidden"}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ─── Dedicated Sidebar: Projects & Sites ─── */}
        <aside className={`dash-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          {/* Projects Section */}
          <div
            id="walkthrough-projects"
            className={`sidebar-section sidebar-section-projects ${
              selectedProject ? "split" : "full"
            }`}
          >
            <div className="section-header">
              <FolderKanban size={15} className="section-icon" />
              <span className="section-title">Projects</span>
              <span className="section-badge">{projects.length}</span>
            </div>

            <form onSubmit={handleCreateProject} className="input-group">
              <input
                type="text"
                placeholder="New project name…"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="input-dark"
              />
              <button
                type="submit"
                className="btn-add"
                aria-label="Add project"
                title="Add project"
              >
                <Plus size={15} />
              </button>
            </form>

            {projects.length > 3 && (
              <div className="sidebar-filter-box">
                <Search size={12} className="sidebar-filter-icon" />
                <input
                  type="text"
                  placeholder="Filter projects…"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="sidebar-filter-input"
                />
                {projectSearch && (
                  <button
                    type="button"
                    onClick={() => setProjectSearch("")}
                    className="sidebar-filter-clear"
                    aria-label="Clear filter"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            <div className="sidebar-scroll-list">
              {loadingProjects ? (
                <>
                  <div className="skeleton skeleton-card" />
                  <div className="skeleton skeleton-card" />
                  <div className="skeleton skeleton-card" />
                </>
              ) : projects.length === 0 ? (
                <div className="empty-state">
                  <FolderKanban size={24} className="empty-state-icon" />
                  <span>No projects yet. Create one above to get started.</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="empty-state" style={{ padding: "12px 6px" }}>
                  <span>No project matching "{projectSearch}"</span>
                </div>
              ) : (
                filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p.id)}
                    className={`item-card ${selectedProject === p.id ? "selected-emerald" : ""}`}
                  >
                    <div className="item-card-content">
                      <div className="item-card-title">{p.title}</div>
                      {p.description && (
                        <div className="item-card-subtitle">
                          {p.description}
                        </div>
                      )}
                    </div>
                    <div className="item-card-actions">
                      <button
                        type="button"
                        className="item-card-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToRename(p);
                          setRenameProjectTitle(p.title);
                        }}
                        title={`Rename ${p.title}`}
                        aria-label={`Rename ${p.title}`}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        className="item-card-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(p);
                        }}
                        title={`Delete ${p.title}`}
                        aria-label={`Delete ${p.title}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sites Section */}
          {selectedProject && (
            <div
              id="walkthrough-sites"
              className="sidebar-section sidebar-section-sites"
            >
              <div className="section-header">
                <MapPin size={15} className="section-icon" />
                <span className="section-title">
                  Sites
                  {selectedProjectData ? ` — ${selectedProjectData.title}` : ""}
                </span>
                <span className="section-badge">{sites.length}</span>
              </div>

              <div className="sidebar-scroll-list">
                {loadingSites ? (
                  <>
                    <div className="skeleton skeleton-card" />
                    <div className="skeleton skeleton-card" />
                  </>
                ) : sites.length === 0 ? (
                  <div className="empty-state">
                    <MapPin size={24} className="empty-state-icon" />
                    <span>
                      No sites yet. Draw a polygon on the map, then click{" "}
                      <strong style={{ color: "var(--text-accent)" }}>
                        Save Polygon
                      </strong>
                      .
                    </span>
                  </div>
                ) : (
                  sites.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSite(s.id)}
                      className={`item-card ${selectedSite === s.id ? "selected-blue" : ""}`}
                    >
                      <div className="item-card-title">{s.name}</div>
                      <div className="item-card-actions">
                        <button
                          type="button"
                          className="item-card-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSiteToRename(s);
                            setRenameSiteName(s.name);
                          }}
                          title={`Rename ${s.name}`}
                          aria-label={`Rename ${s.name}`}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          className="item-card-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSiteToDelete(s);
                          }}
                          title={`Delete ${s.name}`}
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ─── Sidebar Toggle (desktop) ─── */}
        <button
          className={`sidebar-toggle ${sidebarOpen ? "" : "collapsed"}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft size={14} className="toggle-icon" />
        </button>

        {/* ─── Main Scrollable Area (Adapts fully when sidebar closes) ─── */}
        <main className="dash-main">
          {/* Breadcrumb / Context Bar */}
          <div className="context-bar">
            <div className="context-breadcrumb">
              <span className="context-breadcrumb-item">
                <FolderKanban size={13} />
                Projects
              </span>
              <span className="context-breadcrumb-sep">/</span>
              <span
                className={`context-breadcrumb-item ${!selectedSiteData ? "active" : ""}`}
              >
                {selectedProjectData
                  ? selectedProjectData.title
                  : "None selected"}
              </span>
              {selectedSiteData && (
                <>
                  <span className="context-breadcrumb-sep">/</span>
                  <span className="context-breadcrumb-item active">
                    <MapPin size={13} />
                    {selectedSiteData.name}
                  </span>
                </>
              )}
            </div>

            <div className="context-status">
              <span className="status-dot" />
              <span>Satellite Live</span>
            </div>
          </div>

          {/* ─── Map Container (slightly smaller height, fully responsive) ─── */}
          <div id="walkthrough-map" className="dash-map-wrapper">
            <div id="walkthrough-draw-controls" className="dash-map-container">
              <div ref={mapContainer} className="dash-map" />
            </div>
          </div>

          {/* ─── Lower Section (Scrollable downside with charts and stats) ─── */}
          {selectedSite && analyticsData.length > 0 ? (
            <div id="walkthrough-analytics" className="analytics-section">
              <div className="analytics-section-header">
                <BarChart3
                  size={18}
                  style={{ color: "var(--accent-emerald)" }}
                />
                <h3 className="analytics-section-title">
                  Site Analytics: {selectedSiteData?.name}
                </h3>
                <span className="analytics-section-subtitle">
                  12-Month Simulated PostGIS Telemetry
                </span>
              </div>

              {/* Stat Cards Grid */}
              <div className="stat-cards">
                <div
                  className="stat-card"
                  style={{ "--stat-accent": "var(--accent-emerald)" }}
                >
                  <div className="stat-card-label">
                    <TrendingUp size={14} className="stat-icon" />
                    Total Carbon Sequestered
                  </div>
                  <div className="stat-card-value">
                    {totalCarbon}{" "}
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Tons
                    </span>
                  </div>
                  <div className="stat-card-change positive">
                    <span>↑ Continuous Sequestration</span>
                  </div>
                </div>

                <div
                  className="stat-card"
                  style={{ "--stat-accent": "var(--accent-blue)" }}
                >
                  <div className="stat-card-label">
                    <Activity size={14} className="stat-icon" />
                    Avg Biodiversity Index
                  </div>
                  <div className="stat-card-value">
                    {avgBiodiversity}{" "}
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      / 100
                    </span>
                  </div>
                  <div className="stat-card-change positive">
                    <span>Healthy Eco-Status</span>
                  </div>
                </div>

                <div
                  className="stat-card"
                  style={{ "--stat-accent": "#a855f7" }}
                >
                  <div className="stat-card-label">
                    <Calendar size={14} className="stat-icon" />
                    Monitoring History
                  </div>
                  <div className="stat-card-value">
                    {analyticsData.length}{" "}
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Months
                    </span>
                  </div>
                  <div
                    className="stat-card-change"
                    style={{ color: "#c084fc" }}
                  >
                    <span>Auto-Synthesized Records</span>
                  </div>
                </div>

                <div
                  className="stat-card"
                  style={{ "--stat-accent": "#10b981" }}
                >
                  <div className="stat-card-label">
                    <ShieldCheck size={14} className="stat-icon" />
                    Project Health
                  </div>
                  <div className="stat-card-value" style={{ color: "#34d399" }}>
                    Optimal
                  </div>
                  <div className="stat-card-change positive">
                    <span>Active PostGIS Polygon</span>
                  </div>
                </div>
              </div>

              {/* Expanded Analytics Chart */}
              <AnalyticsChart data={analyticsData} />
            </div>
          ) : selectedProject ? (
            <div className="analytics-empty">
              <div className="analytics-empty-card">
                <Sparkles
                  size={32}
                  className="analytics-empty-icon"
                  style={{ color: "var(--accent-emerald)" }}
                />
                <h4 className="analytics-empty-title">
                  {sites.length === 0
                    ? "Draw a Site Boundary to Generate Analytics"
                    : "Select a Site to View Analytics"}
                </h4>
                <p className="analytics-empty-text">
                  Use the polygon tool in the upper-right corner of the
                  satellite map to outline a conservation area, then click "Save
                  Polygon" to automatically generate 12-month carbon &
                  biodiversity metrics.
                </p>
              </div>
            </div>
          ) : (
            <div className="analytics-empty">
              <div className="analytics-empty-card">
                <Layers size={32} className="analytics-empty-icon" />
                <h4 className="analytics-empty-title">
                  Select or Create a Project
                </h4>
                <p className="analytics-empty-text">
                  Create a new project in the sidebar or select an existing one
                  to begin spatial monitoring.
                </p>
              </div>
            </div>
          )}

          {/* ─── Footer with 20vh top spacing ─── */}
          <div className="mt-auto pt-[20vh]">
            <Footer />
          </div>
        </main>
      </div>

      {/* ─── Rename Project Modal ─── */}
      {projectToRename && (
        <div
          className="modal-backdrop"
          onClick={() => !renamingProject && setProjectToRename(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-icon-edit">
                <Pencil size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 className="modal-title">Rename Project</h3>
                <p className="modal-desc">
                  Update the display title for this conservation project.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleRenameProject}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <input
                type="text"
                className="modal-input"
                value={renameProjectTitle}
                onChange={(e) => setRenameProjectTitle(e.target.value)}
                placeholder="Enter project name..."
                autoFocus
                disabled={renamingProject}
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setProjectToRename(null)}
                  disabled={renamingProject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-primary"
                  disabled={renamingProject || !renameProjectTitle.trim()}
                >
                  {renamingProject ? "Saving…" : "Save Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Rename Site Modal ─── */}
      {siteToRename && (
        <div
          className="modal-backdrop"
          onClick={() => !renamingSite && setSiteToRename(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-icon-edit">
                <Pencil size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 className="modal-title">Rename Site</h3>
                <p className="modal-desc">
                  Give this conservation site a clear, recognizable name.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleRenameSite}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <input
                type="text"
                className="modal-input"
                value={renameSiteName}
                onChange={(e) => setRenameSiteName(e.target.value)}
                placeholder="Enter site name (e.g. Forest Sector Alpha)..."
                autoFocus
                disabled={renamingSite}
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setSiteToRename(null)}
                  disabled={renamingSite}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-primary"
                  disabled={renamingSite || !renameSiteName.trim()}
                >
                  {renamingSite ? "Saving…" : "Save Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Site Confirmation Modal ─── */}
      {siteToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !deletingSite && setSiteToDelete(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-icon-danger">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="modal-title">Delete Site</h3>
                <p className="modal-desc">
                  Are you sure you want to delete{" "}
                  <span className="modal-highlight">"{siteToDelete.name}"</span>
                  ? This will permanently remove the boundary polygon and all
                  associated 12-month analytics data.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSiteToDelete(null)}
                disabled={deletingSite}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleDeleteSite}
                disabled={deletingSite}
              >
                <Trash2 size={14} />
                {deletingSite ? "Deleting…" : "Delete Site"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {projectToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !deletingProject && setProjectToDelete(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-icon-danger">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="modal-title">Delete Project</h3>
                <p className="modal-desc">
                  Are you sure you want to delete{" "}
                  <span className="modal-highlight">
                    "{projectToDelete.title}"
                  </span>
                  ? This will permanently remove the project and all its
                  associated conservation sites, boundary polygons, and
                  analytics data. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setProjectToDelete(null)}
                disabled={deletingProject}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleDeleteProject}
                disabled={deletingProject}
              >
                <Trash2 size={14} />
                {deletingProject ? "Deleting…" : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toasts ─── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.exiting ? "toast-exit" : ""}`}
          >
            <ToastIcon type={t.type} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* ─── Interactive Walkthrough ─── */}
      <InteractiveWalkthrough
        forceOpen={walkthroughOpen}
        onClose={() => setWalkthroughOpen(false)}
        onStepChange={setWalkthroughStepId}
        advanceRef={advanceWalkthroughRef}
      />
    </div>
  );
}
