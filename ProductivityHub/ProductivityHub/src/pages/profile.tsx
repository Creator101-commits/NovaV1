import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Settings,
  Bell,
  Moon,
  Sun,
  Mail,
  Calendar,
  GraduationCap,
  Save,
  Camera,
} from "lucide-react";

export default function Profile() {
  const { user, userData, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || user?.displayName?.split(' ')[0] || '',
    lastName: userData?.lastName || user?.displayName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
  });

  const [notifications, setNotifications] = useState({
    assignments: true,
    reminders: true,
    achievements: false,
    weeklyReport: true,
  });

  const handleSaveProfile = async () => {
    try {
      // In real app, this would update Firebase user data
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    // In real app, this would save to Firebase
    toast({
      title: "Notification settings updated",
      description: `${key} notifications ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Mock user stats
  const userStats = {
    joinDate: new Date('2024-01-15'),
    totalAssignments: 156,
    completedAssignments: 124,
    studyHours: 145,
    currentStreak: 12,
    achievements: [
      { name: "Early Bird", description: "Completed 10 morning study sessions", date: "2024-01-20" },
      { name: "Consistent", description: "Maintained 7-day study streak", date: "2024-01-25" },
      { name: "Productive", description: "Completed 50 assignments", date: "2024-02-01" },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <User className="h-8 w-8 mr-3 text-primary" />
          Profile & Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(user?.displayName || "User")}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="mt-4">{user?.displayName}</CardTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-2">
                <GraduationCap className="h-3 w-3 mr-1" />
                Student
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member since</span>
                  <span>{userStats.joinDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total assignments</span>
                  <span>{userStats.totalAssignments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="text-green-600">{userStats.completedAssignments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Study hours</span>
                  <span>{userStats.studyHours}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current streak</span>
                  <span className="text-primary">{userStats.currentStreak} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Personal Information</CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        disabled={!isEditing}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        disabled={!isEditing}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled={true}
                      type="email"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                          <span>Dark Mode</span>
                        </div>
                        <Switch
                          checked={theme === "dark"}
                          onCheckedChange={toggleTheme}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button variant="destructive" onClick={signOut}>
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Assignment Due Dates</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when assignments are due soon
                        </p>
                      </div>
                      <Switch
                        checked={notifications.assignments}
                        onCheckedChange={(value) => handleNotificationChange('assignments', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Study Reminders</p>
                        <p className="text-sm text-muted-foreground">
                          Daily reminders to maintain your study streak
                        </p>
                      </div>
                      <Switch
                        checked={notifications.reminders}
                        onCheckedChange={(value) => handleNotificationChange('reminders', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Achievements</p>
                        <p className="text-sm text-muted-foreground">
                          Notifications when you unlock new achievements
                        </p>
                      </div>
                      <Switch
                        checked={notifications.achievements}
                        onCheckedChange={(value) => handleNotificationChange('achievements', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Report</p>
                        <p className="text-sm text-muted-foreground">
                          Weekly summary of your productivity and progress
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReport}
                        onCheckedChange={(value) => handleNotificationChange('weeklyReport', value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle>Achievements & Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userStats.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned on {new Date(achievement.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">Unlocked</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
