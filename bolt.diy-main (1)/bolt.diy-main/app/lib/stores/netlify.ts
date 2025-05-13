//@ts-nocheck
import { atom } from 'nanostores';
import type { NetlifyConnection } from '~/types/netlify';
import { logStore } from './logs';
import { API_BASE_URL } from '~/config';

// Initial state without localStorage
const initialConnection: NetlifyConnection = {
  user: null,
  token: '',
  stats: undefined,
};

export const netlifyConnectionStore = atom<NetlifyConnection>(initialConnection);
export const isConnecting = atom<boolean>(false);
export const isFetchingStats = atom<boolean>(false);
export const isFetchingDeploys = atom<boolean>(false);

// Function to fetch Netlify connection from database
export async function fetchNetlifyConnectionFromDB(userToken: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/netlify/netlify-get`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Netlify connection: ${response.statusText}`);
    }

    const connectionData = await response.json();
    console.log(connectionData);
    const result = connectionData[0] || null;
    if (result && result.access_token) {
      updateNetlifyConnection({
        token: result.access_token,
      });
      await fetchNetlifyUserData(result.access_token);
    }
    
    // Return the result
    return result;
  } catch (error) {
    console.error('Error fetching Netlify connection from DB:', error);
    logStore.logError('Failed to fetch Netlify connection from database', { error });
    return null; // Return null in case of error
  }
}

// Function to fetch user data with token
async function fetchNetlifyUserData(token: string) {
  try {
    const response = await fetch('https://api.netlify.com/api/v1/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const userData = await response.json();
      updateNetlifyConnection({
        user: userData,
        token: token,
      });
    }

    // Fetch initial stats
    await fetchNetlifyStats(token);
  } catch (error) {
    console.error('Error fetching Netlify user data:', error);
    logStore.logError('Failed to fetch Netlify user data', { error });
  }
}

// Function to initialize Netlify connection with environment token or user token
export async function initializeNetlifyConnection(userToken?: string) {
  const currentState = netlifyConnectionStore.get();

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
    await fetchNetlifyConnectionFromDB(userToken);

    // If still no user data after fetching from DB, use the provided token
    const updatedState = netlifyConnectionStore.get();
    if (!updatedState.user && tokenToUse) {
      await fetchNetlifyUserData(tokenToUse);
    }
  } catch (error) {
    console.error('Error initializing Netlify connection:', error);
    logStore.logError('Failed to initialize Netlify connection', { error });
  } finally {
    isConnecting.set(false);
  }
}

export async function refreshAllNetlifyData(userToken: string): Promise<boolean> {
  try {
    // Show loading states
    isConnecting.set(true);
    isFetchingStats.set(true);
    isFetchingDeploys.set(true);
    
    // First, fetch connection from DB
    const connectionData = await fetch(`${API_BASE_URL}/netlify/netlify-get`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!connectionData.ok) {
      throw new Error(`Failed to fetch Netlify connection: ${connectionData.statusText}`);
    }

    const connectionResult = await connectionData.json();
    const netlifyConnection = connectionResult[0] || null;
    
    // If we successfully got a connection
    if (netlifyConnection && netlifyConnection.access_token) {
      const token = netlifyConnection.access_token;
      
      // Update connection in store
      updateNetlifyConnection({
        token: token,
      });
      
      // Fetch user data
      const userResponse = await fetch('https://api.netlify.com/api/v1/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        updateNetlifyConnection({
          user: userData,
        });
      }
      
      // Fetch all sites
      await fetchNetlifyStats(token);
      
      // Fetch deploys for currently selected site if any
      const currentState = netlifyConnectionStore.get();
      if (currentState.selectedSiteId) {
        await fetchSiteDeploys(currentState.selectedSiteId, token);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error refreshing all Netlify data:', error);
    logStore.logError('Failed to refresh all Netlify data', { error });
    return false;
  } finally {
    // Reset loading states
    isConnecting.set(false);
    isFetchingStats.set(false);
    isFetchingDeploys.set(false);
  }
}

export const updateNetlifyConnection = (updates: Partial<NetlifyConnection>) => {
  const currentState = netlifyConnectionStore.get();
  const newState = { ...currentState, ...updates };
  netlifyConnectionStore.set(newState);
};

// Function to save Netlify connection to database
export async function saveNetlifyConnectionToDB(token: string, netlifyToken: string = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/netlify/netlify-post`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        access_token: netlifyToken,
        refresh_token: netlifyToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save Netlify connection: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving Netlify connection to DB:', error);
    logStore.logError('Failed to save Netlify connection to database', { error });
    throw error;
  }
}

export async function removeNetlifyConnectionToDB(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/netlify/netlify-delete`, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to save Netlify connection: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving Netlify connection to DB:', error);
    logStore.logError('Failed to save Netlify connection to database', { error });
    throw error;
  }
}

export async function fetchNetlifyStats(token: string) {
  try {
    isFetchingStats.set(true);

    const sitesResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!sitesResponse.ok) {
      throw new Error(`Failed to fetch sites: ${sitesResponse.status}`);
    }

    const sites = (await sitesResponse.json()) as any;

    const currentState = netlifyConnectionStore.get();
    updateNetlifyConnection({
      ...currentState,
      stats: {
        sites,
        totalSites: sites.length,
      },
    });
  } catch (error) {
    console.error('Netlify API Error:', error);
    logStore.logError('Failed to fetch Netlify stats', { error });
  } finally {
    isFetchingStats.set(false);
  }
}

export async function fetchSiteDeploys(siteId: string, token: string) {
  try {
    isFetchingDeploys.set(true);

    const deploysResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deploysResponse.ok) {
      throw new Error(`Failed to fetch deploys: ${deploysResponse.status}`);
    }

    const deploys = (await deploysResponse.json()) as any;

    const currentState = netlifyConnectionStore.get();
    updateNetlifyConnection({
      ...currentState,
      stats: {
        ...currentState.stats,
        deploys,
      },
    });
  } catch (error) {
    console.error('Netlify API Error:', error);
    logStore.logError('Failed to fetch Netlify deploys', { error });
  } finally {
    isFetchingDeploys.set(false);
  }
}