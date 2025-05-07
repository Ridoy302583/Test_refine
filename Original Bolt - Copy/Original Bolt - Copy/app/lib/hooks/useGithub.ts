// useGithub.ts
import { useEffect, useState } from 'react';
import { useGitHubStore, type GitHubRepoInfo, type RepositoryStats } from '~/lib/stores/github';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '~/config';
import useUser from '~/types/user';

interface GitHubResponse {
    id: number;
    github_token: string;
    github_username: string;
    user_id: number;
    created_at: string;
    updated_at: string; 
}

export function useGithub() {
    const {
        user,
        token,
        tokenType,
        isGithubConnected,
        isGithubVerifying,
        isLoading,
        stats,
        rateLimits,

        connect,
        disconnect,
        fetchStats,
        fetchRecentRepos,
        verifyRepository,
        pushToRepository,
        updateRateLimits
    } = useGitHubStore();

    const { getStoredToken } = useUser();
    const user_token = getStoredToken();
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [hookInitialized, setHookInitialized] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const initializeStore = async () => {
        if(!user_token) return;
        const data = await fetchToken(user_token) as GitHubResponse;
        if (!data || !data.github_token) {
            disconnect();
            setHookInitialized(true);
            return;
        }
        
        const envTokenType = import.meta.env.VITE_GITHUB_TOKEN_TYPE as 'classic' | 'fine-grained';
        if (data.github_token && !isGithubConnected) {
            await connect(data.github_token, envTokenType);
        } else if (isGithubConnected) {
            await updateRateLimits();
        }
        
        setHookInitialized(true);
    };

    const storeToken = async (token: string, github_token: string, tokenType: string = 'classic') => {
        const getData = await fetchToken(token) as GitHubResponse;
        if (getData && getData.github_token) {
            const response = await fetch(`${API_BASE_URL}/github-users-patch-me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    github_username: tokenType,
                    github_token: github_token,
                })
            });
            if (!response.ok) {
                throw new Error(`Failed to store token: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        else {
            try {
                const response = await fetch(`${API_BASE_URL}/github-users-post`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        github_username: tokenType,
                        github_token: github_token,
                    })
                });
                if (!response.ok) {
                    throw new Error(`Failed to store token: ${response.status}`);
                }
                const data = await response.json();
                return data;
            } catch (error) {
                return null;
            }
        }
    };

    const connectToGithub = async (token: string, tokenType: 'classic' | 'fine-grained' = 'classic') => {
        setConnectionError(null);
        if(!user_token) return;
        try {
            await connect(token, tokenType);
            await storeToken(user_token, token, tokenType);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect to GitHub';
            setConnectionError(errorMessage);
            disconnect();
            return false;
        }
    };

    const getRecentRepos = async (limit = 5): Promise<GitHubRepoInfo[]> => {
        try {
            if (!isGithubConnected) return [];
            return await fetchRecentRepos(limit);
        } catch (error) {
            toast.error('Failed to fetch repositories');
            return [];
        }
    };

    const refreshStats = async (): Promise<void> => {
        try {
            if (!isGithubConnected) return;
            await fetchStats();
        } catch (error) {
            toast.error('Failed to refresh GitHub stats');
        }
    };

    const verifyRepo = async (repoUrl: string): Promise<RepositoryStats | null> => {
        try {
            if (!isGithubConnected) return null;
            return await verifyRepository(repoUrl);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to verify repository';
            toast.error(errorMessage);
            return null;
        }
    };

    const pushToRepo = async (repoName: string, isPrivate = false): Promise<string | null> => {
        try {
            if (!isGithubConnected) return null;
            return await pushToRepository(repoName, isPrivate);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to push to repository';
            toast.error(errorMessage);
            return null;
        }
    };

    const fetchToken = async (token: string) => {
        if (!token) return null;
        try {
            const response = await fetch(`${API_BASE_URL}/github-users-get-me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            return null;
        }
    };
    
    const refreshAllData = async (): Promise<boolean> => {
        if (user_token) {
            try {
                setIsRefreshing(true);
                const data = await fetchToken(user_token) as GitHubResponse;
                if (!data || !data.github_token) {
                    disconnect();
                    setIsRefreshing(false);
                    return false;
                }
                const envTokenType = import.meta.env.VITE_GITHUB_TOKEN_TYPE as 'classic' | 'fine-grained';
                if (!isGithubConnected) {
                    await connect(data.github_token, envTokenType);
                }
                await updateRateLimits();
                await fetchStats();
                await fetchRecentRepos(5);
                setIsRefreshing(false);
                return true;
            } catch (error) {
                setIsRefreshing(false);
                const errorMessage = error instanceof Error ? error.message : 'Failed to refresh GitHub data';
                toast.error(errorMessage);
                return false;
            }
        }
        return false;
    };
    
    useEffect(() => {
        initializeStore();
    }, [user_token]);

    const handleGithubAuth = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const redirectUri = `${window.location.origin}/github/callback`;
        const scope = 'repo,read:user,user:email';
        window.open(
            `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`,
            '_blank'
        );
    };

    return {
        user,
        token,
        tokenType,
        isConnected: isGithubConnected,
        isVerifying: isGithubVerifying,
        isLoading,
        isRefreshing,
        stats,
        rateLimits,
        connectionError,
        hookInitialized,

        connectToGithub,
        fetchToken,
        getRecentRepos,
        refreshStats,
        verifyRepo,
        pushToRepo,
        handleGithubAuth,
        updateRateLimits,
        refreshAllData 
    };
}

export default useGithub;