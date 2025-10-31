'use client'

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileWarning, ListChecks, Hourglass, Info, LogIn } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const chartConfig = {
  reports: {
    label: "Reports",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

// Define the structure of a report document from Firestore
interface Report {
  id: string;
  productName: string;
  storeLocation: string;
  reportStatus: 'Pending' | 'Reviewed' | 'Action Taken';
  submissionDate: string; // ISO string
}

function AdminDashboardContent() {
  const firestore = useFirestore();

  // Memoize the query to prevent re-renders
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'reports'), orderBy('submissionDate', 'desc'));
  }, [firestore]);

  const { data: reports, isLoading, error } = useCollection<Report>(reportsQuery);

  const reportsByMonth = useMemo(() => {
    if (!reports) return [];
    const monthlyCounts = new Map<string, number>();

    reports.forEach(report => {
      const month = format(new Date(report.submissionDate), 'MMM');
      monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
    });
    
    const sortedMonths = Array.from(monthlyCounts.keys()).sort((a,b) => new Date(`1970-01-01T00:00:00Z`).getMonth() - new Date(`${a} 1, 1970`).getMonth());

    // Create a list of the last 6 months for the chart
    const last6Months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push(format(d, 'MMM'));
    }

    return last6Months.map(month => ({
      month,
      reports: monthlyCounts.get(month) || 0,
    }));

  }, [reports]);

  const totalReports = reports?.length ?? 0;
  const pendingReports = reports?.filter(r => r.reportStatus === 'Pending').length ?? 0;
  const resolvedReports = totalReports - pendingReports;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[109px]" />
            <Skeleton className="h-[109px]" />
            <Skeleton className="h-[109px]" />
        </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="lg:col-span-4 h-[400px]" />
            <Skeleton className="lg:col-span-3 h-[400px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Error Loading Reports</AlertTitle>
            <AlertDescription>
                Could not load reports from the database. Please check your connection or permissions.
                <pre className="mt-2 text-xs">{error.message}</pre>
            </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-headline font-bold">Admin Dashboard</h1>

      {reports?.length === 0 && !isLoading && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Awaiting First Report</AlertTitle>
          <AlertDescription>
            The database is connected and ready. As soon as the first report is submitted, it will appear here.
          </AlertDescription>
        </Alert>
      )}


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
            <div className="text-2xl font-bold">{resolvedReports}</div>
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
                  {reports && reports.slice(0, 5).map((report) => (
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
                      <TableCell className="text-right">{format(new Date(report.submissionDate), 'yyyy-MM-dd')}</TableCell>
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
                    <BarChart accessibilityLayer data={reportsByMonth}>
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


export default function AdminPage() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
             <div className="flex items-center justify-center h-full">
                <Hourglass className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full">
                <div className="max-w-md mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Access Restricted</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p>You must be logged in to view the admin dashboard.</p>
                            <Button asChild className="w-full">
                                <Link href="/login">
                                    <LogIn className="mr-2" />
                                    Login
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return <AdminDashboardContent />;
}
