
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { logStore } from '~/lib/stores/logs';
import {
  supabaseConnection,
  isConnecting,
  isFetchingStats,
  isFetchingApiKeys,
  updateSupabaseConnection,
  fetchProjectApiKeys,
} from '~/lib/stores/supabase';
import { supabaseApi } from '../api/supabase';
import useUser from '~/types/user';
import { API_BASE_URL } from '~/config';

export function useSupabaseConnection() {
  const connection = useStore(supabaseConnection);
  const connecting = useStore(isConnecting);
  const fetchingStats = useStore(isFetchingStats);
  const fetchingApiKeys = useStore(isFetchingApiKeys);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { getStoredToken, user } = useUser();
  const user_token = getStoredToken();

  const fetchData = async (cleanToken: string) => {
    if (user_token) {
      try {
        const response = await fetch('/api/supabase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: cleanToken,
          }),
        });

        const data = (await response.json()) as any;

        if (!response.ok) {
          throw new Error(data.error || 'Failed to connect');
        }
        return data;
      }
      catch (error) {
        throw error;
      }
    }
  }

  const initialFetch = async (userToken: string) => {
    if (userToken) {
      try {
        const savedConnection = await supabaseApi.fetchProjects(userToken);
        if (savedConnection) {
          const data = await fetchData(savedConnection.organization_id);
          if (data) {
            updateSupabaseConnection({
              isConnected: true,
              user: data.user,
              stats: data.stats,
              token: savedConnection.organization_id,
            });
          }
        }
      }
      catch (error) {
        throw error;
      }
    }
  }

  useEffect(() => {
    if (!user_token) return;
    initialFetch(user_token);
  }, [user_token]);


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


  const postAccessToken = async (user_token: string, access_token: string, userId?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/supabase/project`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user_token}`
        },
        body: JSON.stringify({
          urlId: randomGenerate(userId),
          project_ref_id: `ref_${randomGenerate(userId)}`,
          organization_id: access_token,
          ann_api_key: "string",
          service_api_key: "string"
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to post access token: ${response.statusText}`);
      }
      const data = await response.json();
      if (data) {
        updateSupabaseConnection({
          token: access_token,
          isConnected: true,
        });
        await initialFetch(user_token);
      }
      return data;
    }
    catch (error) {
      console.error("Error posting access token:", error);
      return null;
    }
  };

  const handleConnect = async () => {
    if(!user_token) return;
    isConnecting.set(true);
    try {
      const cleanToken = connection.token.trim();
      const data = await fetchData(cleanToken);
      if (data) {
        updateSupabaseConnection({
          user: data.user,
          token: connection.token,
          stats: data.stats,
        });
        await postAccessToken(user_token,cleanToken, user?.id)
        toast.success('Successfully connected to Supabase');
        setIsProjectsExpanded(true);
      }
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      logStore.logError('Failed to authenticate with Supabase', { error });
      toast.error(error instanceof Error ? error.message : 'Failed to connect to Supabase');
      updateSupabaseConnection({ user: null, token: '' });
      return false;
    } finally {
      isConnecting.set(false);
    }
  };

  const handleDisconnect = () => {
    updateSupabaseConnection({ user: null, token: '' });
    toast.success('Disconnected from Supabase');
    setIsDropdownOpen(false);
  };

  const selectProject = async (projectId: string) => {
    const currentState = supabaseConnection.get();
    let projectData = undefined;

    if (projectId && currentState.stats?.projects) {
      projectData = currentState.stats.projects.find((project) => project.id === projectId);
    }

    updateSupabaseConnection({
      selectedProjectId: projectId,
      project: projectData,
    });

    if (projectId && currentState.token) {
      try {
        await fetchProjectApiKeys(projectId, currentState.token);
        toast.success('Project selected successfully');
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
        toast.error('Selected project but failed to fetch API keys');
      }
    } else {
      toast.success('Project selected successfully');
    }

    setIsDropdownOpen(false);
  };

  const handleCreateProject = async () => {
    window.open('https://app.supabase.com/new/new-project', '_blank');
  };

  return {
    connection,
    connecting,
    initialFetch,
    fetchData,
    fetchingStats,
    fetchingApiKeys,
    isProjectsExpanded,
    setIsProjectsExpanded,
    isDropdownOpen,
    setIsDropdownOpen,
    handleConnect,
    handleDisconnect,
    selectProject,
    handleCreateProject,
    updateToken: (token: string) => updateSupabaseConnection({ ...connection, token }),
    isConnected: !!(connection.user && connection.token),
    fetchProjectApiKeys: (projectId: string) => {
      if (connection.token) {
        return fetchProjectApiKeys(projectId, connection.token);
      }

      return Promise.reject(new Error('No token available'));
    },
  };
}