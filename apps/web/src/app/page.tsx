'use client';

import { useState } from 'react';
import { HeroSection } from '@/components/home/hero-section';
import { SearchSection } from '@/components/home/search-section';
import { MapView } from '@/components/visualizations/map-view';
import { TrendsChart } from '@/components/visualizations/trends-chart';
import { AffordabilityCalculator } from '@/components/features/affordability-calculator';
import { CountyComparison } from '@/components/features/county-comparison';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <HeroSection />
      
      <div className="container mx-auto px-4 py-8">
        <SearchSection onCountySelect={setSelectedCounty} />
        
        <Tabs defaultValue="map" className="mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="trends">Market Trends</TabsTrigger>
            <TabsTrigger value="affordability">Affordability</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Housing Market Map</CardTitle>
                <CardDescription>
                  Explore housing and rental prices across different counties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapView 
                  selectedCounty={selectedCounty}
                  onCountySelect={setSelectedCounty}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Trends</CardTitle>
                <CardDescription>
                  Historical trends and future projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendsChart countyId={selectedCounty} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="affordability" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Affordability Calculator</CardTitle>
                <CardDescription>
                  Calculate what you can afford based on your income
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AffordabilityCalculator countyId={selectedCounty} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="compare" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>County Comparison</CardTitle>
                <CardDescription>
                  Compare housing metrics across multiple counties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CountyComparison />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
