import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.personalpod.app',
  appName: 'PersonalPod',
  webDir: 'dist',
  server: {
    url: 'http://localhost:5173',
    cleartext: true
  }
};

export default config;