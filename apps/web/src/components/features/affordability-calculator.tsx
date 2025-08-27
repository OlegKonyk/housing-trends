'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AffordabilityCalculatorProps {
  countyId: string | null;
}

export function AffordabilityCalculator({ countyId }: AffordabilityCalculatorProps) {
  const [income, setIncome] = useState('');
  const [downPayment, setDownPayment] = useState('');

  const monthlyIncome = parseFloat(income) / 12 || 0;
  const maxRent = monthlyIncome * 0.3;
  const maxHome = (parseFloat(income) || 0) * 3.5 + (parseFloat(downPayment) || 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="income">Annual Income</Label>
          <Input
            id="income"
            type="number"
            placeholder="Enter your annual income"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="downpayment">Down Payment Available</Label>
          <Input
            id="downpayment"
            type="number"
            placeholder="Enter down payment amount"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
          />
        </div>
      </div>

      {income && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Max Affordable Rent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${maxRent.toLocaleString()}/mo
              </div>
              <p className="text-xs text-muted-foreground">30% of income</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Max Home Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${maxHome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">3.5x income + down</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${monthlyIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total monthly</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Button className="w-full">
        <Calculator className="mr-2 h-4 w-4" />
        Find Affordable Counties
      </Button>
    </div>
  );
}
