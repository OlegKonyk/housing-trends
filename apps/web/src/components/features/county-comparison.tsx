'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function CountyComparison() {
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);

  // Mock data for demonstration
  const mockData = [
    {
      id: '1',
      name: 'San Francisco County',
      state: 'CA',
      medianHomePrice: 1200000,
      medianRent: 3500,
      population: 874961,
      affordabilityScore: 25,
    },
    {
      id: '2',
      name: 'Travis County',
      state: 'TX',
      medianHomePrice: 450000,
      medianRent: 1800,
      population: 1290188,
      affordabilityScore: 65,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Compare Counties</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add County
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockData.map((county) => (
          <Card key={county.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  {county.name}, {county.state}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Home Price</span>
                  <span className="font-medium">
                    ${county.medianHomePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rent</span>
                  <span className="font-medium">
                    ${county.medianRent.toLocaleString()}/mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Population</span>
                  <span className="font-medium">
                    {county.population.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Affordability</span>
                  <Badge
                    variant={
                      county.affordabilityScore > 60
                        ? 'default'
                        : county.affordabilityScore > 40
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {county.affordabilityScore}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
