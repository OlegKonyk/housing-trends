'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Bell,
  BellOff,
  Edit,
  Trash2,
  Play,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: any;
  emailNotifications: boolean;
  notificationFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  lastNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<SavedSearch | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchSavedSearches();
  }, [user, router]);

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search/saved`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data);
      }
    } catch (error) {
      console.error('Failed to fetch saved searches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved searches',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeSearch = async (searchId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search/saved/${searchId}/execute`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const results = await response.json();
        // Navigate to search results page with the data
        router.push(`/search/results?id=${searchId}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute search',
        variant: 'destructive',
      });
    }
  };

  const toggleNotifications = async (searchId: string, enabled: boolean) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search/saved/${searchId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ emailNotifications: enabled }),
        }
      );

      if (response.ok) {
        setSavedSearches((prev) =>
          prev.map((search) =>
            search.id === searchId
              ? { ...search, emailNotifications: enabled }
              : search
          )
        );
        toast({
          title: 'Success',
          description: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      });
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search/saved/${searchId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        setSavedSearches((prev) => prev.filter((search) => search.id !== searchId));
        toast({
          title: 'Success',
          description: 'Saved search deleted',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete search',
        variant: 'destructive',
      });
    }
  };

  const formatFilters = (filters: any) => {
    const items = [];
    if (filters.states?.length) {
      items.push(`${filters.states.length} state(s)`);
    }
    if (filters.counties?.length) {
      items.push(`${filters.counties.length} county(s)`);
    }
    if (filters.minPrice || filters.maxPrice) {
      items.push(`Price: $${filters.minPrice || 0} - $${filters.maxPrice || '∞'}`);
    }
    if (filters.minRent || filters.maxRent) {
      items.push(`Rent: $${filters.minRent || 0} - $${filters.maxRent || '∞'}`);
    }
    return items;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Searches</h1>
          <p className="text-muted-foreground mt-1">
            Manage your saved searches and notification preferences
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Search
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Search</DialogTitle>
              <DialogDescription>
                Start by running a search from the homepage, then save it here
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => router.push('/')}>Go to Search</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No saved searches yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first saved search to get started
            </p>
            <Button onClick={() => router.push('/')}>
              <Search className="mr-2 h-4 w-4" />
              Start Searching
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedSearches.map((search) => (
            <Card key={search.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{search.name}</CardTitle>
                    {search.description && (
                      <CardDescription className="mt-1">
                        {search.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    variant={search.emailNotifications ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {search.emailNotifications ? (
                      <Bell className="h-3 w-3 mr-1" />
                    ) : (
                      <BellOff className="h-3 w-3 mr-1" />
                    )}
                    {search.notificationFrequency}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {formatFilters(search.filters).map((filter, i) => (
                    <div key={i} className="flex items-center text-sm text-muted-foreground">
                      {filter.includes('state') && <MapPin className="h-3 w-3 mr-2" />}
                      {filter.includes('Price') && <DollarSign className="h-3 w-3 mr-2" />}
                      {filter.includes('Rent') && <TrendingUp className="h-3 w-3 mr-2" />}
                      {filter}
                    </div>
                  ))}
                </div>
                {search.lastNotifiedAt && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Last notified: {new Date(search.lastNotifiedAt).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeSearch(search.id)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </Button>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleNotifications(search.id, !search.emailNotifications)}
                  >
                    {search.emailNotifications ? (
                      <BellOff className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedSearch(search);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSearch(search.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Saved Search</DialogTitle>
            <DialogDescription>
              Update your saved search settings
            </DialogDescription>
          </DialogHeader>
          {selectedSearch && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={selectedSearch.name}
                  onChange={(e) =>
                    setSelectedSearch({ ...selectedSearch, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={selectedSearch.description || ''}
                  onChange={(e) =>
                    setSelectedSearch({ ...selectedSearch, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Email Notifications</Label>
                <Switch
                  id="notifications"
                  checked={selectedSearch.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSelectedSearch({ ...selectedSearch, emailNotifications: checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="frequency">Notification Frequency</Label>
                <Select
                  value={selectedSearch.notificationFrequency}
                  onValueChange={(value: any) =>
                    setSelectedSearch({ ...selectedSearch, notificationFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Save changes
              setIsEditDialogOpen(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
