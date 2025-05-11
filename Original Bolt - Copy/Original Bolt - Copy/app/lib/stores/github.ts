// github.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { logStore } from '~/lib/stores/logs';
import { API_BASE_URL } from '~/config';

// Type definitions
export interface GitHubUserResponse {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  public_gists: number;
}

export interface GitHubRepoInfo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  default_branch: string;
  updated_at: string;
  language: string | null;
  private: boolean;
  languages_url: string;
}

export interface GitHubContent {
  type: string;
  encoding: string;
  size: number;
  name: string;
  path: string;
  content: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string;
}

export interface GitHubTreeResponse {
  tree: Array<{
    path: string;
    type: string;
    size?: number;
  }>;
}

export interface GitHubOrganization {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  repo: {
    name: string;
  };
  created_at: string;
}

export interface GitHubLanguageStats {
  [language: string]: number;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
}

export interface RepositoryStats {
  totalFiles: number;
  totalSize: number;
  languages: { [key: string]: number };
  hasPackageJson: boolean;
  hasDependencies: boolean;
}

export interface GitHubStats {
  repos: GitHubRepoInfo[];
  recentActivity: GitHubEvent[];
  languages: GitHubLanguageStats;
  totalGists: number;
  publicRepos: number;
  privateRepos: number;
  stars: number;
  forks: number;
  followers: number;
  publicGists: number;
  privateGists: number;
  lastUpdated: string;

  // Keep these for backward compatibility
  totalStars?: number;
  totalForks?: number;
  organizations?: GitHubOrganization[];
}

// Store state interface
interface GitHubState {
  user: GitHubUserResponse | null;
  token: string;
  tokenType: 'classic' | 'fine-grained';
  isGithubConnected: boolean;
  isLoading: boolean;
  isGithubVerifying: boolean;
  stats: GitHubStats | null;
  rateLimits: RateLimit | null;
  
  // Actions
  connect: (token: string, tokenType: 'classic' | 'fine-grained') => Promise<void>;
  disconnect: () => void;
  fetchStats: () => Promise<void>;
  fetchRecentRepos: (limit?: number) => Promise<GitHubRepoInfo[]>;
  verifyRepository: (repoUrl: string) => Promise<RepositoryStats | null>;
  pushToRepository: (repoName: string, isPrivate?: boolean) => Promise<string | null>;
  updateRateLimits: () => Promise<void>;
}

