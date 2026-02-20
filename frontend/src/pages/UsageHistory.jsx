import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { TrendingUp, Calendar as CalendarIcon, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { format } from "date-fns";

const UsageHistory = () => {
  const [trends, setTrends] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("14");
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendsRes, recordsRes] = await Promise.all([
          axios.get(`${API}/usage/trends?days=${timeRange}`),
          axios.get(`${API}/usage?days=${timeRange}`),
        ]);
        setTrends(trendsRes.data);
        setRecords(recordsRes.data);
      } catch (error) {
        console.error("Error fetching usage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const totalUsed = trends.reduce((sum, t) => sum + t.total_used, 0);
  const avgDaily =
    trends.length > 0 ? Math.round(totalUsed / trends.length) : 0;
  const peakDay = trends.reduce(
    (max, t) => (t.total_used > max.total_used ? t : max),
    { total_used: 0 },
  );

  return (
    <div className="animate-fade-in" data-testid="usage-history-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usage Trends</h1>
          <p className="text-muted-foreground mt-1">
            Track your box consumption over time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-36 rounded-none"
              data-testid="time-range-select">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger
              className="w-32 rounded-none"
              data-testid="chart-type-select">
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-muted animate-pulse" />
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card
              className="rounded-none border stat-card"
              data-testid="total-used-stat">
              <CardContent className="p-6">
                <p className="stat-label">Total Used</p>
                <p className="stat-value mt-2">{totalUsed}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  boxes in {timeRange} days
                </p>
              </CardContent>
            </Card>
            <Card
              className="rounded-none border stat-card"
              data-testid="avg-daily-stat">
              <CardContent className="p-6">
                <p className="stat-label">Daily Average</p>
                <p className="stat-value mt-2">{avgDaily}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  boxes per day
                </p>
              </CardContent>
            </Card>
            <Card
              className="rounded-none border stat-card"
              data-testid="peak-day-stat">
              <CardContent className="p-6">
                <p className="stat-label">Peak Usage</p>
                <p className="stat-value mt-2">{peakDay.total_used}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {peakDay.date ? format(new Date(peakDay.date), "MMM d") : "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="rounded-none border mb-8" data-testid="usage-chart">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Usage Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {trends.every((t) => t.total_used === 0) ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No usage data in this time period</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === "bar" ? (
                    <BarChart data={trends}>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          border: "2px solid #0F172A",
                          borderRadius: 0,
                          boxShadow: "4px 4px 0px 0px #000000",
                        }}
                        labelFormatter={(val) =>
                          format(new Date(val), "MMMM d, yyyy")
                        }
                        formatter={(val) => [`${val} boxes`, "Used"]}
                      />
                      <Bar dataKey="total_used" fill="#1E1B4B" radius={0} />
                    </BarChart>
                  ) : (
                    <LineChart data={trends}>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          border: "2px solid #0F172A",
                          borderRadius: 0,
                          boxShadow: "4px 4px 0px 0px #000000",
                        }}
                        labelFormatter={(val) =>
                          format(new Date(val), "MMMM d, yyyy")
                        }
                        formatter={(val) => [`${val} boxes`, "Used"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="total_used"
                        stroke="#1E1B4B"
                        strokeWidth={2}
                        dot={{ fill: "#1E1B4B", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Records Table */}
          <Card
            className="rounded-none border"
            data-testid="usage-records-table">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Recent Usage Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {records.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No usage records yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="data-table">
                    <TableHeader>
                      <TableRow className="border-b-2">
                        <TableHead>Date</TableHead>
                        <TableHead>Box Type</TableHead>
                        <TableHead className="text-right">
                          Quantity Used
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.slice(0, 20).map((record) => (
                        <TableRow
                          key={record.id}
                          data-testid={`record-row-${record.id}`}>
                          <TableCell className="font-mono">
                            {format(new Date(record.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.box_name}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {record.quantity_used}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default UsageHistory;
