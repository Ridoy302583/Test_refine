
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Select } from '~/components/ui/Select';
import { GradientIconBox } from '~/components/ui/GradientIconBox';
import useGithub from '~/lib/hooks/useGithub';
import { API_BASE_URL } from '~/config';
import useUser from '~/types/user';
import { useGitHubStore } from '~/lib/stores/github';

interface GithubConnectionProps {
  statsShow?: boolean;
  handleClose?: () => void;
  setIsGithubOpen?: (value: boolean) => void;
}

export default function GitHubConnection({ statsShow, handleClose, setIsGithubOpen }: GithubConnectionProps) {
  // Use the hook instead of direct store access
  const {
    user,
    isConnected,
    isVerifying,
    stats,
    fetchToken,
    getRecentRepos,
    refreshStats,
    refreshAllData
  } = useGithub();
  const { disconnect } = useGitHubStore();
  const { getStoredToken } = useUser();
  const user_token = getStoredToken();
  const [inputToken, setInputToken] = useState('');
  const [inputTokenType, setInputTokenType] = useState<'classic' | 'fine-grained'>('classic');
  const [recentRepos, setRecentRepos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadRecentRepos();
    }
  }, [isConnected]);

  // Function to load recent repos
  const loadRecentRepos = async () => {
    const repos = await getRecentRepos(5);
    setRecentRepos(repos);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!inputToken.trim()) {
      toast.error('GitHub token is required');
      return;
    }

    try {
      if (!user_token) {
        throw new Error('User token is null or undefined');
      }
      const getData = await fetchToken(user_token);
      if (getData) {
        const response = await fetch(`${API_BASE_URL}/github-users-patch-me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user_token}`
          },
          body: JSON.stringify({
            github_username: inputTokenType,
            github_token: inputToken,
          })
        });
        if (!response.ok) {
          throw new Error(`Failed to store token: ${response.status}`);
        }
        const data = await response.json();
        toast.success('GitHub connection updated successfully');
        if (handleClose) {
          handleClose();
          setIsLoading(false);
          setIsGithubOpen(false);
        }
        return data;
      } else {
        try {
          const response = await fetch(`${API_BASE_URL}/github-users-post`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user_token}`
            },
            body: JSON.stringify({
              github_username: inputTokenType,
              github_token: inputToken,
            })
          });
          if (!response.ok) {
            throw new Error(`Failed to store token: ${response.status}`);
          }
          const data = await response.json();
          toast.success('GitHub connected successfully');
          if (handleClose) {
            handleClose();
            setIsLoading(false);
            setIsGithubOpen(false)
          }
          return data;
        } catch (error) {
          toast.error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
          return null;
        }
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      toast.error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const deleteToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/github-users-delete-me`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to delete token: ${response.status}`);
      }
      fetchToken(token);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleDisconnect = async () => {
    if (!user_token) return;
    setIsLoading(true);
    disconnect();
    const result = await deleteToken(user_token);
    if (result) {
      setTimeout(() => {
        refreshAllData();
      }, 100);
      setIsLoading(false);
    }
  };

  // Handle refresh stats button click
  const handleRefreshStats = async () => {
    await refreshStats();
  };

  return (
    <motion.div
      className="bg-websparks-elements-background dark:bg-websparks-elements-background border border-websparks-elements-borderColor dark:border-websparks-elements-borderColor rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GradientIconBox iconClassName="i-codicon:github-inverted text-white text-xl" />
            <div>
              <h3 className="text-lg font-medium text-websparks-elements-textPrimary">Github Connection</h3>
              <p className="text-sm text-websparks-elements-textSecondary">Configure your GitHub connection</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {!user ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-websparks-elements-textSecondary dark:text-websparks-elements-textSecondary mb-2">
                    Token Type
                  </label>
                  <Select
                    value={inputTokenType}
                    onChange={(e) => setInputTokenType(e.target.value as 'classic' | 'fine-grained')}
                    disabled={isVerifying}
                    className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                      'border-red-500': false,
                    })}
                  >
                    <option value="classic">Personal Access Token (Classic)</option>
                    <option value="fine-grained">Fine-grained Token</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-websparks-elements-textSecondary dark:text-websparks-elements-textSecondary mb-2">
                    {inputTokenType === 'classic' ? 'Personal Access Token' : 'Fine-grained Token'}
                  </label>
                  <Input
                    type="password"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    disabled={isVerifying}
                    placeholder={`Enter your GitHub ${inputTokenType === 'classic' ? 'personal access token' : 'fine-grained token'}`}
                    className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                      'border-red-500': false,
                    })}
                  />
                </div>
              </div>
              <div className="flex gap-2 w-full mt-2 text-sm text-websparks-elements-textSecondary">
                <a
                  href={`https://github.com/settings/tokens${inputTokenType === 'fine-grained' ? '/beta' : '/new'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-1"
                >
                  <div className="i-ph:key w-4 h-4" />
                  Get your token
                  <div className="i-ph:arrow-square-out w-3 h-3" />
                </a>
                <span>
                  Required scopes:{' '}
                  {inputTokenType === 'classic'
                    ? 'repo, read:org, read:user'
                    : 'Repository access, Organization access'}
                </span>
              </div>
              <div>
                <Button
                  onClick={handleConnect}
                  disabled={isLoading || !inputToken.trim()}
                  variant="default"
                  className={`relative flex justify-center items-center p-3.5 rounded-md text-white font-medium text-base transition-all duration-300 
                ${isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 cursor-pointer'}
                overflow-hidden group shadow-lg shadow-blue-900/20`}
                >
                  {isLoading ? (
                    <>
                      <div className="i-ph:spinner-gap animate-spin w-4 h-4" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <div className="i-ph:github-logo w-4 h-4" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className='w-full'>
              {user && stats && (
                <div className="border-t border-websparks-elements-borderColor dark:border-websparks-elements-borderColor pt-6">
                  <div className="flex items-center gap-4 p-4 bg-transparent border border-alpha-white-10 rounded-lg mb-4">
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="w-12 h-12 rounded-full border-2 border-websparks-elements-item-contentAccent dark:border-websparks-elements-item-contentAccent"
                    />
                    <div>
                      <h4 className="text-sm font-medium text-websparks-elements-textPrimary dark:text-websparks-elements-textPrimary">
                        {user.name || user.login}
                      </h4>
                      <p className="text-sm text-websparks-elements-textSecondary dark:text-websparks-elements-textSecondary">
                        @{user.login}
                      </p>
                    </div>
                  </div>
                  {statsShow && (
                    <>
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-websparks-elements-textPrimary mb-3">Top Languages</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(stats.languages)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([language]) => (
                              <span
                                key={language}
                                className="px-3 py-1 text-xs rounded-full bg-websparks-elements-sidebar-buttonBackgroundDefault text-websparks-elements-sidebar-buttonText"
                              >
                                {language}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                          {
                            label: 'Member Since',
                            value: new Date(user.created_at).toLocaleDateString(),
                          },
                          {
                            label: 'Public Repos',
                            value: stats.publicRepos,
                          },
                          {
                            label: 'Private Repos',
                            value: stats.privateRepos,
                          },
                          {
                            label: 'Languages',
                            value: Object.keys(stats.languages).length,
                          },
                        ].map((stat, index) => (
                          <div
                            key={index}
                            className="flex flex-col p-3 rounded-lg bg-websparks-elements-background-depth-2 dark:bg-websparks-elements-background-depth-2 border border-websparks-elements-borderColor dark:border-websparks-elements-borderColor"
                          >
                            <span className="text-xs text-websparks-elements-textSecondary">{stat.label}</span>
                            <span className="text-lg font-medium text-websparks-elements-textPrimary">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => window.open('https://github.com/dashboard', '_blank', 'noopener,noreferrer')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <div className="i-hugeicons:dashboard-square-02 w-4 h-4" />
                    Dashboard
                  </Button>
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <div className="i-ph:sign-out w-4 h-4" />
                    Disconnect
                  </Button>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="i-ph:check-circle w-4 h-4 text-websparks-elements-icon-success dark:text-websparks-elements-icon-success" />
                      <span className="text-sm text-websparks-elements-textPrimary dark:text-websparks-elements-textPrimary">
                        Connected to GitHub
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}