'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface TrendsChartProps {
  countyId: string | null;
}

export function TrendsChart({ countyId }: TrendsChartProps) {
  const [period, setPeriod] = useState('1y');

  const { data, isLoading, error } = useQuery({
    queryKey: ['trends', countyId, period],
    queryFn: async () => {
      if (!countyId) return null;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/housing/trends/${countyId}?period=${period}`
      );
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
    enabled: !!countyId,
  });

  if (!countyId) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Select a county to view trends
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-destructive">
        Failed to load trends data
      </div>
    );
  }

  const chartData = data?.housingData?.map((item: any, index: number) => ({
    date: `${item.year}-${String(item.month).padStart(2, '0')}`,
    homePrice: item.medianHomePrice,
    rent: data.rentData[index]?.medianRent || 0,
    inventory: item.inventoryCount,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {data?.county?.name}, {data?.county?.state}
        </h3>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="1m">1M</TabsTrigger>
            <TabsTrigger value="3m">3M</TabsTrigger>
            <TabsTrigger value="6m">6M</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="5y">5Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Home Prices</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <Area
                  type="monotone"
                  dataKey="homePrice"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rental Prices</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <Area
                  type="monotone"
                  dataKey="rent"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Home Price Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.homePriceChange.percentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                ${Math.abs(data.summary.homePriceChange.absolute).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Rent Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.rentChange.percentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                ${Math.abs(data.summary.rentChange.absolute).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Median Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(data.county.medianIncome || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Annual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Population
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(data.county.population || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Residents</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
