'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileWarning, ListChecks, Hourglass, Info } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const chartConfig = {
  reports: {
    label: "Reports",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

// Mock data for demonstration purposes
const mockReports = [
  { id: '1', productName: 'Organic Milk', storeLocation: 'Main St. Grocer', reportStatus: 'Pending', submissionDate: '2024-07-20' },
  { id: '2', productName: 'Cheddar Cheese', storeLocation: 'Downtown Market', reportStatus: 'Reviewed', submissionDate: '2024-07-19' },
  { id: '3', productName: 'Artisan Bread', storeLocation: 'Corner Bakery', reportStatus: 'Action Taken', submissionDate: '2024-07-18' },
];

const mockReportsByMonth = [
    { month: 'Feb', reports: 5 },
    { month: 'Mar', reports: 8 },
    { month: 'Apr', reports: 12 },
    { month: 'May', reports: 15 },
    { month: 'Jun', reports: 10 },
    { month: 'Jul', reports: 18 },
];

export default function AdminPage() {
  const totalReports = mockReports.length;
  const pendingReports = mockReports.filter(r => r.reportStatus === 'Pending').length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-headline font-bold">Admin Dashboard</h1>

      <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Viewing Sample Data</AlertTitle>
          <AlertDescription>
            The database is not connected. This page is currently displaying static sample data for demonstration purposes.
          </AlertDescription>
      </Alert>

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
                  {mockReports.map((report) => (
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
                      <TableCell className="text-right">{report.submissionDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Reports by Month</CardTitle>
            </CardHeader>
            <CardContent>
                  <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={mockReportsByMonth}>
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="reports" fill="var(--color-reports)" radius={4} />
                    </BarChart>
                  </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}