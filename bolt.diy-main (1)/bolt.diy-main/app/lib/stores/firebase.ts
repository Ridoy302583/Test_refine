
import { atom } from 'nanostores';
import { API_BASE_URL } from '~/config';
import { firebaseApi } from '../api/firebase';

// Types
export interface FirebaseUser {
  id: string;
  email: string;
  role?: string;
}

export interface FirebaseApp {
  appId: string;
  displayName?: string;
  projectId?: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export interface FirebaseProject {
  id: string;
  name: string;
  project_id: string;
  auth_domain: string;
  api_key: string;
  database_url: string;
  storage_bucket: string;
  messaging_sender_id: string;
  app_id: string;
  measurement_id: string;
  apps?: FirebaseApp[];
  created_at?: string;
  status?: string;
  organization_id?: string;
}

export interface FirebaseCredentials {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FirebaseStats {
  projects: FirebaseProject[];
}

export interface FirebaseConnectionState {
  user: FirebaseUser | null;
  token: string;
  stats?: FirebaseStats;
  selectedAppId?: string;
  isConnected?: boolean;
  credentials?: FirebaseCredentials;
}

// Initialize with empty state
const initialState: FirebaseConnectionState = {
  user: null,
  token: '',
  stats: undefined,
  selectedAppId: undefined,
  isConnected: false,
  credentials: undefined
};

// Store
export const firebaseConnection = atom<FirebaseConnectionState>(initialState);
export const isConnecting = atom(false);
export const isFetchingStats = atom(false);
export const isFetchingApps = atom(false);

// Update the connection state
export function updateFirebaseConnection(connection: Partial<FirebaseConnectionState>) {
  const currentState = firebaseConnection.get();

  if (connection.user !== undefined || connection.token !== undefined) {
    const newUser = connection.user !== undefined ? connection.user : currentState.user;
    const newToken = connection.token !== undefined ? connection.token : currentState.token;
    connection.isConnected = !!(newUser && newToken);
  }

  // Handle app selection
  if (connection.selectedAppId !== undefined) {
    // Find the app across all projects
    let selectedApp: FirebaseApp | undefined;
    let projectWithApp: FirebaseProject | undefined;
    
    if (currentState.stats?.projects) {
      for (const project of currentState.stats.projects) {
        if (project.apps && project.apps.length) {
          const app = project.apps.find(app => app.appId === connection.selectedAppId);
          if (app) {
            selectedApp = app;
            projectWithApp = project;
            break;
          }
        }
      }
    }
    
    // If we found the app, update credentials
    if (selectedApp && projectWithApp) {
      // Create project-level credentials first
      const baseCredentials = {
        apiKey: projectWithApp.api_key,
        authDomain: projectWithApp.auth_domain,
        projectId: projectWithApp.project_id,
        storageBucket: projectWithApp.storage_bucket,
        messagingSenderId: projectWithApp.messaging_sender_id,
        appId: selectedApp.appId || projectWithApp.app_id,
        measurementId: projectWithApp.measurement_id
      };
      
      // Override with app-specific values when available
      connection.credentials = {
        ...baseCredentials,
        apiKey: selectedApp.apiKey || baseCredentials.apiKey,
        authDomain: selectedApp.authDomain || baseCredentials.authDomain,
        storageBucket: selectedApp.storageBucket || baseCredentials.storageBucket,
        messagingSenderId: selectedApp.messagingSenderId || baseCredentials.messagingSenderId,
      };
    } else if (connection.selectedAppId === '') {
      // Clear credentials if deselecting
      connection.credentials = undefined;
    }
  }

  // If stats are being updated, ensure all projects have apps arrays
  if (connection.stats?.projects) {
    connection.stats.projects = connection.stats.projects.map(project => ({
      ...project,
      apps: project.apps || []
    }));
  }

  const newState = { ...currentState, ...connection };
  firebaseConnection.set(newState);
}

// Helper function to find app by ID across all projects
export function findAppById(appId: string): { app: FirebaseApp | null, project: FirebaseProject | null } {
  const currentState = firebaseConnection.get();
  
  if (!currentState.stats?.projects) {
    return { app: null, project: null };
  }
  
  for (const project of currentState.stats.projects) {
    if (project.apps && project.apps.length) {
      const app = project.apps.find(app => app.appId === appId);
      if (app) {
        return { app, project };
      }
    }
  }
  
  return { app: null, project: null };
}

// Helper function to generate timestamp
const getYYYYMMDDHHmmss = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return parseInt(`${year}${month}${day}${hours}${minutes}${seconds}`);
};

// Helper function to generate a random ID
const randomGenerate = (userId?: string) => {
  if (userId) {
    const dateNumber = getYYYYMMDDHHmmss();
    const randomId = `${userId}_${dateNumber}`;
    return randomId;
  }
  return `anonymous_${getYYYYMMDDHHmmss()}`;
};

// API functions
export async function fetchFirebaseData(token: string) {
  try {
    const response = await firebaseApi.fetchProjects(token);
    
    if (response.error) {
      throw new Error(response.message || 'Failed to fetch Firebase data');
    }
    
    // Construct user object from first project if available
    let user = null;
    if (response.length > 0) {
      user = {
        id: response[0].user_id?.toString() || 'unknown',
        email: 'Firebase User', // API doesn't return email
      };
    }
    
    // Ensure all projects have apps array (even if empty)
    const projectsWithApps = response.map(project => ({
      ...project,
      apps: project.apps || []
    }));
    
    // Construct stats object
    const stats: FirebaseStats = {
      projects: projectsWithApps
    };
    
    return { user, stats };
  } catch (error) {
    console.error('Failed to fetch Firebase data:', error);
    throw error;
  }
}

export async function fetchFirebaseStats(token: string) {
  isFetchingStats.set(true);

  try {
    const data = await fetchFirebaseData(token);
    
    updateFirebaseConnection({
      user: data.user,
      stats: data.stats,
    });
    
    return data;
  } catch (error) {
    console.error('Failed to fetch Firebase stats:', error);
    throw error;
  } finally {
    isFetchingStats.set(false);
  }
}

export async function fetchProjectApps(projectId: string, clientEmail: string, privateKey: string, token: string) {
  isFetchingApps.set(true);

  try {
    const response = await firebaseApi.fetchApps(
      projectId,
      clientEmail,
      privateKey, 
      token
    );
    // If API returns an error, return empty array
    if (response.error) {
      console.warn(`API error for ${projectId}:`, response.message);
      return [];
    }

    // Extract web apps
    const webApps = response.webApps || [];
    
    const appsWithConfig = [];
    
    // Process each app to get its config
    for (const app of webApps) {
      try {
        const appConfigResponse = await firebaseApi.fetchAppsConfig(
          projectId,
          clientEmail,
          privateKey,
          app.appId,
          token
        );
        
        if (!appConfigResponse.error && appConfigResponse.config) {
          const flattenedApp = {
            ...app,
            apiKey: appConfigResponse.config?.apiKey,
            authDomain: appConfigResponse.config?.authDomain,
            storageBucket: appConfigResponse.config?.storageBucket,
            messagingSenderId: appConfigResponse.config?.messagingSenderId,
            projectId: projectId
          };
          
          appsWithConfig.push(flattenedApp);
        } else {
          // If we couldn't get config, still add the basic app info
          appsWithConfig.push({
            ...app,
            projectId: projectId
          });
        }
      } catch (configError) {
        console.error('Failed to fetch app config:', configError);
        appsWithConfig.push({
          ...app,
          projectId: projectId
        });
      }
    }
    
    // Update the apps in the project
    const currentState = firebaseConnection.get();
    if (currentState.stats?.projects) {
      const updatedProjects = currentState.stats.projects.map(project => {
        if (project.project_id === projectId) {
          return {
            ...project,
            apps: appsWithConfig
          };
        }
        return project;
      });
      
      updateFirebaseConnection({
        stats: {
          ...currentState.stats,
          projects: updatedProjects
        }
      });
    }
    
    return appsWithConfig;
  } catch (error) {
    console.error(`Error fetching apps for ${projectId}:`, error);
    return [];
  } finally {
    isFetchingApps.set(false);
  }
}

// Extract credentials from project
export function extractCredentialsFromProject(project: FirebaseProject): FirebaseCredentials {
  return {
    apiKey: project.api_key,
    authDomain: project.auth_domain,
    projectId: project.project_id,
    storageBucket: project.storage_bucket,
    messagingSenderId: project.messaging_sender_id,
    appId: project.app_id,
    measurementId: project.measurement_id
  };
}

// Save Firebase configuration
export async function saveFirebaseConfig(token: string, config: any, userId?: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/firebase/firebase-projects`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        url_id: randomGenerate(userId),
        scope: "global",
        status: "active",
        project_id: config.projectId,
        api_key: config.privateKey,
        auth_domain: config.clientEmail,
        database_url: config.databaseURL || "string",
        storage_bucket: config.storageBucket || "string",
        messaging_sender_id: config.messagingSenderId || "string",
        app_id: config.appId || "string",
        measurement_id: config.measurementId || "string"
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save Firebase configuration');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error saving Firebase config:", error);
    throw error;
  }
}

// Centralized refresh function
export async function refreshAllFirebaseData() {
  const currentState = firebaseConnection.get();
  
  if (!currentState.token) {
    console.error('Cannot refresh: No Firebase token available');
    return false;
  }
  
  isConnecting.set(true);
  
  try {
    // Refresh connection and stats
    const data = await fetchFirebaseData(currentState.token);
    
    updateFirebaseConnection({
      user: data.user,
      stats: data.stats,
    });
    
    // Fetch apps for all projects to ensure they're loaded
    if (data.stats?.projects) {
      for (const project of data.stats.projects) {
        if (project.project_id && project.auth_domain && project.api_key) {
          try {
            await fetchProjectApps(
              project.project_id,
              project.auth_domain,
              project.api_key,
              currentState.token
            );
          } catch (error) {
            console.error(`Failed to fetch apps for project ${project.project_id}:`, error);
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to refresh Firebase data:', error);
    return false;
  } finally {
    isConnecting.set(false);
  }
}