'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';

interface SearchSectionProps {
  onCountySelect: (countyId: string) => void;
}

export function SearchSection({ onCountySelect }: SearchSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const { data: counties } = useQuery({
    queryKey: ['counties', selectedState, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', selectedState);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/housing/counties?${params}`
      );
      if (!response.ok) throw new Error('Failed to fetch counties');
      return response.json();
    },
  });

  const states = [
    { code: 'CA', name: 'California' },
    { code: 'TX', name: 'Texas' },
    { code: 'FL', name: 'Florida' },
    { code: 'NY', name: 'New York' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'IL', name: 'Illinois' },
    { code: 'OH', name: 'Ohio' },
    { code: 'GA', name: 'Georgia' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'MI', name: 'Michigan' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger id="state">
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search">Search County</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Enter county name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Select onValueChange={onCountySelect}>
              <SelectTrigger id="county">
                <SelectValue placeholder="Select a county" />
              </SelectTrigger>
              <SelectContent>
                {counties?.slice(0, 10).map((county: any) => (
                  <SelectItem key={county.id} value={county.id}>
                    {county.name}, {county.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button size="lg" className="w-full md:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Search Housing Data
          </Button>
        </div>
      </div>
    </div>
  );
}
