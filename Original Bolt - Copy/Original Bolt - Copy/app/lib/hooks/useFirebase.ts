
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { logStore } from '~/lib/stores/logs';
import {
  firebaseConnection,
  isConnecting,
  isFetchingStats,
  isFetchingApps,
  updateFirebaseConnection,
  fetchProjectApps,
  fetchFirebaseData,
  saveFirebaseConfig,
  findAppById
} from '~/lib/stores/firebase';
import { firebaseApi } from '../api/firebase';
import useUser from '~/types/user';
import { API_BASE_URL } from '~/config';

export function useFirebaseConnection() {
  const connection = useStore(firebaseConnection);
  const connecting = useStore(isConnecting);
  const fetchingStats = useStore(isFetchingStats);
  const fetchingApps = useStore(isFetchingApps);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { getStoredToken, user } = useUser();
  const user_token = getStoredToken();

  const fetchData = useCallback(async () => {
    if (user_token) {
      try {
        const data = await fetchFirebaseData(user_token);
        return data;
      }
      catch (error) {
        console.error("Error fetching Firebase data:", error);
        throw error;
      }
    }
  }, [user_token]);

  const initialFetch = useCallback(async (userToken) => {
    if (!userToken) return;
    
    try {
      const savedProjects = await firebaseApi.fetchProjects(userToken);
      
      if (savedProjects && Array.isArray(savedProjects) && savedProjects.length > 0) {
        // Initialize the store first with projects that have empty apps arrays
        const projectsWithEmptyApps = savedProjects.map(project => ({
          ...project,
          apps: []
        }));
        
        // Update the store with these projects to ensure it's initialized
        const data = {
          user: {
            id: savedProjects[0].user_id?.toString() || 'unknown',
            email: 'Firebase User',
          },
          stats: {
            projects: projectsWithEmptyApps
          }
        };
        
        updateFirebaseConnection({
          isConnected: true,
          user: data.user,
          stats: data.stats,
          token: userToken,
        });

        
        // Now fetch apps for each project
        for (const project of projectsWithEmptyApps) {
          if (project.project_id && project.auth_domain && project.api_key) {
            try {
              await fetchProjectApps(
                project.project_id,
                project.auth_domain,
                project.api_key,
                userToken
              );
            } catch (appError) {
              console.error(`Failed to fetch apps for project ${project.project_id}:`, appError);
              // Continue with next project
            }
          }
        }
      } else if (savedProjects?.error) {
        console.error('Error fetching projects:', savedProjects.message);
      }
    }
    catch (error) {
      console.error("Error in initialFetch:", error);
    }
  }, []);

  useEffect(() => {
    if (!user_token) return;
    initialFetch(user_token);
  }, [user_token, initialFetch]);

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

  const postFirebaseProject = async (
    user_token: string, 
    config: any, 
    userId?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/firebase/firebase-projects`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user_token}`
        },
        body: JSON.stringify({
          urlId: randomGenerate(userId),
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
        throw new Error(`Failed to post Firebase project: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data) {
        updateFirebaseConnection({
          isConnected: true,
        });
        await initialFetch(user_token);
      }
      return data;
    }
    catch (error) {
      console.error("Error posting Firebase project:", error);
      return null;
    }
  };

  const handleConnect = async (config: any) => {
    if(!user_token) return false;
    
    isConnecting.set(true);
    try {
      
      // Validate config contains required fields
      if (!config.projectId || !config.clientEmail || !config.privateKey) {
        throw new Error('Missing required Firebase configuration fields');
      }
      const testResponse = await firebaseApi.fetchApps(
        config.projectId,
        config.clientEmail,
        config.privateKey,
        user_token
      );

      if (testResponse.error) {
        console.error('Connection test failed:', testResponse);
        throw new Error('Failed to connect to Firebase with provided configuration');
      }
      await postFirebaseProject(user_token, config, user?.id);
      
      // Fetch the latest data
      const data = await fetchData();
      if (data) {
        updateFirebaseConnection({
          user: data.user,
          stats: data.stats,
          token: user_token,
          isConnected: true
        });
        
        toast.success('Successfully connected to Firebase');
        setIsProjectsExpanded(true);
      }
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      logStore.logError('Failed to authenticate with Firebase', { error });
      toast.error(error instanceof Error ? error.message : 'Failed to connect to Firebase');
      updateFirebaseConnection({ user: null, token: '' });
      return false;
    } finally {
      isConnecting.set(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user_token) return false;
    
    isConnecting.set(true);
    try {
      
      // Reset the store
      updateFirebaseConnection({ 
        user: null, 
        token: '', 
        stats: undefined, 
        selectedAppId: undefined,
        credentials: undefined,
        isConnected: false
      });
      
      toast.success('Disconnected from Firebase');
      setIsDropdownOpen(false);
      return true;
    } catch (error) {
      console.error('Failed to disconnect from Firebase:', error);
      logStore.logError('Failed to disconnect from Firebase', { error });
      toast.error('Failed to disconnect from Firebase');
      return false;
    } finally {
      isConnecting.set(false);
    }
  };

  const selectApp = async (appId: string) => {
    // Simply update the selectedAppId in the store
    // The store's updateFirebaseConnection function will handle finding
    // the app and updating credentials appropriately
    updateFirebaseConnection({
      selectedAppId: appId
    });
    
    // Find the app to display a toast with its name
    const { app } = findAppById(appId);
    if (app) {
      toast.success(`App "${app.displayName || app.appId}" selected successfully`);
    } else {
      toast.error('Selected app not found');
    }
  };

  const clearAppSelection = () => {
    if (connection.selectedAppId) {
      updateFirebaseConnection({
        selectedAppId: undefined,
        credentials: undefined
      });
      
      toast.info('App selection cleared');
    }
  };

  const handleCreateProject = async () => {
    window.open('https://console.firebase.google.com/u/0/', '_blank');
  };

  const refreshApps = async (projectId: string) => {
    const currentState = firebaseConnection.get();
    
    if (!currentState.stats?.projects) {
      console.error('No projects found');
      return Promise.reject(new Error('No projects found'));
    }
    
    const project = currentState.stats.projects.find(p => p.project_id === projectId);
    
    if (!project || !user_token) {
      console.error('Project not found or no token available');
      return Promise.reject(new Error('Project not found or no token available'));
    }
    
    try {
      const apps = await fetchProjectApps(
        project.project_id,
        project.auth_domain,
        project.api_key,
        user_token
      );
      return apps;
    } catch (error) {
      console.error(`Failed to refresh apps for project ${projectId}:`, error);
      throw error;
    }
  };

  return {
    connection,
    connecting,
    initialFetch,
    fetchData,
    fetchingStats,
    fetchingApps,
    isProjectsExpanded,
    setIsProjectsExpanded,
    isDropdownOpen,
    setIsDropdownOpen,
    handleConnect,
    handleDisconnect,
    selectApp,
    clearAppSelection,
    handleCreateProject,
    refreshApps,
    updateConfig: (config: any) => updateFirebaseConnection({ config }),
    isConnected: !!(connection.user && connection.token),
    findAppById: (appId: string) => findAppById(appId),
    hasSelectedApp: !!connection.selectedAppId,
    getSelectedApp: () => {
      if (!connection.selectedAppId) return null;
      const { app } = findAppById(connection.selectedAppId);
      return app;
    },
    fetchAllApps: async () => {
      if (!user_token || !connection.stats?.projects) return [];
      
      const allApps = [];
      
      for (const project of connection.stats.projects) {
        try {
          const apps = await fetchProjectApps(
            project.project_id,
            project.auth_domain,
            project.api_key,
            user_token
          );
          allApps.push(...apps);
        } catch (error) {
          console.error(`Failed to fetch apps for project ${project.project_id}:`, error);
        }
      }
      
      return allApps;
    }
  };
}