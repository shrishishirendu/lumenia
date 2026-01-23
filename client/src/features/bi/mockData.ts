export interface BiDataRow {
  date: string;
  channel: "Organic" | "Paid" | "Referral" | "Direct";
  segment: "Segment A" | "Segment B";
  revenue: number;
  leads: number;
  conversion: number;
  retention: number;
}

export interface KpiMetrics {
  total: number;
  percentChange: number;
  bestChannel: string;
  bestSegment: string;
}

export type MetricType = "revenue" | "leads" | "conversion" | "retention";
export type DateRange = "7" | "30" | "90";
export type SegmentFilter = "all" | "Segment A" | "Segment B";

const CHANNELS: BiDataRow["channel"][] = ["Organic", "Paid", "Referral", "Direct"];
const SEGMENTS: BiDataRow["segment"][] = ["Segment A", "Segment B"];

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function generateMockData(days: number): BiDataRow[] {
  const data: BiDataRow[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);

    for (const channel of CHANNELS) {
      for (const segment of SEGMENTS) {
        const baseRevenue = channel === "Paid" ? 1500 : channel === "Organic" ? 1200 : 800;
        const segmentMult = segment === "Segment A" ? 1.2 : 1;
        
        data.push({
          date: dateStr,
          channel,
          segment,
          revenue: Math.round((baseRevenue + randomInRange(-200, 400)) * segmentMult),
          leads: randomInRange(5, 25) * (channel === "Paid" ? 2 : 1),
          conversion: randomInRange(2, 12),
          retention: randomInRange(60, 95)
        });
      }
    }
  }

  return data;
}

export function filterData(
  data: BiDataRow[],
  dateRange: DateRange,
  segment: SegmentFilter
): BiDataRow[] {
  const days = parseInt(dateRange);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  return data.filter(row => {
    const rowDate = new Date(row.date);
    const dateMatch = rowDate >= cutoff;
    const segmentMatch = segment === "all" || row.segment === segment;
    return dateMatch && segmentMatch;
  });
}

export function calculateKpis(
  data: BiDataRow[],
  metric: MetricType,
  dateRange: DateRange
): KpiMetrics {
  if (data.length === 0) {
    return { total: 0, percentChange: 0, bestChannel: "N/A", bestSegment: "N/A" };
  }

  const days = parseInt(dateRange);
  const now = new Date();
  const midpoint = new Date(now);
  midpoint.setDate(midpoint.getDate() - days);
  const prevCutoff = new Date(midpoint);
  prevCutoff.setDate(prevCutoff.getDate() - days);

  const currentData = data.filter(row => new Date(row.date) >= midpoint);
  const prevData = data.filter(row => {
    const d = new Date(row.date);
    return d >= prevCutoff && d < midpoint;
  });

  const sumMetric = (arr: BiDataRow[]) => 
    arr.reduce((sum, row) => sum + row[metric], 0);

  const currentTotal = sumMetric(currentData);
  const prevTotal = sumMetric(prevData) || 1;
  const percentChange = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);

  const byChannel: Record<string, number> = {};
  const bySegment: Record<string, number> = {};
  
  currentData.forEach(row => {
    byChannel[row.channel] = (byChannel[row.channel] || 0) + row[metric];
    bySegment[row.segment] = (bySegment[row.segment] || 0) + row[metric];
  });

  const bestChannel = Object.entries(byChannel).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const bestSegment = Object.entries(bySegment).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return {
    total: Math.round(currentTotal),
    percentChange,
    bestChannel,
    bestSegment
  };
}

export function aggregateByDate(
  data: BiDataRow[],
  metric: MetricType
): { date: string; current: number; previous: number }[] {
  const byDate: Record<string, number> = {};
  
  data.forEach(row => {
    byDate[row.date] = (byDate[row.date] || 0) + row[metric];
  });

  const dates = Object.keys(byDate).sort();
  const half = Math.floor(dates.length / 2);
  
  return dates.slice(half).map((date, i) => ({
    date,
    current: byDate[date] || 0,
    previous: byDate[dates[i]] || 0
  }));
}

export function aggregateByChannel(
  data: BiDataRow[],
  metric: MetricType
): { channel: string; value: number }[] {
  const byChannel: Record<string, number> = {};
  
  data.forEach(row => {
    byChannel[row.channel] = (byChannel[row.channel] || 0) + row[metric];
  });

  return Object.entries(byChannel).map(([channel, value]) => ({ channel, value }));
}

export function aggregateBySegment(
  data: BiDataRow[],
  metric: MetricType
): { name: string; value: number }[] {
  const bySegment: Record<string, number> = {};
  
  data.forEach(row => {
    bySegment[row.segment] = (bySegment[row.segment] || 0) + row[metric];
  });

  return Object.entries(bySegment).map(([name, value]) => ({ name, value }));
}

export function exportToCSV(data: BiDataRow[]): string {
  const headers = ["date", "channel", "segment", "revenue", "leads", "conversion", "retention"];
  const rows = data.map(row => 
    headers.map(h => row[h as keyof BiDataRow]).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function exportToJSON(data: BiDataRow[]): string {
  return JSON.stringify(data, null, 2);
}