// Store implementation
export const useGitHubStore = create<GitHubState>()(
  persist(
    (set, get) => ({
      user: null,
      token: '',
      tokenType: 'classic',
      isGithubConnected: false,
      isLoading: false,
      isGithubVerifying: false,
      stats: null,
      rateLimits: null,

      // Connect to GitHub with a token
      connect: async (token: string, tokenType: 'classic' | 'fine-grained') => {
        if (!token.trim()) {
          return;
        }

        set({ isGithubVerifying: true });
        
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('Invalid GitHub token. Please check and try again.');
            } else {
              throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
          }

          const userData = await response.json() as GitHubUserResponse;
          
          // Update rate limits from headers
          const rateLimits = {
            limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
            remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
            reset: new Date(parseInt(response.headers.get('x-ratelimit-reset') || '0') * 1000),
          };

          // Set cookies for API requests
          Cookies.set('git:github.com', JSON.stringify({ username: token, password: 'x-oauth-basic' }));

          // Update store
          set({ 
            user: userData, 
            token, 
            tokenType, 
            isGithubConnected: true, 
            rateLimits 
          });

          // Log success
          logStore.logInfo('Connected to GitHub', {
            type: 'system',
            message: `Connected to GitHub as ${userData.login}`,
          });
          const githubStore = get();
          await githubStore.fetchStats();
        } catch (error) {
          console.error('Error connecting to GitHub:', error);
        } finally {
          set({ isGithubVerifying: false });
        }
      },

      // Disconnect from GitHub
      disconnect: () => {
        // Clear cookies
        Cookies.remove('git:github.com');
        // Clear store
        set({ 
          user: null, 
          token: '', 
          tokenType: 'classic', 
          isGithubConnected: false, 
          stats: null,
          rateLimits: null 
        });
      },
      fetchStats: async () => {
        const { token, tokenType, user } = get();
        
        if (!token || !user) {
          toast.error('Not connected to GitHub');
          return;
        }
        
        set({ isLoading: true });
        
        try {
          let allRepos: GitHubRepoInfo[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const reposResponse = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            });

            if (!reposResponse.ok) {
              if (reposResponse.status === 401) {
                toast.error('Your GitHub token has expired. Please reconnect your account.');
                get().disconnect();
                return;
              }
              throw new Error(`Failed to fetch repositories: ${reposResponse.statusText}`);
            }

            const repos = await reposResponse.json() as GitHubRepoInfo[];
            allRepos = [...allRepos, ...repos];

            // Check if there are more pages
            const linkHeader = reposResponse.headers.get('Link');
            hasMore = linkHeader?.includes('rel="next"') ?? false;
            page++;
          }
          const eventsResponse = await fetch(`https://api.github.com/users/${user.login}/events?per_page=10`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          let recentActivity: GitHubEvent[] = [];
          if (eventsResponse.ok) {
            const events = await eventsResponse.json() as any[];
            recentActivity = events.slice(0, 5).map((event: any) => ({
              id: event.id,
              type: event.type,
              repo: {
                name: event.repo.name,
              },
              created_at: event.created_at,
            }));
          }

          // Calculate language stats
          const languages: GitHubLanguageStats = {};
          allRepos.forEach(repo => {
            if (repo.language) {
              if (!languages[repo.language]) {
                languages[repo.language] = 0;
              }
              languages[repo.language] += 1;
            }
          });

          // Calculate stats
          const totalStars = allRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
          const totalForks = allRepos.reduce((sum, repo) => sum + repo.forks_count, 0);
          const privateRepos = allRepos.filter(repo => repo.private).length;

          // Update stats
          const stats: GitHubStats = {
            repos: allRepos,
            recentActivity,
            languages,
            totalGists: user.public_gists || 0,
            publicRepos: user.public_repos || 0,
            privateRepos,
            stars: totalStars,
            forks: totalForks,
            followers: user.followers || 0,
            publicGists: user.public_gists || 0,
            privateGists: 0, // Not available in public API
            lastUpdated: new Date().toISOString(),

            // For backward compatibility
            totalStars,
            totalForks,
            organizations: [],
          };

          set({ stats });
          await get().updateRateLimits();
        } catch (error) {
          console.error('Error fetching GitHub stats:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchRecentRepos: async (limit = 5) => {
        const { token } = get();
        
        if (!token) {
          toast.error('Not connected to GitHub');
          return [];
        }
        
        try {
          const response = await fetch(
            `https://api.github.com/user/repos?sort=updated&per_page=${limit}&type=all&affiliation=owner,organization_member`,
            {
              headers: {
                Accept: 'application/vnd.github.v3+json',
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!response.ok) {
            if (response.status === 401) {
              toast.error('GitHub token expired. Please reconnect your account.');
              get().disconnect();
            } else {
              logStore.logError('Failed to fetch GitHub repositories', {
                status: response.status,
                statusText: response.statusText,
              });
            }
            return [];
          }

          const repos = await response.json() as GitHubRepoInfo[];
          return repos;
        } catch (error) {
          logStore.logError('Failed to fetch GitHub repositories', { error });
          toast.error('Failed to fetch recent repositories');
          return [];
        }
      },

      // Verify repository
      verifyRepository: async (repoUrl: string) => {
        const { token } = get();
        
        try {
          // Extract branch from URL if present (format: url#branch)
          let branch: string | null = null;
          let cleanUrl = repoUrl;

          if (repoUrl.includes('#')) {
            const parts = repoUrl.split('#');
            cleanUrl = parts[0];
            branch = parts[1];
          }

          // Parse owner and repo from URL
          const [owner, repo] = cleanUrl
            .replace(/\.git$/, '')
            .split('/')
            .slice(-2);

          // Set up headers
          const headers: HeadersInit = token
            ? {
                Accept: 'application/vnd.github.v3+json',
                Authorization: `Bearer ${token}`,
              }
            : {
                Accept: 'application/vnd.github.v3+json',
              };

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

          const repoInfo = await repoInfoResponse.json() as { default_branch: string };
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

          const treeData = await treeResponse.json() as GitHubTreeResponse;

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
                  const content = await contentResponse.json() as GitHubContent;
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
          const errorMessage = error instanceof Error ? error.message : 'Failed to verify repository';
          toast.error(errorMessage);
          return null;
        }
      },

      // Push to repository
      pushToRepository: async (repoName: string, isPrivate = false) => {
        const { token, user } = get();
        
        if (!token || !user) {
          toast.error('Not connected to GitHub');
          return null;
        }
        
        try {
          // Check if repository exists first
          const checkRepoResponse = await fetch(`https://api.github.com/repos/${user.login}/${repoName}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });
          
          let repoExists = checkRepoResponse.ok;
          
          if (!repoExists) {
            // Create the repository
            const createRepoResponse = await fetch('https://api.github.com/user/repos', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: repoName,
                private: isPrivate,
                auto_init: false,
              }),
            });
            
            if (!createRepoResponse.ok) {
              throw new Error(`Failed to create repository: ${createRepoResponse.statusText}`);
            }
            
            const repo = await createRepoResponse.json() as GitHubRepoInfo;
            return repo.html_url;
          } else {
            // Repository already exists
            const repo = await checkRepoResponse.json() as GitHubRepoInfo;
            return repo.html_url;
          }
        } catch (error) {
          console.error('Error pushing to GitHub:', error);
          toast.error(`Failed to push to GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return null;
        }
      },

      // Update rate limits
      updateRateLimits: async () => {
        const { token } = get();
        
        if (!token) return;
        
        try {
          const response = await fetch('https://api.github.com/rate_limit', {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          if (response.ok) {
            const data = await response.json() as { resources: { core: { limit: number; remaining: number; reset: number } } };
            const rateLimits = {
              limit: data.resources.core.limit,
              remaining: data.resources.core.remaining,
              reset: new Date(data.resources.core.reset * 1000),
            };

            set({ rateLimits });
          }
        } catch (error) {
          console.error('Failed to fetch rate limits:', error);
        }
      },
    }),
    {
      name: 'github-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tokenType: state.tokenType,
        isGithubConnected: state.isGithubConnected,
        stats: state.stats,
      }),
    }
  )
);