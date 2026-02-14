import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Package, DollarSign, AlertTriangle, TrendingDown, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ stats, boxes, loading, onRefresh }) => {
  const [trends, setTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axios.get(`${API}/usage/trends?days=7`);
        setTrends(res.data);
      } catch (error) {
        console.error("Error fetching trends:", error);
      } finally {
        setTrendsLoading(false);
      }
    };
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in" data-testid="dashboard-loading">
        <div className="h-8 w-48 bg-muted animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Box Types",
      value: stats?.total_box_types || 0,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      title: "Total Inventory",
      value: stats?.total_inventory || 0,
      icon: Package,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Total Value",
      value: `$${(stats?.total_value || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Low Stock Items",
      value: stats?.low_stock_count || 0,
      icon: AlertTriangle,
      color: stats?.low_stock_count > 0 ? "text-orange-600" : "text-emerald-600",
      bg: stats?.low_stock_count > 0 ? "bg-orange-50" : "bg-emerald-50"
    }
  ];

  return (
    <div className="animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your box inventory</p>
        </div>
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className="btn-shadow rounded-none border-2 border-foreground"
          data-testid="refresh-btn"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Low Stock Alert */}
      {stats?.low_stock_count > 0 && (
        <div className="alert-banner p-4 mb-8 animate-fade-in" data-testid="low-stock-alert">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-800">Low Stock Alert</h3>
              <p className="text-sm text-orange-700 mt-1">
                {stats.low_stock_count} item(s) are below minimum threshold. Consider reordering:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {stats.low_stock_boxes.map((box) => (
                  <span 
                    key={box.id}
                    className="px-3 py-1 bg-orange-200 text-orange-900 text-sm font-medium"
                  >
                    {box.name} ({box.quantity}/{box.min_threshold})
                  </span>
                ))}
              </div>
              <Button 
                variant="link" 
                className="p-0 h-auto mt-3 text-orange-800 hover:text-orange-900"
                onClick={() => navigate('/inventory')}
                data-testid="view-inventory-link"
              >
                View Inventory →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Card 
            key={index} 
            className="stat-card card-hover rounded-none border"
            data-testid={`stat-card-${index}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">{card.title}</p>
                  <p className="stat-value mt-2">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Chart */}
      <Card className="rounded-none border" data-testid="usage-chart-card">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Usage Trend (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {trendsLoading ? (
            <div className="h-64 bg-muted animate-pulse" />
          ) : trends.length === 0 || trends.every(t => t.total_used === 0) ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No usage data yet</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/record-usage')}
                  data-testid="record-usage-link"
                >
                  Record your first usage →
                </Button>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                  }}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    border: '2px solid #0F172A',
                    borderRadius: 0,
                    boxShadow: '4px 4px 0px 0px #000000'
                  }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString()}
                  formatter={(val) => [`${val} boxes`, 'Used']}
                />
                <Bar 
                  dataKey="total_used" 
                  fill="#1E1B4B" 
                  radius={0}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="rounded-none border card-hover">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Record Daily Usage</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Log how many boxes you used today
            </p>
            <Button 
              onClick={() => navigate('/record-usage')}
              className="btn-shadow rounded-none bg-primary"
              data-testid="quick-record-btn"
            >
              Record Usage
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-none border card-hover">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Manage Inventory</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add, edit, or remove box types
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate('/inventory')}
              className="btn-shadow rounded-none border-2 border-foreground"
              data-testid="quick-inventory-btn"
            >
              View Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
