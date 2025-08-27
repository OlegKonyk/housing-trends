'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Home,
  Mail,
  Trash2,
  Check,
  X,
  Calendar,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'PRICE_ALERT' | 'NEW_LISTINGS' | 'MARKET_UPDATE' | 'SYSTEM' | 'WELCOME';
  subject: string;
  content: string;
  metadata?: any;
  read: boolean;
  readAt?: string;
  sent: boolean;
  sentAt?: string;
  createdAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchNotifications();
    fetchStats();
  }, [user, router]);

  const fetchNotifications = async (unreadOnly = false) => {
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`);
      if (unreadOnly) {
        url.searchParams.append('unreadOnly', 'true');
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, read: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        if (stats) {
          setStats({ ...stats, unread: Math.max(0, stats.unread - 1) });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true, readAt: new Date().toISOString() }))
        );
        if (stats) {
          setStats({ ...stats, unread: 0 });
        }
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
        toast({
          title: 'Success',
          description: 'Notification deleted',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PRICE_ALERT':
        return <TrendingUp className="h-4 w-4" />;
      case 'NEW_LISTINGS':
        return <Home className="h-4 w-4" />;
      case 'MARKET_UPDATE':
        return <AlertCircle className="h-4 w-4" />;
      case 'SYSTEM':
        return <Bell className="h-4 w-4" />;
      case 'WELCOME':
        return <Mail className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PRICE_ALERT':
        return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'NEW_LISTINGS':
        return 'text-green-600 bg-green-50 dark:bg-green-950';
      case 'MARKET_UPDATE':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
      case 'SYSTEM':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
      case 'WELCOME':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-950';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'unread') return !notif.read;
    if (activeTab === 'alerts') return notif.type === 'PRICE_ALERT';
    if (activeTab === 'updates') return notif.type === 'MARKET_UPDATE';
    return true;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with market changes and alerts
          </p>
        </div>
        {stats && stats.unread > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {stats.unread} unread
            </Badge>
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unread}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Price Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.PRICE_ALERT || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Market Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.MARKET_UPDATE || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread'
                    ? "You're all caught up!"
                    : 'No notifications in this category'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    'transition-all',
                    !notification.read && 'border-primary bg-accent/5'
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-full', getNotificationColor(notification.type))}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {notification.subject}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {notification.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(notification.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {notification.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
