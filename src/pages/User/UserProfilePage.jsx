import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, updateUserSettings } from '../../services/authService';
import {
  AnimatedCard,
  AnimatedText,
  AnimatedTabContent
} from '../../components/animated';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Slider } from '../../components/ui/slider';
import {
  User,
  Shield,
  Bell,
  Cloud,
  CreditCard,
  Lock,
  Key,
  Settings,
  Eye,
  AlertTriangle,
  Info
} from 'lucide-react';

// Mock user ID for placeholder - in a real app, this would come from auth context/storage
const MOCK_USER_ID = '1';

const UserProfilePage = () => {
  const [profile, setProfile] = useState({ name: '', email: '', bio: '' });
  const [settings, setSettings] = useState({
    subscription: {
      plan: 'free',
      expiryDate: '2025-12-31',
      autoRenew: true
    },
    storage: {
      total: 5, // in GB
      used: 1.2, // in GB
      usedPercentage: 24,
      byCategory: {
        documents: 0.3,
        photos: 0.5,
        videos: 0.2,
        other: 0.2
      }
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: '2023-10-15',
      passwordStrength: 'good',
      masterPasswordHint: 'My favorite place'
    },
    notifications: {
      email: true,
      push: true,
      storage: true,
      security: true
    },
    privacy: {
      shareAnalytics: false,
      showRecentFiles: true,
      allowRemoteWipe: true
    },
    display: {
      theme: 'auto',
      compact: false,
      animations: true
    }
  });

  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [masterPasswordVisible, setMasterPasswordVisible] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getUserProfile(MOCK_USER_ID);
        if (response && response.success && response.data && response.data.user) {
          setProfile(response.data.user);
        } else {
          setError(response.error || 'Failed to fetch profile.');
        }
      } catch (err) {
        setError('An unexpected error occurred while fetching profile.');
        console.error('Fetch profile error:', err);
      }
      setLoading(false);
    };

    // Set mock data for development
    setProfile({
      name: 'John Doe',
      email: 'john.doe@example.com',
      bio: 'I am a software developer with 5 years of experience.'
    });
    setLoading(false);

    // Uncomment to fetch real data
    // fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({ ...prevProfile, [name]: value }));
  };

  const handleSettingChange = (section, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: value
      }
    }));
  };

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Remove 'id' and other non-updatable fields if necessary before sending
      const { id, email, ...updateData } = profile;
      const response = await updateUserProfile(MOCK_USER_ID, updateData);
      if (response && response.success) {
        setProfile(response.data.user || profile);
        setSuccessMessage('Profile updated successfully!');
        setEditing(false);
      } else {
        setError(response?.error || 'Failed to update profile.');
      }
    } catch (err) {
      setError('An unexpected error occurred while updating profile.');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (section) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const updateData = {
        [section]: settings[section]
      };
      const response = await updateUserSettings(MOCK_USER_ID, updateData);
      if (response && response.success) {
        setSettings(prev => ({
          ...prev,
          [section]: response.data?.settings?.[section] || prev[section]
        }));
        setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully!`);
      } else {
        setError(response?.error || `Failed to update ${section} settings.`);
      }
    } catch (err) {
      setError(`An unexpected error occurred while updating ${section} settings.`);
      console.error('Update settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Mock successful password change
    setTimeout(() => {
      setSuccessMessage('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          lastPasswordChange: new Date().toISOString().split('T')[0]
        }
      }));
      setLoading(false);
    }, 1000);
  };

  const handleMasterPasswordChange = async () => {
    // Mock successful master password change
    setLoading(true);
    setTimeout(() => {
      setSuccessMessage('Master password changed successfully!');
      setMasterPasswordVisible(false);
      setLoading(false);
    }, 1000);
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <AnimatedCard className="bg-muted rounded-xl shadow">
        {!editing ? (
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mr-4">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.name || 'User Name'}</h2>
                <p className="text-muted-foreground">{profile.email || 'user@example.com'}</p>
              </div>
            </div>

            <div className="mb-4">
              <strong className="block mb-1">Bio:</strong>
              <p className="whitespace-pre-wrap">{profile.bio || 'Not set'}</p>
            </div>

            <Button
              onClick={() => { setEditing(true); setSuccessMessage(''); setError(''); }}
              className="w-full"
            >
              Edit Profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="p-6">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <Input
                id="name"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                placeholder="Your name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email (cannot be changed)</label>
              <Input
                id="email"
                name="email"
                value={profile.email}
                disabled
                placeholder="Your email"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
              <Input
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleProfileChange}
                placeholder="Tell us about yourself"
              />
            </div>

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setEditing(false); setError(''); setSuccessMessage(''); }}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </AnimatedCard>

      <AnimatedCard className="bg-muted rounded-xl shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Password Settings</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">Current Password</label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                placeholder="Enter your current password"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">New Password</label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm New Password</label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </div>
      </AnimatedCard>
    </div>
  );

  const renderSubscriptionTab = () => (
    <AnimatedCard className="bg-muted rounded-xl shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">
              {settings.subscription.plan === 'free' ? 'Free Plan' :
               settings.subscription.plan === 'premium' ? 'Premium Plan' :
               settings.subscription.plan === 'business' ? 'Business Plan' :
               'Custom Plan'}
            </h3>
            <p className="text-muted-foreground">
              {settings.subscription.plan === 'free' ? '5GB Storage' :
               settings.subscription.plan === 'premium' ? '100GB Storage' :
               settings.subscription.plan === 'business' ? '500GB Storage' :
               'Custom Storage'}
            </p>
          </div>
          <div className="relative">
            <Badge variant="outline" className="absolute top-0 right-0 z-10">
              Active
            </Badge>
            <div className="bg-muted p-4 rounded-md min-w-[100px] h-[60px] flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span>Plan Expiry</span>
            <span>{settings.subscription.expiryDate}</span>
          </div>
          <div className="flex justify-between mb-2 items-center">
            <span>Auto Renewal</span>
            <Switch
              checked={settings.subscription.autoRenew}
              onCheckedChange={(checked) => handleSettingChange('subscription', 'autoRenew', checked)}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h4 className="font-semibold">Available Plans</h4>

          <Card className="mb-2 p-4">
            <div className="flex justify-between">
              <div>
                <h5 className="font-bold">Free Plan</h5>
                <p>5GB Storage</p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-lg">$0</span>
                <Button
                  size="sm"
                  disabled={settings.subscription.plan === 'free'}
                  variant={settings.subscription.plan === 'free' ? "secondary" : "outline"}
                >
                  {settings.subscription.plan === 'free' ? 'Current Plan' : 'Select'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="mb-2 p-4">
            <div className="flex justify-between">
              <div>
                <h5 className="font-bold">Premium Plan</h5>
                <p>100GB Storage + Advanced Security</p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-lg">$9.99/mo</span>
                <Button
                  size="sm"
                  variant={settings.subscription.plan === 'premium' ? "secondary" : "default"}
                  disabled={settings.subscription.plan === 'premium'}
                >
                  {settings.subscription.plan === 'premium' ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex justify-between">
              <div>
                <h5 className="font-bold">Business Plan</h5>
                <p>500GB Storage + Advanced Security + Team Sharing</p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-lg">$24.99/mo</span>
                <Button
                  size="sm"
                  variant={settings.subscription.plan === 'business' ? "secondary" : "default"}
                  disabled={settings.subscription.plan === 'business'}
                >
                  {settings.subscription.plan === 'business' ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Button
          className="w-full mt-6"
          onClick={() => handleSettingsSubmit('subscription')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </AnimatedCard>
  );

  const renderStorageTab = () => (
    <AnimatedCard className="bg-muted rounded-xl shadow">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mr-4">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Storage Overview</h3>
            <p className="text-muted-foreground">
              {settings.storage.used.toFixed(1)}GB of {settings.storage.total}GB used
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span>Storage Used</span>
            <span>{settings.storage.usedPercentage}%</span>
          </div>
          <Progress value={settings.storage.usedPercentage} className="h-2" />
        </div>

        <div className="mb-6">
          <h4 className="font-semibold mb-4">Storage Breakdown</h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span>Documents</span>
                <span>{settings.storage.byCategory.documents.toFixed(1)}GB</span>
              </div>
              <Progress
                value={(settings.storage.byCategory.documents / settings.storage.total * 100)}
                className="h-1.5 bg-blue-100"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Photos</span>
                <span>{settings.storage.byCategory.photos.toFixed(1)}GB</span>
              </div>
              <Progress
                value={(settings.storage.byCategory.photos / settings.storage.total * 100)}
                className="h-1.5 bg-cyan-100"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Videos</span>
                <span>{settings.storage.byCategory.videos.toFixed(1)}GB</span>
              </div>
              <Progress
                value={(settings.storage.byCategory.videos / settings.storage.total * 100)}
                className="h-1.5 bg-orange-100"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Other</span>
                <span>{settings.storage.byCategory.other.toFixed(1)}GB</span>
              </div>
              <Progress
                value={(settings.storage.byCategory.other / settings.storage.total * 100)}
                className="h-1.5 bg-purple-100"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold mb-4">Storage Management</h4>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="flex items-center">
              <Cloud className="mr-2 h-4 w-4" /> Optimize Storage
            </Button>
            <Button variant="destructive" className="flex items-center">
              <Cloud className="mr-2 h-4 w-4" /> Empty Trash
            </Button>
          </div>
        </div>

        <Alert variant="info" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Storage Tip</AlertTitle>
          <AlertDescription>
            Enable Smart Storage to automatically optimize and manage your files.
          </AlertDescription>
        </Alert>

        <Button
          className="w-full"
          onClick={() => handleSettingsSubmit('storage')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </AnimatedCard>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <AnimatedCard className="bg-muted rounded-xl shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Security Settings</h3>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Switch
                checked={settings.security.twoFactorEnabled}
                onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorEnabled', checked)}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-medium">Last Password Change</h4>
                <p className="text-sm text-muted-foreground">Date when you last changed your password</p>
              </div>
              <span>{settings.security.lastPasswordChange}</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-medium">Password Strength</h4>
                <p className="text-sm text-muted-foreground">Strength of your current password</p>
              </div>
              <Badge variant={
                settings.security.passwordStrength === 'weak' ? "destructive" :
                settings.security.passwordStrength === 'medium' ? "outline" : "default"
              }>
                {settings.security.passwordStrength.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-medium">Active Sessions</h4>
                <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => handleSettingsSubmit('security')}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </AnimatedCard>

      <AnimatedCard className="bg-muted rounded-xl shadow">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-4">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Master Password</h3>
              <p className="text-muted-foreground">Manage your vault's master password</p>
            </div>
          </div>

          {!masterPasswordVisible ? (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">Master Password Hint</h4>
                    <p className="text-sm text-muted-foreground">
                      {settings.security.masterPasswordHint || 'No hint set'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMasterPasswordVisible(true)}
                  >
                    Change
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Security Tip</AlertTitle>
                <AlertDescription>
                  Your master password protects all your sensitive data. Make sure it's strong and unique.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <form>
              <div className="mb-4">
                <label htmlFor="currentMasterPassword" className="block text-sm font-medium mb-1">Current Master Password</label>
                <Input
                  id="currentMasterPassword"
                  type="password"
                  placeholder="Enter your current master password"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="newMasterPassword" className="block text-sm font-medium mb-1">New Master Password</label>
                <Input
                  id="newMasterPassword"
                  type="password"
                  placeholder="Enter new master password"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="confirmMasterPassword" className="block text-sm font-medium mb-1">Confirm New Master Password</label>
                <Input
                  id="confirmMasterPassword"
                  type="password"
                  placeholder="Confirm new master password"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="passwordHint" className="block text-sm font-medium mb-1">Password Hint (Optional)</label>
                <Input
                  id="passwordHint"
                  placeholder="Enter a hint to help you remember"
                  value={settings.security.masterPasswordHint}
                  onChange={(e) => handleSettingChange('security', 'masterPasswordHint', e.target.value)}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleMasterPasswordChange}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Updating...' : 'Update Master Password'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMasterPasswordVisible(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </AnimatedCard>
    </div>
  );

  const renderNotificationsTab = () => (
    <AnimatedCard className="bg-muted rounded-xl shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">Receive important updates via email</p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">Receive alerts on your devices</p>
            </div>
            <Switch
              checked={settings.notifications.push}
              onCheckedChange={(checked) => handleSettingChange('notifications', 'push', checked)}
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Storage Alerts</h4>
              <p className="text-sm text-muted-foreground">Get notified when approaching storage limits</p>
            </div>
            <Switch
              checked={settings.notifications.storage}
              onCheckedChange={(checked) => handleSettingChange('notifications', 'storage', checked)}
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Security Alerts</h4>
              <p className="text-sm text-muted-foreground">Get notified about important security events</p>
            </div>
            <Switch
              checked={settings.notifications.security}
              onCheckedChange={(checked) => handleSettingChange('notifications', 'security', checked)}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="mb-4">
          <h4 className="font-medium mb-2">Notification Frequency</h4>
          <Select defaultValue="instant">
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant</SelectItem>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Summary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={() => handleSettingsSubmit('notifications')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>
    </AnimatedCard>
  );

  const renderPrivacyTab = () => (
    <AnimatedCard className="bg-muted rounded-xl shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Share Usage Analytics</h4>
              <p className="text-sm text-muted-foreground">Help us improve by sharing anonymous usage data</p>
            </div>
            <Switch
              checked={settings.privacy.shareAnalytics}
              onCheckedChange={(checked) => handleSettingChange('privacy', 'shareAnalytics', checked)}
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Show Recent Files on Dashboard</h4>
              <p className="text-sm text-muted-foreground">Display recently accessed files on your home screen</p>
            </div>
            <Switch
              checked={settings.privacy.showRecentFiles}
              onCheckedChange={(checked) => handleSettingChange('privacy', 'showRecentFiles', checked)}
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Allow Remote Wipe</h4>
              <p className="text-sm text-muted-foreground">Enable remote data deletion if your device is lost</p>
            </div>
            <Switch
              checked={settings.privacy.allowRemoteWipe}
              onCheckedChange={(checked) => handleSettingChange('privacy', 'allowRemoteWipe', checked)}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="mb-4">
          <h4 className="font-medium mb-2">Session Timeout</h4>
          <p className="text-sm text-muted-foreground mb-2">Automatically log out after period of inactivity</p>
          <Select defaultValue="30">
            <SelectTrigger>
              <SelectValue placeholder="Select timeout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={() => handleSettingsSubmit('privacy')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>
    </AnimatedCard>
  );

  const renderDisplayTab = () => (
    <AnimatedCard className="bg-muted rounded-xl shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Display Settings</h3>

        <div className="space-y-4">
          <div className="mb-4">
            <h4 className="font-medium mb-2">Theme</h4>
            <p className="text-sm text-muted-foreground mb-2">Choose your preferred theme</p>
            <Select
              defaultValue={settings.display.theme}
              onValueChange={(value) => handleSettingChange('display', 'theme', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Compact Mode</h4>
              <p className="text-sm text-muted-foreground">Display more content with reduced spacing</p>
            </div>
            <Switch
              checked={settings.display.compact}
              onCheckedChange={(checked) => handleSettingChange('display', 'compact', checked)}
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Enable Animations</h4>
              <p className="text-sm text-muted-foreground">Toggle UI animations and transitions</p>
            </div>
            <Switch
              checked={settings.display.animations}
              onCheckedChange={(checked) => handleSettingChange('display', 'animations', checked)}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="mb-4">
          <h4 className="font-medium mb-2">Text Size</h4>
          <div className="flex items-center space-x-2">
            <span className="text-sm">A</span>
            <Slider
              defaultValue={[100]}
              max={150}
              min={75}
              step={5}
              className="flex-1"
            />
            <span className="text-lg">A</span>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => handleSettingsSubmit('display')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Display Settings'}
        </Button>
      </div>
    </AnimatedCard>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">User Settings</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4">
          <div className="flex-1">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4" /> Subscription
          </TabsTrigger>
          <TabsTrigger value="storage">
            <Cloud className="mr-2 h-4 w-4" /> Storage
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="mr-2 h-4 w-4" /> Privacy
          </TabsTrigger>
          <TabsTrigger value="display">
            <Settings className="mr-2 h-4 w-4" /> Display
          </TabsTrigger>
        </TabsList>

        <AnimatedTabContent>
          <TabsContent value="profile">{renderProfileTab()}</TabsContent>
          <TabsContent value="subscription">{renderSubscriptionTab()}</TabsContent>
          <TabsContent value="storage">{renderStorageTab()}</TabsContent>
          <TabsContent value="security">{renderSecurityTab()}</TabsContent>
          <TabsContent value="notifications">{renderNotificationsTab()}</TabsContent>
          <TabsContent value="privacy">{renderPrivacyTab()}</TabsContent>
          <TabsContent value="display">{renderDisplayTab()}</TabsContent>
        </AnimatedTabContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
