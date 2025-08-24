import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5615b6000d734d8db84eb110302541c1',
  appName: 'vid-tech-flow',
  webDir: 'dist',
  server: {
    url: 'https://5615b600-0d73-4d8d-b84e-b110302541c1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      requestPermissions: true,
      quality: 90,
      allowEditing: false,
      resultType: 'uri',
      source: 'camera',
      direction: 'rear'
    }
  }
};

export default config;