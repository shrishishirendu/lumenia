import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, TrendingDown, Download, Settings2, Search,
  ArrowUpRight, ArrowDownRight, ChevronDown, BarChart3, PieChartIcon
} from "lucide-react";
import {
  generateMockData, filterData, calculateKpis, aggregateByDate,
  aggregateByChannel, aggregateBySegment, exportToCSV, exportToJSON,
  type BiDataRow, type MetricType, type DateRange, type SegmentFilter
} from "./mockData";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
const METRIC_LABELS: Record<MetricType, string> = {
  revenue: "Revenue ($)",
  leads: "Leads",
  conversion: "Conversion (%)",
  retention: "Retention (%)"
};

export default function BiDashboard() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [metric, setMetric] = useState<MetricType>("revenue");
  const [tableSearch, setTableSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof BiDataRow>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [strategyGoal, setStrategyGoal] = useState([50]);
  const [budgetCap, setBudgetCap] = useState("10000");
  const [riskTolerance, setRiskTolerance] = useState("moderate");

  const allData = useMemo(() => generateMockData(90), []);
  const filteredData = useMemo(() => filterData(allData, dateRange, segment), [allData, dateRange, segment]);
  const kpis = useMemo(() => calculateKpis(filteredData, metric, dateRange), [filteredData, metric, dateRange]);
  const lineData = useMemo(() => aggregateByDate(filteredData, metric), [filteredData, metric]);
  const barData = useMemo(() => aggregateByChannel(filteredData, metric), [filteredData, metric]);
  const pieData = useMemo(() => aggregateBySegment(filteredData, metric), [filteredData, metric]);

  const tableData = useMemo(() => {
    let data = [...filteredData];
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      data = data.filter(row =>
        row.date.includes(q) ||
        row.channel.toLowerCase().includes(q) ||
        row.segment.toLowerCase().includes(q)
      );
    }
    data.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return data.slice(0, 50);
  }, [filteredData, tableSearch, sortColumn, sortAsc]);

  const handleSort = (column: keyof BiDataRow) => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    const content = format === "csv" ? exportToCSV(filteredData) : exportToJSON(filteredData);
    const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bi-export-${dateRange}d.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toast({ title: "Export Complete", description: `Downloaded ${format.toUpperCase()} file.` });
  };

  const handleSaveStrategy = () => {
    const strategy = {
      goal: strategyGoal[0],
      budgetCap: parseInt(budgetCap) || 0,
      riskTolerance,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem("bi_strategy", JSON.stringify(strategy));
    setShowStrategyModal(false);
    toast({ title: "Strategy Saved (Preview)", description: "Your growth strategy has been saved locally." });
  };

  const goalLabel = strategyGoal[0] < 33 ? "Conservative" : strategyGoal[0] < 66 ? "Balanced" : "Aggressive";

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="bi-dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="bi-title">BI Dashboard (Preview)</h1>
            <p className="text-gray-500">Exploratory analytics from Growth Engine signals (mock data for now).</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowExportMenu(!showExportMenu)}
                data-testid="export-data-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-50">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg"
                    onClick={() => handleExport("csv")}
                    data-testid="export-csv-btn"
                  >
                    Export CSV
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-b-lg"
                    onClick={() => handleExport("json")}
                    data-testid="export-json-btn"
                  >
                    Export JSON
                  </button>
                </div>
              )}
            </div>
            <Button onClick={() => setShowStrategyModal(true)} data-testid="adjust-strategy-btn">
              <Settings2 className="w-4 h-4 mr-2" />
              Adjust Strategy
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                  <SelectTrigger className="w-36" data-testid="filter-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Segment</Label>
                <Select value={segment} onValueChange={(v) => setSegment(v as SegmentFilter)}>
                  <SelectTrigger className="w-36" data-testid="filter-segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Segment A">Segment A</SelectItem>
                    <SelectItem value="Segment B">Segment B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Metric</Label>
                <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
                  <SelectTrigger className="w-36" data-testid="filter-metric">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="conversion">Conversion</SelectItem>
                    <SelectItem value="retention">Retention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="kpi-total">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total {METRIC_LABELS[metric]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric === "revenue" ? "$" : ""}{kpis.total.toLocaleString()}
                {metric === "conversion" || metric === "retention" ? "%" : ""}
              </div>
            </CardContent>
          </Card>
          <Card data-testid="kpi-change">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">vs Previous Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-1 ${kpis.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {kpis.percentChange >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                {kpis.percentChange >= 0 ? "+" : ""}{kpis.percentChange}%
              </div>
            </CardContent>
          </Card>
          <Card data-testid="kpi-best-channel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Best Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{kpis.bestChannel}</div>
            </CardContent>
          </Card>
          <Card data-testid="kpi-best-segment">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Best Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{kpis.bestSegment}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Growth Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="current" name="Current Period" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="previous" name="Previous Period" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">No data for selected filters</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {METRIC_LABELS[metric]} by Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name={METRIC_LABELS[metric]} radius={[4, 4, 0, 0]}>
                      {barData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">No data for selected filters</div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Share by Segment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  <ResponsiveContainer width={300} height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {pieData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[i] }} />
                        <span className="font-medium">{item.name}:</span>
                        <span>{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">No data for selected filters</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Data Table (EDA)</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search data..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-10"
                  data-testid="table-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="data-table">
                <thead>
                  <tr className="border-b">
                    {(["date", "channel", "segment", "revenue", "leads", "conversion", "retention"] as const).map(col => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left font-medium text-gray-500 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort(col)}
                      >
                        <div className="flex items-center gap-1">
                          {col.charAt(0).toUpperCase() + col.slice(1)}
                          {sortColumn === col && (sortAsc ? "↑" : "↓")}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.length > 0 ? (
                    tableData.map((row, i) => (
                      <tr key={`${row.date}-${row.channel}-${row.segment}-${i}`} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2">{row.channel}</td>
                        <td className="px-3 py-2">{row.segment}</td>
                        <td className="px-3 py-2">${row.revenue.toLocaleString()}</td>
                        <td className="px-3 py-2">{row.leads}</td>
                        <td className="px-3 py-2">{row.conversion}%</td>
                        <td className="px-3 py-2">{row.retention}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        No data matches your search or filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {tableData.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">Showing {tableData.length} of {filteredData.length} rows</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={showStrategyModal} onOpenChange={setShowStrategyModal}>
          <DialogContent className="max-w-md" data-testid="strategy-modal">
            <DialogHeader>
              <DialogTitle>Adjust Growth Strategy</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label>Growth Goal: <span className="font-bold text-blue-600">{goalLabel}</span></Label>
                <Slider
                  value={strategyGoal}
                  onValueChange={setStrategyGoal}
                  max={100}
                  step={1}
                  className="w-full"
                  data-testid="strategy-goal-slider"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Conservative</span>
                  <span>Balanced</span>
                  <span>Aggressive</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Cap ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={budgetCap}
                  onChange={(e) => setBudgetCap(e.target.value)}
                  placeholder="10000"
                  data-testid="strategy-budget-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Risk Tolerance</Label>
                <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                  <SelectTrigger data-testid="strategy-risk-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStrategyModal(false)}>Cancel</Button>
              <Button onClick={handleSaveStrategy} data-testid="strategy-save-btn">Save Strategy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
