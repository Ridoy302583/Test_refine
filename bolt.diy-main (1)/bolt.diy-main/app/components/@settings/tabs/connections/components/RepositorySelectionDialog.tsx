
import type { GitHubRepoInfo, GitHubContent, RepositoryStats, GitHubUserResponse } from '~/types/GitHub';
import { useState, useEffect, useRef, memo } from 'react';
import { toast } from 'react-toastify';
import * as Dialog from '@radix-ui/react-dialog';
import Logo from '../../../../../icons/roundedlogo.svg';
import Github from '../../../../../icons/github.svg';
import PartneringIcon from '../../../../../icons/partnericon.svg';
import { classNames } from '~/utils/classNames';
import { getLocalStorage } from '~/lib/persistence';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { formatSize } from '~/utils/formatSize';
import { Input } from '~/components/ui/Input';
import Cookies from 'js-cookie';
import useGithub from '~/lib/hooks/useGithub';
import useUser from '~/types/user';
import getFileIconConfig from '~/utils/fileicons';
import formatDateTime from '~/utils/formatDate';
import { Button } from '~/components/ui/Button';
import { cubicEasingFn } from '~/utils/easings';
import { Select } from '~/components/ui/Select';

interface GitHubTreeResponse {
  tree: Array<{
    path: string;
    type: string;
    size?: number;
  }>;
}

interface RepositorySelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  openGithubConnectionDialog?: boolean;
  setOpenGithubConnectionDialog: (value: boolean) => void;
}

interface SearchFilters {
  language?: string;
  stars?: number;
  forks?: number;
}

interface StatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stats: RepositoryStats;
  isLargeRepo?: boolean;
}

