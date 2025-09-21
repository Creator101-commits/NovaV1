import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function CalendarCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const provider = window.location.pathname.includes('google') ? 'google' : 'outlook';

      if (error) {
        toast({
          title: "Authentication Failed",
          description: `Failed to connect to ${provider} Calendar: ${error}`,
          variant: "destructive"
        });
        setLocation('/calendar');
        return;
      }

      if (!code) {
        toast({
          title: "Authentication Failed", 
          description: "No authorization code received",
          variant: "destructive"
        });
        setLocation('/calendar');
        return;
      }

      try {
        // Exchange code for access token
        const response = await fetch('/api/auth/calendar/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            provider,
            redirectUri: window.location.origin + window.location.pathname
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange authorization code');
        }

        const { accessToken, refreshToken } = await response.json();

        // Store tokens securely
        localStorage.setItem(`${provider}_calendar_access_token`, accessToken);
        if (refreshToken) {
          localStorage.setItem(`${provider}_calendar_refresh_token`, refreshToken);
        }

        toast({
          title: "Success!",
          description: `Successfully connected to ${provider} Calendar!`,
        });

        setLocation('/calendar');
      } catch (error) {
        console.error('Calendar auth error:', error);
        toast({
          title: "Connection Failed",
          description: `Failed to complete ${provider} Calendar authentication`,
          variant: "destructive"
        });
        setLocation('/calendar');
      }
    };

    handleCallback();
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Connecting Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Completing calendar authentication...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
