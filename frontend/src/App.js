import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import "@/App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import {
  Package,
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  Menu,
  LogOut,
  User,
} from "lucide-react";

// Pages
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import RecordUsage from "./pages/RecordUsage";
import UsageHistory from "./pages/UsageHistory";
import Login from "./pages/Login";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = async (username, password) => {
    const res = await axios.post(`${API}/auth/login`, { username, password });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (username, password) => {
    const res = await axios.post(`${API}/auth/register`, {
      username,
      password,
    });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Axios interceptor for auth headers
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      if (token && !config.url.includes("/auth/")) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

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
  const { user, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      <aside
        className={`sidebar ${isOpen ? "open" : ""}`}
        data-testid="sidebar">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                BoxTrack
              </h1>
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
                `sidebar-nav-item ${isActive ? "active" : ""}`
              }
              onClick={onClose}
              data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground mb-2">
            <User className="w-4 h-4" />
            <span className="truncate">{user?.username}</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            data-testid="logout-btn">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Mobile header
const MobileHeader = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-20 flex items-center px-4">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-muted rounded"
        data-testid="mobile-menu-btn">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 ml-3">
        <Package className="w-5 h-5 text-primary" />
        <span className="font-bold">BoxTrack</span>
      </div>
      <div className="ml-auto text-xs text-muted-foreground">
        {user?.username}
      </div>
    </header>
  );
};

// Main App Content
const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [boxes, setBoxes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [boxesRes, statsRes] = await Promise.all([
        axios.get(`${API}/boxes`),
        axios.get(`${API}/stats`),
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
              element={<Inventory boxes={boxes} onUpdate={fetchData} />}
            />
            <Route
              path="/record-usage"
              element={
                <RecordUsage boxes={boxes} onUsageRecorded={fetchData} />
              }
            />
            <Route path="/history" element={<UsageHistory />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
