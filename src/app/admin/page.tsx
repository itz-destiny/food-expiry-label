'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BarChart, FileWarning, ListChecks, Hourglass, Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { useMemo } from "react";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { Bar, ResponsiveContainer, XAxis, YAxis } from "recharts";


export type Report = {
  id: string;
  productName: string;
  storeLocation: string;
  submissionDate: Timestamp;
  reportStatus: "Pending" | "Reviewed" | "Action Taken";
  analysisResult: string;
};

const chartConfig = {
  reports: {
    label: "Reports",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function AdminPage() {
  const firestore = useFirestore();
  
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'reports'), orderBy('submissionDate', 'desc'));
  }, [firestore]);

  const { data: reports, isLoading } = useCollection<Report>(reportsQuery);
  
  const totalReports = reports?.length ?? 0;
  const pendingReports = reports?.filter(r => r.reportStatus === 'Pending').length ?? 0;

  const reportsByMonth = useMemo(() => {
    if (!reports) return [];
    const monthCounts = reports.reduce((acc, report) => {
        if (report.submissionDate) {
            const month = format(report.submissionDate.toDate(), "MMM");
            acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = new Date().getMonth();
    const last6Months = Array.from({length: 6}, (_, i) => allMonths[(currentMonthIndex - 5 + i + 12) % 12]);
    
    return last6Months.map(month => ({
      month,
      reports: monthCounts[month] || 0,
    }));
  }, [reports]);
  
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Reports</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports - pendingReports}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports?.slice(0, 5).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.productName}</TableCell>
                      <TableCell>{report.storeLocation}</TableCell>
                      <TableCell>
                        <Badge variant={
                          report.reportStatus === 'Pending' ? 'secondary' :
                          report.reportStatus === 'Reviewed' ? 'outline' :
                          'default'
                        }>
                          {report.reportStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{report.submissionDate ? format(report.submissionDate.toDate(), "PPP") : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Reports by Month</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                   <div className="flex justify-center items-center min-h-[200px]">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                   </div>
                ) : (
                  <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                      <BarChart accessibilityLayer data={reportsByMonth}>
                          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                          <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                          <Bar dataKey="reports" fill="var(--color-reports)" radius={4} />
                      </BarChart>
                  </ChartContainer>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
