import { paths } from 'src/routes/paths';

import packageJson from '../../../package.json';

export type ConfigValue = {
  appName: string;
  appVersion: string;
  serverUrl: string;
  assetsDir: string;
  auth: {
    method: 'jwt';
    skip: boolean;
    redirectPath: string;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
  };
};

function getServerUrl(): string {
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (typeof window !== 'undefined' && window.location.hostname) {
    if (
      !envUrl ||
      envUrl.includes('localhost') ||
      envUrl.includes('127.0.0.1') ||
      /^\d+\.\d+\.\d+\.\d+/.test(envUrl.replace(/^https?:\/\//, ''))
    ) {
      const port = envUrl ? new URL(envUrl).port || '8083' : '8083';
      return `${window.location.protocol}//${window.location.hostname}:${port}`;
    }
  }
  return envUrl ?? '';
}

export const CONFIG: ConfigValue = {
  appName: 'Tuai',
  appVersion: packageJson.version,
  serverUrl: getServerUrl(),
  assetsDir: import.meta.env.VITE_ASSETS_DIR ?? '',
  auth: {
    method: 'jwt',
    skip: false,
    redirectPath: paths.dashboard.root,
  },
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  },
};