function StatsDialog({ isOpen, onClose, onConfirm, stats, isLargeRepo }: StatsDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]" />
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="w-[90vw] md:w-[540px] my-8"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <Dialog.Content className="relative overflow-hidden  backdrop-blur-xl rounded-3xl border border-purple-500/20 text-white shadow-2xl">

              <div className="p-8 space-y-6 relative z-10">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl border border-purple-500/30 mb-4">
                    <span className="i-ph:database text-purple-400 w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                    Repository Overview
                  </h3>
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto mt-2 rounded-full"></div>
                </div>

                <div className="mt-6 space-y-5">
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10 transform transition-transform duration-200 hover:scale-[1.02] hover:border-purple-500/30">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
                        <span className="i-ph:files text-blue-400 w-5 h-5" />
                      </div>
                      <div className="flex-grow">
                        <div className="text-xs text-gray-400 mb-1">Total Files</div>
                        <div className="text-base font-semibold text-white">{stats.totalFiles}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10 transform transition-transform duration-200 hover:scale-[1.02] hover:border-purple-500/30">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                        <span className="i-ph:database text-purple-400 w-5 h-5" />
                      </div>
                      <div className="flex-grow">
                        <div className="text-xs text-gray-400 mb-1">Total Size</div>
                        <div className="text-base font-semibold text-white">{formatSize(stats.totalSize)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10 transform transition-transform duration-200 hover:scale-[1.02] hover:border-purple-500/30">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center mr-3">
                        <span className="i-ph:code text-pink-400 w-5 h-5" />
                      </div>
                      <div className="flex-grow">
                        <div className="text-xs text-gray-400 mb-1">Top Languages</div>
                        <div className="text-base font-semibold text-white">
                          {Object.entries(stats.languages)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([lang, size], index) => (
                              <span key={lang} className={index !== 0 ? "ml-2" : ""}>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">{lang}</span>
                                <span className="text-gray-400 text-xs ml-1">({formatSize(size)})</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                    
                    {(stats.hasPackageJson || stats.hasDependencies) && (
                      <div className="flex flex-wrap gap-3">
                        {stats.hasPackageJson && (
                          <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-white/5 border border-white/10 transform transition-transform duration-200 hover:scale-[1.02] hover:border-purple-500/30">
                            <span className="i-ph:package text-blue-400 w-4 h-4" />
                            <span className="text-white">Has package.json</span>
                          </div>
                        )}
                        
                        {stats.hasDependencies && (
                          <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-white/5 border border-white/10 transform transition-transform duration-200 hover:scale-[1.02] hover:border-purple-500/30">
                            <span className="i-ph:tree-structure text-purple-400 w-4 h-4" />
                            <span className="text-white">Has dependencies</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isLargeRepo && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 text-sm flex items-start gap-3 transform transition-all duration-200 hover:border-yellow-500/50">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <span className="i-ph:warning text-yellow-500 w-4 h-4" />
                      </div>
                      <div className="text-yellow-300 flex-1">
                        <div className="font-semibold text-yellow-200 mb-1">Large Repository Detected</div>
                        This repository is quite large ({formatSize(stats.totalSize)}). Importing it might take a while
                        and could impact performance.
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 flex justify-between items-center gap-4 border-t border-white/10 bg-black/30 backdrop-blur-md relative z-10">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-2">
                    <span className="i-ph:sparkle text-white w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-400">
                    Powered by <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Websparks</span>
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-red-400/30 text-red-400 hover:bg-red-400/10 hover:border-red-400 transition-all duration-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onConfirm}
                    className="relative overflow-hidden px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-900/20 group"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="absolute inset-0 w-0 bg-white/20 skew-x-12 group-hover:w-full transition-all duration-700 ease-in-out"></span>
                    <span className="relative flex items-center justify-center">
                      Import Repository
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </Button>
                </div>
              </div>
              
              {/* Close button with fancy hover effect */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 bg-black/20 hover:bg-white/10 p-1.5 rounded-full backdrop-blur-md z-20"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Content>
          </motion.div>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GitHubAuthDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenType, setTokenType] = useState<'classic' | 'fine-grained'>('classic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = (await response.json()) as GitHubUserResponse;

        // Save connection data
        const connectionData = {
          token,
          tokenType,
          user: {
            login: userData.login,
            avatar_url: userData.avatar_url,
            name: userData.name || userData.login,
          },
          connected_at: new Date().toISOString(),
        };

        localStorage.setItem('github_connection', JSON.stringify(connectionData));

        // Set cookies for API requests
        Cookies.set('githubToken', token);
        Cookies.set('githubUsername', userData.login);
        Cookies.set('git:github.com', JSON.stringify({ username: token, password: 'x-oauth-basic' }));

        toast.success(`Successfully connected as ${userData.login}`);
        onClose();
      } else {
        if (response.status === 401) {
          toast.error('Invalid GitHub token. Please check and try again.');
        } else {
          toast.error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
      toast.error('Failed to connect to GitHub. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" />
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Dialog.Content className="bg-[#1A1A1A] rounded-lg shadow-xl max-w-sm w-full mx-4 overflow-hidden">
              <div className="p-4 space-y-3">
                <h2 className="text-lg font-semibold text-white">Access Private Repositories</h2>

                <p className="text-sm text-[#999999]">
                  To access private repositories, you need to connect your GitHub account by providing a personal access
                  token.
                </p>

                <div className="bg-[#252525] p-4 rounded-lg space-y-3">
                  <h3 className="text-base font-medium text-white">Connect with GitHub Token</h3>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm text-[#999999] mb-1">
                        GitHub Personal Access Token
                      </label>
                      <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-3 py-1.5 rounded-lg border border-[#333333] bg-[#1A1A1A] text-white placeholder-[#999999] text-sm"
                      />
                      <div className="mt-1 text-xs text-[#999999]">
                        Get your token at{' '}
                        <a
                          href="https://github.com/settings/tokens"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-500 hover:underline"
                        >
                          github.com/settings/tokens
                        </a>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm text-[#999999]">Token Type</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={tokenType === 'classic'}
                            onChange={() => setTokenType('classic')}
                            className="w-3.5 h-3.5 accent-purple-500"
                          />
                          <span className="text-sm text-white">Classic</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={tokenType === 'fine-grained'}
                            onChange={() => setTokenType('fine-grained')}
                            className="w-3.5 h-3.5 accent-purple-500"
                          />
                          <span className="text-sm text-white">Fine-grained</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? 'Connecting...' : 'Connect to GitHub'}
                    </button>
                  </form>
                </div>

                <div className="bg-amber-900/20 p-3 rounded-lg space-y-1.5">
                  <h3 className="text-sm text-amber-300 font-medium flex items-center gap-1.5">
                    <span className="i-ph:warning-circle w-4 h-4" />
                    Accessing Private Repositories
                  </h3>
                  <p className="text-xs text-amber-400">
                    Important things to know about accessing private repositories:
                  </p>
                  <ul className="list-disc pl-4 text-xs text-amber-400 space-y-0.5">
                    <li>You must be granted access to the repository by its owner</li>
                    <li>Your GitHub token must have the 'repo' scope</li>
                    <li>For organization repositories, you may need additional permissions</li>
                    <li>No token can give you access to repositories you don't have permission for</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-[#333333] p-3 flex justify-end">
                <Dialog.Close asChild>
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 bg-[#252525] hover:bg-[#333333] rounded-lg text-white transition-colors text-sm"
                  >
                    Close
                  </button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </motion.div>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Update the overlay and dialog container styles to enable scrolling
export function RepositorySelectionDialog({ isOpen, onClose, setOpenGithubConnectionDialog, onSelect }: RepositorySelectionDialogProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedRepository, setSelectedRepository] = useState<GitHubRepoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepoInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GitHubRepoInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'my-repos' | 'search' | 'url'>('my-repos');
  const [customUrl, setCustomUrl] = useState('');
  const [branches, setBranches] = useState<{ name: string; default?: boolean }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [currentStats, setCurrentStats] = useState<RepositoryStats | null>(null);
  const [pendingGitUrl, setPendingGitUrl] = useState<string>('');
  const [githubToken, setGihubToken] = useState<string>('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { getStoredToken } = useUser();
  const user_token = getStoredToken();
  const { fetchToken } = useGithub();

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if the click is directly on the overlay (not its children)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Initialize GitHub connection and fetch repositories
  useEffect(() => {
    const initialDataFetch = async () => {
      if (user_token) {
        const savedConnection = await fetchToken(user_token);
        if (savedConnection?.github_token) {
          setGihubToken(savedConnection?.github_token)
        }
        // If no connection exists but environment variables are set, create a connection
        if (savedConnection) {
          const tokenType = 'classic';

          // Fetch GitHub user info to initialize the connection
          fetch('https://api.github.com/user', {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `Bearer ${githubToken}`,
            },
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error('Invalid token or unauthorized');
              }

              return response.json();
            })
            .then((data: unknown) => {
              const userData = data as GitHubUserResponse;

              // Save connection to local storage
              const newConnection = {
                githubToken,
                tokenType,
                user: {
                  login: userData.login,
                  avatar_url: userData.avatar_url,
                  name: userData.name || userData.login,
                },
                connected_at: new Date().toISOString(),
              };

              Cookies.set('git:github.com', JSON.stringify({ username: githubToken, password: 'x-oauth-basic' }));

              // Refresh repositories after connection is established
              if (isOpen && activeTab === 'my-repos') {
                fetchUserRepos(user_token, githubToken);
              }
            })
            .catch((error) => {
              console.error('Failed to initialize GitHub connection from environment variables:', error);
            });
        } else {
          setGihubToken('');
          setRepositories([]);
          setSelectedRepository(null);
          setBranches([]);
          setSelectedBranch('');
          setCurrentStats(null);
          setPendingGitUrl('');
        }
      }
    }
    initialDataFetch();
  }, [isOpen, user_token]);

  useEffect(() => {
    if (isOpen && activeTab === 'my-repos' && user_token) {
      fetchUserRepos(user_token, githubToken);
    }
  }, [isOpen, activeTab, user_token, githubToken]);

  const handleAuthDialogClose = () => {
    setShowAuthDialog(false);
    // If we're on the my-repos tab, refresh the repository list
    if (activeTab === 'my-repos') {
      if (user_token) {
        fetchUserRepos(user_token, githubToken);
      }
    }
  };

  const fetchUserRepos = async (userToken: string, githubToken: string) => {
    if (!githubToken) {
      setOpenGithubConnectionDialog(true);
      onClose();
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=all', {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${githubToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const data = await response.json();

      // Add type assertion and validation
      if (
        Array.isArray(data) &&
        data.every((item) => typeof item === 'object' && item !== null && 'full_name' in item)
      ) {
        setRepositories(data as GitHubRepoInfo[]);
      } else {
        throw new Error('Invalid repository data format');
      }
    } catch (error) {
      console.error('Error fetching repos:', error);
      toast.error('Failed to fetch your repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setSearchResults([]);

    try {
      let searchQuery = query;

      if (filters.language) {
        searchQuery += ` language:${filters.language}`;
      }

      if (filters.stars) {
        searchQuery += ` stars:>${filters.stars}`;
      }

      if (filters.forks) {
        searchQuery += ` forks:>${filters.forks}`;
      }

      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to search repositories');
      }

      const data = await response.json();

      // Add type assertion and validation
      if (typeof data === 'object' && data !== null && 'items' in data && Array.isArray(data.items)) {
        setSearchResults(data.items as GitHubRepoInfo[]);
      } else {
        throw new Error('Invalid search results format');
      }
    } catch (error) {
      console.error('Error searching repos:', error);
      toast.error('Failed to search repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async (repo: GitHubRepoInfo, userToken: string, githubToken: string) => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = githubToken
        ? {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${githubToken}`,
        }
        : {};
      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/branches`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const data = await response.json();

      // Add type assertion and validation
      if (Array.isArray(data) && data.every((item) => typeof item === 'object' && item !== null && 'name' in item)) {
        setBranches(
          data.map((branch) => ({
            name: branch.name,
            default: branch.name === repo.default_branch,
          })),
        );
      } else {
        throw new Error('Invalid branch data format');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to fetch branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoSelect = async (repo: GitHubRepoInfo) => {
    setSelectedRepository(repo);
    if (user_token) {
      await fetchBranches(repo, user_token, githubToken);
    }
  };

  const formatGitUrl = (url: string): string => {
    // Remove any tree references and ensure .git extension
    const baseUrl = url
      .replace(/\/tree\/[^/]+/, '') // Remove /tree/branch-name
      .replace(/\/$/, '') // Remove trailing slash
      .replace(/\.git$/, ''); // Remove .git if present
    return `${baseUrl}.git`;
  };

  const verifyRepository = async (repoUrl: string, githubToken: string): Promise<RepositoryStats | null> => {
    try {
      // Extract branch from URL if present (format: url#branch)
      let branch: string | null = null;
      let cleanUrl = repoUrl;

      if (repoUrl.includes('#')) {
        const parts = repoUrl.split('#');
        cleanUrl = parts[0];
        branch = parts[1];
      }

      const [owner, repo] = cleanUrl
        .replace(/\.git$/, '')
        .split('/')
        .slice(-2);

      // Try to get token from local storage first

      // If no connection in local storage, check environment variables
      let headers: HeadersInit = {};

      if (githubToken) {
        headers = {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${githubToken}`,
        };
      } else if (import.meta.env.VITE_GITHUB_ACCESS_TOKEN) {
        // Use token from environment variables
        headers = {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${import.meta.env.VITE_GITHUB_ACCESS_TOKEN}`,
        };
      }

      // First, get the repository info to determine the default branch
      const repoInfoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
      });

      if (!repoInfoResponse.ok) {
        if (repoInfoResponse.status === 401 || repoInfoResponse.status === 403) {
          throw new Error(
            `Authentication failed (${repoInfoResponse.status}). Your GitHub token may be invalid or missing the required permissions.`,
          );
        } else if (repoInfoResponse.status === 404) {
          throw new Error(
            `Repository not found or is private (${repoInfoResponse.status}). To access private repositories, you need to connect your GitHub account or provide a valid token with appropriate permissions.`,
          );
        } else {
          throw new Error(
            `Failed to fetch repository information: ${repoInfoResponse.statusText} (${repoInfoResponse.status})`,
          );
        }
      }

      const repoInfo = (await repoInfoResponse.json()) as { default_branch: string };
      let defaultBranch = repoInfo.default_branch || 'main';

      // If a branch was specified in the URL, use that instead of the default
      if (branch) {
        defaultBranch = branch;
      }

      // Try to fetch the repository tree using the selected branch
      let treeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
        {
          headers,
        },
      );

      // If the selected branch doesn't work, try common branch names
      if (!treeResponse.ok) {
        // Try 'master' branch if default branch failed
        treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
          headers,
        });

        // If master also fails, try 'main' branch
        if (!treeResponse.ok) {
          treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
            headers,
          });
        }

        // If all common branches fail, throw an error
        if (!treeResponse.ok) {
          throw new Error(
            'Failed to fetch repository structure. Please check the repository URL and your access permissions.',
          );
        }
      }

      const treeData = (await treeResponse.json()) as GitHubTreeResponse;

      // Calculate repository stats
      let totalSize = 0;
      let totalFiles = 0;
      const languages: { [key: string]: number } = {};
      let hasPackageJson = false;
      let hasDependencies = false;

      for (const file of treeData.tree) {
        if (file.type === 'blob') {
          totalFiles++;

          if (file.size) {
            totalSize += file.size;
          }

          // Check for package.json
          if (file.path === 'package.json') {
            hasPackageJson = true;

            // Fetch package.json content to check dependencies
            const contentResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, {
              headers,
            });

            if (contentResponse.ok) {
              const content = (await contentResponse.json()) as GitHubContent;
              const packageJson = JSON.parse(Buffer.from(content.content, 'base64').toString());
              hasDependencies = !!(
                packageJson.dependencies ||
                packageJson.devDependencies ||
                packageJson.peerDependencies
              );
            }
          }

          // Detect language based on file extension
          const ext = file.path.split('.').pop()?.toLowerCase();

          if (ext) {
            languages[ext] = (languages[ext] || 0) + (file.size || 0);
          }
        }
      }

      const stats: RepositoryStats = {
        totalFiles,
        totalSize,
        languages,
        hasPackageJson,
        hasDependencies,
      };

      return stats;
    } catch (error) {
      console.error('Error verifying repository:', error);

      // Check if it's an authentication error and show the auth dialog
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify repository';

      if (
        errorMessage.includes('Authentication failed') ||
        errorMessage.includes('may be private') ||
        errorMessage.includes('Repository not found or is private') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('404') ||
        errorMessage.includes('access permissions')
      ) {
        setShowAuthDialog(true);
      }

      toast.error(errorMessage);

      return null;
    }
  };

  const handleImport = async () => {
    setIsImportLoading(true);
    try {
      let gitUrl: string;
      if (!user_token) {
        return;
      }
      if (activeTab === 'url' && customUrl) {
        gitUrl = formatGitUrl(customUrl);
      } else if (selectedRepository) {
        gitUrl = formatGitUrl(selectedRepository.html_url);

        if (selectedBranch) {
          gitUrl = `${gitUrl}#${selectedBranch}`;
        }
      } else {
        return;
      }

      // Verify repository before importing
      const stats = await verifyRepository(gitUrl, githubToken);
      if (!stats) {
        return;
      }
      setCurrentStats(stats);
      setPendingGitUrl(gitUrl);
      setShowStatsDialog(true);
    } catch (error) {
      console.error('Error preparing repository:', error);

      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : 'Failed to prepare repository. Please try again.';

      // Show the GitHub auth dialog for any authentication or permission errors
      if (
        errorMessage.includes('Authentication failed') ||
        errorMessage.includes('may be private') ||
        errorMessage.includes('Repository not found or is private') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('404') ||
        errorMessage.includes('access permissions')
      ) {
        // Directly show the auth dialog instead of just showing a toast
        setShowAuthDialog(true);

        toast.error(
          <div className="space-y-2">
            <p>{errorMessage}</p>
            <button onClick={() => setShowAuthDialog(true)} className="underline font-medium block text-purple-500">
              Learn how to access private repositories
            </button>
          </div>,
          { autoClose: 10000 }, // Keep the toast visible longer
        );
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleStatsConfirm = () => {
    setShowStatsDialog(false);
    setIsImportLoading(false);

    if (pendingGitUrl) {
      onSelect(pendingGitUrl);
      onClose();
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    let parsedValue: string | number | undefined = value;

    if (key === 'stars' || key === 'forks') {
      parsedValue = value ? parseInt(value, 10) : undefined;
    }

    setFilters((prev) => ({ ...prev, [key]: parsedValue }));
    handleSearch(searchQuery);
  };

  // Handle dialog close properly
  const handleClose = () => {
    setIsLoading(false);
    setGihubToken('');
    setRepositories([]);
    setSelectedRepository(null);
    setBranches([]);
    setSelectedBranch('');
    setCurrentStats(null);
    setPendingGitUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Updated overlay with overflow-y-auto to allow scrolling */}
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-md overflow-y-auto"
        style={{
          animation: 'fadeIn 0.3s ease-out forwards'
        }}
        onClick={handleOverlayClick}
      >
        {/* Updated container with max-height and overflow settings */}
        <div
          ref={menuRef}
          className="relative w-full max-w-5xl p-6 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-lg rounded-2xl border border-purple-500/20 text-white shadow-2xl z-[1001] my-8"
          style={{
            animation: 'scaleIn 0.3s ease-out forwards',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          <div
            className="mb-6"
            style={{
              animation: 'fadeInUp 0.3s ease-out 0.2s forwards',
              animationFillMode: 'backwards'
            }}
          >
            <div className="flex justify-center items-center w-full mb-2 relative">
              <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
              <img
                src={PartneringIcon}
                alt="Partnership Connection"
                className="h-6 w-auto mx-2 relative z-10"
              />
              <img src={Github} alt="GitHub" className="h-12 w-auto relative z-10" />
            </div>
            <h2 className="text-lg font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
              Import from Github
            </h2>
            <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
              Clone a Repository
            </p>
          </div>

          <div>
            <div className="p-4">
              <div className='flex justify-center'>
                <div className="flex items-center flex-wrap shrink-0 gap-1 border border-alpha-white-10 bg-transparent overflow-hidden rounded-full p-1 mb-2">
                  <TabButton active={activeTab === 'my-repos'} onClick={() => setActiveTab('my-repos')}>
                    <span className="i-ph:book-bookmark" />
                    My Repos
                  </TabButton>
                  <TabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
                    <span className="i-ph:magnifying-glass" />
                    Search
                  </TabButton>
                  <TabButton active={activeTab === 'url'} onClick={() => setActiveTab('url')}>
                    <span className="i-ph:link" />
                    URL
                  </TabButton>
                </div>
              </div>
              <div>
                {activeTab === 'url' ? (
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Enter GitHub repository URL"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full"
                    />

                    <Button
                      onClick={handleImport}
                      disabled={!customUrl || isImportLoading}
                      className={classNames(
                        'w-full h-10 px-4 py-2 rounded-lg text-white transition-all duration-200 flex items-center gap-2 justify-center',
                        customUrl
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                          : isImportLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-700 cursor-not-allowed',
                      )}
                    >
                      {isImportLoading && <div className='i-svg-spinners:180-ring-with-bg w-4 h-4' />}
                      Import Repository
                    </Button>
                  </div>
                ) : (
                  <>
                    {activeTab === 'search' && (
                      <div className="space-y-4 mb-4">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Search repositories..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              handleSearch(e.target.value);
                            }}
                            className="flex-1 px-4 py-2 rounded-lg bg-[#252525] border border-[#333333] text-white"
                          />
                          <Button
                            onClick={() => setFilters({})}
                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-gray-600 hover:text-white"
                          >
                            <div className="i-ph:funnel-simple" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Updated repositories container with fixed height and scrolling */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedRepository ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setSelectedRepository(null)}
                              className="p-1.5 rounded-lg bg-transparent"
                            >
                              <div className="i-ph:arrow-left w-4 h-4" />
                            </Button>
                            <h3 className="font-medium">{selectedRepository.full_name}</h3>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-gray-600">Select Branch</label>
                            <Select
                              value={selectedBranch}
                              onChange={(e) => setSelectedBranch(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-transparent border border-alpha-white-10 text-white-dark focus:outline-none focus:ring-2 focus:ring-alpha-white-10"
                            >
                              {branches.map((branch) => (
                                <option
                                  key={branch.name}
                                  value={branch.name}
                                  className="bg-gray-900 text-white-dark"
                                >
                                  {branch.name} {branch.default ? '(default)' : ''}
                                </option>
                              ))}
                            </Select>
                            <Button
                              onClick={handleImport}
                              disabled={isImportLoading}
                              className={`w-full h-10 px-4 py-2 rounded-lg ${isImportLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600'} text-white transition-all duration-200 flex items-center gap-2 justify-center`}
                            >
                              {isImportLoading && <div className='i-svg-spinners:180-ring-with-bg w-4 h-4' />}
                              Import Selected Branch
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <RepositoryList
                          repos={activeTab === 'my-repos' ? repositories : searchResults}
                          isLoading={isLoading}
                          onSelect={handleRepoSelect}
                          activeTab={activeTab}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {currentStats && (
            <StatsDialog
              isOpen={showStatsDialog}
              onClose={() => {
                setShowStatsDialog(false);
                setIsImportLoading(false);
              }}
              onConfirm={handleStatsConfirm}
              stats={currentStats}
              isLargeRepo={currentStats.totalSize > 50 * 1024 * 1024}
            />
          )}

          {/* Divider with glow effect */}
          <div
            className="my-4 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
            style={{
              animation: 'fadeIn 0.3s ease-out 0.6s forwards',
              animationFillMode: 'backwards'
            }}
          ></div>

          {/* Secured by section with animation */}
          <div
            className="flex justify-center items-center"
            style={{
              animation: 'fadeIn 0.3s ease-out 0.7s forwards',
              animationFillMode: 'backwards'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                Secured by <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Websparks</span>
              </span>
            </div>
          </div>

          {/* Close button with hover effect */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors duration-200 bg-transparent p-1.5 rounded-full hover:bg-white/10"
            style={{
              animation: 'fadeIn 0.3s ease-out 0.1s forwards',
              animationFillMode: 'backwards'
            }}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <GitHubAuthDialog isOpen={showAuthDialog} onClose={handleAuthDialogClose} />
    </>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'bg-transparent text-sm px-2.5 py-1 rounded-full relative',
        active
          ? 'text-purple-500 bg-purple-500/10'
          : 'text-alpha-white-50 hover:text-white',
      )}
    >
      <span className="relative z-10">{children}</span>
      {active && (
        <motion.span
          layoutId="pill-tab"
          transition={{ duration: 0.2, ease: cubicEasingFn }}
          className="absolute inset-0 z-0 bg-alpha-accent-10 rounded-full"
        ></motion.span>
      )}
    </button>
  );
}

function RepositoryList({
  repos,
  isLoading,
  onSelect,
  activeTab,
}: {
  repos: GitHubRepoInfo[];
  isLoading: boolean;
  onSelect: (repo: GitHubRepoInfo) => void;
  activeTab: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-600">
        <span className="i-ph:spinner animate-spin mr-2" />
        Loading repositories...
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-600">
        <span className="i-ph:folder-simple-dashed w-12 h-12 mb-2 opacity-50" />
        <p>{activeTab === 'my-repos' ? 'No repositories found' : 'Search for repositories'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {repos.map((repo) => (
        <RepositoryCard key={repo.full_name} repo={repo} onSelect={() => onSelect(repo)} />
      ))}
    </div>
  )
}

function RepositoryCard({ repo, onSelect }: { repo: GitHubRepoInfo; onSelect: () => void }) {
  return (
    <div className="p-4 rounded-lg bg-transparent border border-alpha-white-10 hover:border-alpha-white-20 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="i-material-icon-theme:git text-gray-500" />
          <h3 className="font-medium text-white">{repo.name}</h3>
        </div>
        <button
          onClick={onSelect}
          className="px-4 py-2 h-10 rounded-lg bg-transparent border border-2 border-alpha-white-10 text-white hover:bg-purple-600 transition-all duration-200 flex items-center gap-2 justify-center"
        >
          <div className="i-oui:import w-4 h-4" />
        </button>
      </div>
      {repo.description && <p className="text-sm text-gray-600 mb-3">{repo.description.slice(0, 50)}</p>}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        {repo.language && (
          <span className="flex items-center gap-1">
            <img src={getFileIconConfig(repo.language.toLowerCase()).icon} alt={repo.language} className='w-4 h-4' />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="i-ph:clock" />
          {formatDateTime(repo.updated_at)}
        </span>
      </div>
    </div>
  );
}

const viewTransition = { ease: cubicEasingFn };

interface ViewProps extends HTMLMotionProps<'div'> {
  children: JSX.Element;
}

const View = memo(({ children, ...props }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" transition={viewTransition} {...props}>
      {children}
    </motion.div>
  );
});

