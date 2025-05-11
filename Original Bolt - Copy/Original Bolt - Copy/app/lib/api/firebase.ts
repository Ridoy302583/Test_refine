//@ts-nocheck
import { API_BASE_URL } from '~/config';

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
  user_id: number;
  url_id: string;
  scope: string;
  status: string;
  project_id: string;
  api_key: string;
  auth_domain: string;
  database_url: string;
  storage_bucket: string;
  messaging_sender_id: string;
  app_id: string;
  measurement_id: string;
  apps?: FirebaseApp[];
  created_at?: string;
  name?: string;
}

export interface FirebaseAppConfig {
  config?: {
    apiKey?: string;
    authDomain?: string;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
  }
}

export interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  databaseURL?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export const firebaseApi = {
  fetchAppsConfig: async (projectId: string, clientEmail: string, privateKey: string, webAppId: string, userToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/firebase/web-app-config`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          projectId,
          clientEmail,
          privateKey,
          webAppId,
        })
      });
      
      if (!response.ok) {
        return { 
          error: true, 
          status: response.status,
          message: `HTTP error: ${response.status}`
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching app config for ${webAppId}:`, error);
      return { 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to fetch app config'
      };
    }
  },

  fetchApps: async (projectId: string, clientEmail: string, privateKey: string, userToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/firebase/fetch-apps`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          projectId,
          clientEmail,
          privateKey
        })
      });
      
      if (!response.ok) {
        return { 
          error: true, 
          status: response.status,
          message: `HTTP error: ${response.status}`,
          webApps: [] 
        };
      }
      
      const data = await response.json();
      
      // Add projectId to each app for easier reference
      if (data.webApps && Array.isArray(data.webApps)) {
        data.webApps = data.webApps.map(app => ({
          ...app,
          projectId: projectId
        }));
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching apps for project ${projectId}:`, error);
      return { 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to fetch apps',
        webApps: [] 
      };
    }
  },

  fetchProjects: async (userToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/firebase/firebase-projects-all-me/`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        return { 
          error: true, 
          status: response.status,
          message: `HTTP error: ${response.status}`
        };
      }
      
      const projects = await response.json();
      
      // Ensure each project has an 'apps' array property
      const projectsWithApps = Array.isArray(projects) ? projects.map(project => ({
        ...project,
        apps: project.apps || [],
        // Generate a friendly name if not present
        name: project.name || `Firebase ${project.project_id.substring(0, 8)}...`
      })) : [];
      
      return projectsWithApps;
    } catch (error) {
      console.error(`Error fetching Firebase projects:`, error);
      return { 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to fetch projects'
      };
    }
  },

  // Fetch all apps for multiple projects in one call
  fetchAllProjectApps: async (userToken: string, projects: FirebaseProject[]) => {
    if (!Array.isArray(projects) || projects.length === 0) {
      return { error: true, message: 'No projects provided' };
    }
    
    const results = [];
    
    for (const project of projects) {
      if (project.project_id && project.auth_domain && project.api_key) {
        try {
          const appsResponse = await firebaseApi.fetchApps(
            project.project_id,
            project.auth_domain,
            project.api_key,
            userToken
          );
          
          if (!appsResponse.error) {
            // Process each app to get its config
            const webApps = appsResponse.webApps || [];
            const appsWithConfig = [];
            
            for (const app of webApps) {
              try {
                const appConfigResponse = await firebaseApi.fetchAppsConfig(
                  project.project_id,
                  project.auth_domain,
                  project.api_key,
                  app.appId,
                  userToken
                );
                
                if (!appConfigResponse.error && appConfigResponse.config) {
                  const flattenedApp = {
                    ...app,
                    apiKey: appConfigResponse.config?.apiKey,
                    authDomain: appConfigResponse.config?.authDomain,
                    storageBucket: appConfigResponse.config?.storageBucket,
                    messagingSenderId: appConfigResponse.config?.messagingSenderId,
                    projectId: project.project_id
                  };
                  
                  appsWithConfig.push(flattenedApp);
                } else {
                  appsWithConfig.push({
                    ...app,
                    projectId: project.project_id
                  });
                }
              } catch (configError) {
                console.error('Failed to fetch app config:', configError);
                appsWithConfig.push({
                  ...app,
                  projectId: project.project_id
                });
              }
            }
            
            results.push({
              projectId: project.project_id,
              apps: appsWithConfig
            });
          } else {
            results.push({
              projectId: project.project_id,
              apps: [],
              error: appsResponse.message
            });
          }
        } catch (error) {
          console.error(`Error fetching apps for project ${project.project_id}:`, error);
          results.push({
            projectId: project.project_id,
            apps: [],
            error: error.message || 'Unknown error'
          });
        }
      }
    }
    
    return { projects: results };
  },

  createProject: async (userToken: string, config: FirebaseConfig, urlId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/firebase/firebase-projects`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          urlId,
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
        return { 
          error: true, 
          status: response.status,
          message: `HTTP error: ${response.status}`
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error creating project ${config.projectId}:`, error);
      return { 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to create project'
      };
    }
  },

  deleteProject: async (userToken: string, projectId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/firebase/firebase-projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        return { 
          error: true, 
          status: response.status,
          message: `HTTP error: ${response.status}`
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting project ${projectId}:`, error);
      return { 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to delete project'
      };
    }
  },

  updateProject: async (userToken: string, projectId: string, projectData: Partial<FirebaseProject>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/firebase/firebase-projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        return { 
          error: true, 
          status: response.status,
          message: `HTTP error: ${response.status}`
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error updating project ${projectId}:`, error);
      return { 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to update project'
      };
    }
  }
};