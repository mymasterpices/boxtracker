import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Package, LayoutDashboard, ClipboardList, TrendingUp, Menu, X } from "lucide-react";

// Pages
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import RecordUsage from "./pages/RecordUsage";
import UsageHistory from "./pages/UsageHistory";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Navigation items
const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/inventory", icon: Package, label: "Inventory" },
  { path: "/record-usage", icon: ClipboardList, label: "Record Usage" },
  { path: "/history", icon: TrendingUp, label: "Usage Trends" },
];

// Sidebar component
const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} data-testid="sidebar">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">BoxTrack</h1>
              <p className="text-xs text-muted-foreground">Inventory Manager</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => 
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Simple Box Inventory
          </p>
        </div>
      </aside>
    </>
  );
};

// Mobile header
const MobileHeader = ({ onMenuClick }) => (
  <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-20 flex items-center px-4">
    <button 
      onClick={onMenuClick}
      className="p-2 hover:bg-muted rounded"
      data-testid="mobile-menu-btn"
    >
      <Menu className="w-5 h-5" />
    </button>
    <div className="flex items-center gap-2 ml-3">
      <Package className="w-5 h-5 text-primary" />
      <span className="font-bold">BoxTrack</span>
    </div>
  </header>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [boxes, setBoxes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [boxesRes, statsRes] = await Promise.all([
        axios.get(`${API}/boxes`),
        axios.get(`${API}/stats`)
      ]);
      setBoxes(boxesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="app-container">
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="main-content pt-14 md:pt-0">
          <div className="p-6 md:p-8 lg:p-12 max-w-7xl">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    stats={stats} 
                    boxes={boxes} 
                    loading={loading}
                    onRefresh={fetchData}
                  />
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <Inventory 
                    boxes={boxes} 
                    onUpdate={fetchData}
                  />
                } 
              />
              <Route 
                path="/record-usage" 
                element={
                  <RecordUsage 
                    boxes={boxes} 
                    onUsageRecorded={fetchData}
                  />
                } 
              />
              <Route 
                path="/history" 
                element={<UsageHistory />} 
              />
            </Routes>
          </div>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
