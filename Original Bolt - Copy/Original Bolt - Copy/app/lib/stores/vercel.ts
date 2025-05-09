//@ts-nocheck
import { atom } from 'nanostores';
import type { VercelConnection } from '~/types/vercel';
import { logStore } from './logs';
import { API_BASE_URL } from '~/config';

// Initial state without localStorage
const initialConnection: VercelConnection = {
  user: null,
  token: '',
  stats: undefined,
};

export const vercelConnectionStore = atom<VercelConnection>(initialConnection);
export const isConnecting = atom<boolean>(false);
export const isFetchingStats = atom<boolean>(false);
export const isFetchingDeploys = atom<boolean>(false);

// Function to fetch Vercel connection from database
export async function fetchVercelConnectionFromDB(userToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vercel/vercel-get`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Vercel connection: ${response.statusText}`);
    }

    const connectionData = await response.json();
    const result = connectionData[0] || null;
    console.log("Vercel from Database",result)
    if (result && result.access_token) {
      // Update the store with data from DB
      updateVercelConnection({
        token: result.access_token,
      });
      await fetchVercelUserData(result.access_token);
    }
  } catch (error) {
    console.error('Error fetching Vercel connection from DB:', error);
    logStore.logError('Failed to fetch Vercel connection from database', { error });
  }
}

// Function to fetch user data with token
async function fetchVercelUserData(token: string) {
  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const userData = await response.json();
      updateVercelConnection({
        user: userData.user,
        token: token,
      });
    }

    // Fetch initial stats
    await fetchVercelStats(token);
  } catch (error) {
    console.error('Error fetching Vercel user data:', error);
    logStore.logError('Failed to fetch Vercel user data', { error });
  }
}

// Function to initialize Vercel connection with environment token or user token
export async function initializeVercelConnection(userToken?: string) {
  const currentState = vercelConnectionStore.get();

  // If we already have a connection, don't override it
  if (currentState.user) {
    return;
  }

  // Use user token if provided
  const tokenToUse = userToken;
  if (!tokenToUse) {
    return;
  }

  try {
    isConnecting.set(true);

    // First try to get connection from database
    await fetchVercelConnectionFromDB(userToken);

    // If still no user data after fetching from DB, use the provided token
    const updatedState = vercelConnectionStore.get();
    if (!updatedState.user && tokenToUse) {
      await fetchVercelUserData(tokenToUse);
    }
  } catch (error) {
    console.error('Error initializing Vercel connection:', error);
    logStore.logError('Failed to initialize Vercel connection', { error });
  } finally {
    isConnecting.set(false);
  }
}

export const updateVercelConnection = (updates: Partial<VercelConnection>) => {
  const currentState = vercelConnectionStore.get();
  const newState = { ...currentState, ...updates };
  vercelConnectionStore.set(newState);
};

// Function to save Vercel connection to database
export async function saveVercelConnectionToDB(token: string, vercelToken: string ) {
  try {
    const response = await fetch(`${API_BASE_URL}/vercel/vercel-post`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        access_token: vercelToken,
        refresh_token: vercelToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save Vercel connection: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving Vercel connection to DB:', error);
    logStore.logError('Failed to save Vercel connection to database', { error });
    throw error;
  }
}

export async function deleteVercel(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vercel/vercel-delete`, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to save Vercel connection: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving Vercel connection to DB:', error);
    logStore.logError('Failed to save Vercel connection to database', { error });
    throw error;
  }
}

export async function fetchVercelStats(token: string) {
  try {
    isFetchingStats.set(true);

    const projectsResponse = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }

    const projectsData = await projectsResponse.json();
    const projects = projectsData.projects || [];

    const currentState = vercelConnectionStore.get();
    updateVercelConnection({
      ...currentState,
      stats: {
        projects,
        totalProjects: projects.length,
      },
    });
  } catch (error) {
    console.error('Vercel API Error:', error);
    logStore.logError('Failed to fetch Vercel stats', { error });
  } finally {
    isFetchingStats.set(false);
  }
}

export async function fetchProjectDeployments(projectId: string, token: string) {
  try {
    isFetchingDeploys.set(true);

    const deploymentsResponse = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deploymentsResponse.ok) {
      throw new Error(`Failed to fetch deployments: ${deploymentsResponse.status}`);
    }

    const deploymentsData = await deploymentsResponse.json();
    const deployments = deploymentsData.deployments || [];

    const currentState = vercelConnectionStore.get();
    updateVercelConnection({
      ...currentState,
      stats: {
        ...currentState.stats,
        deployments,
      },
    });
  } catch (error) {
    console.error('Vercel API Error:', error);
    logStore.logError('Failed to fetch Vercel deployments', { error });
  } finally {
    isFetchingDeploys.set(false);
  }
}

export async function refreshAllVercelData(userToken: string): Promise<boolean> {
  try {
    // Show loading states
    isConnecting.set(true);
    isFetchingStats.set(true);
    isFetchingDeploys.set(true);
    
    // First, fetch connection from DB
    const connectionData = await fetchVercelConnectionFromDB(userToken);
    
    // If we successfully got a connection
    if (connectionData && connectionData.access_token) {
      const token = connectionData.access_token;
      
      // Update connection in store
      updateVercelConnection({
        token: token,
      });
      
      // Fetch user data
      const userResponse = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        updateVercelConnection({
          user: userData.user,
        });
      }
      
      // Fetch all projects
      await fetchVercelStats(token);
      
      // Fetch deployments for currently selected project if any
      const currentState = vercelConnectionStore.get();
      if (currentState.selectedProjectId) {
        await fetchProjectDeployments(currentState.selectedProjectId, token);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error refreshing all Vercel data:', error);
    logStore.logError('Failed to refresh all Vercel data', { error });
    return false;
  } finally {
    // Reset loading states
    isConnecting.set(false);
    isFetchingStats.set(false);
    isFetchingDeploys.set(false);
  }
}