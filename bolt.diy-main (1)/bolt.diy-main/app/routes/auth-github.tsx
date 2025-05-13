//@ts-nocheck
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { GradientIconBox } from '~/components/ui/GradientIconBox';
import { API_BASE_URL } from '~/config';
import Logo from '~/icons/roundedlogo.svg';
import useGithub from '~/lib/hooks/useGithub';
import useUser from '~/types/user';

interface TokenResponse {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
}

interface GitHubUserData {
    login: string;
    avatar_url: string;
    name?: string;
    email?: string;
    [key: string]: any;
}

const GitHubCallback: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [userData, setUserData] = useState<GitHubUserData | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(5); // 5-second countdown
    const { getStoredToken } = useUser();
    const user_token = getStoredToken();
    const {fetchToken} = useGithub();

    const handleConnect = async (githubToken:string, githubTokenType:string) => {
        try {
            if (!user_token) {
                throw new Error('User token is null or undefined');
            }
            const getData = await fetchToken(user_token);
            console.log(getData);

            if (getData) {
                const response = await fetch(`${API_BASE_URL}/github-users-patch-me`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user_token}`
                    },
                    body: JSON.stringify({
                        github_username: githubTokenType,
                        github_token: githubToken,
                    })
                });
                if (!response.ok) {
                    throw new Error(`Failed to store token: ${response.status}`);
                }
                const data = await response.json();
                toast.success('GitHub connection updated successfully');
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
                            github_username: githubTokenType,
                            github_token: githubToken,
                        })
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to store token: ${response.status}`);
                    }
                    const data = await response.json();
                    toast.success('GitHub connected successfully');
                    return data;
                } catch (error) {
                    toast.error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    return null;
                }
            }
        } catch (error) {
            console.error('Failed to connect:', error);
        }
    };

    useEffect(() => {
        const handleGitHubCallback = async () => {
            // Get code and state using native URLSearchParams
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');

            if (!code) {
                setStatus('error');
                setErrorMessage('Code not found in request');
                return;
            }

            try {
                // Exchange the code for an access token using our server API
                const tokenResponse = await fetch('/api/github-exchange-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        state,
                        redirectUri: window.location.href.split('?')[0] // Current URL without query params
                    })
                });

                if (!tokenResponse.ok) {
                    const errorData = await tokenResponse.json();
                    throw new Error(errorData.error || 'Failed to exchange token');
                }

                const tokenData: TokenResponse = await tokenResponse.json();
                const accessToken = tokenData.access_token;

                if (!accessToken) {
                    setStatus('error');
                    setErrorMessage(tokenData.error_description || tokenData.error || "Access token not received");
                    return;
                }

                // Get GitHub user data
                const userResponse = await fetch("https://api.github.com/user", {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                });

                if (!userResponse.ok) {
                    throw new Error(`Failed to get user data: ${userResponse.status}`);
                }
                
                // Get the user data
                const userData: GitHubUserData = await userResponse.json();
                
                // Get user emails (if scope allows)
                try {
                    const emailsResponse = await fetch("https://api.github.com/user/emails", {
                        headers: {
                            "Authorization": `Bearer ${accessToken}`
                        }
                    });
                    
                    if (emailsResponse.ok) {
                        const emails = await emailsResponse.json();
                        console.log(emails)
                        // Find primary email
                        const primaryEmail = emails.find(email => email.primary === true);
                        if (primaryEmail) {
                            userData.email = primaryEmail.email;
                            
                        }
                    }
                } catch (error) {
                    console.log("Could not fetch user emails:", error);
                    // Continue with the flow, email is optional
                }
                handleConnect(accessToken, userData.login)
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'GITHUB_AUTH_SUCCESS',
                        accessToken: accessToken,
                        username: userData.login
                    }, '*');
                }
                setUserData(userData);
                setStatus('success');
                setTimeout(() => {
                    console.log('Closing auth callback window...');
                    window.close();
                }, 5000);
            } catch (error) {
                console.error("Error in GitHub callback:", error);
                setStatus('error');
                setErrorMessage(error instanceof Error ? error.message : String(error));
            }
        };

        handleGitHubCallback();
    }, []);

    // Separate useEffect for the countdown display
    useEffect(() => {
        if (status === 'success') {
            const interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [status]);

    const handleClose = () => {
        window.close();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg border border-purple-500/20">
                <div className='flex items-center justify-center mb-4 gap-2'>
                    <img src={Logo} alt="Logo" className="h-10 w-auto relative z-10" />
                    <div className={`text-white text-lg ${status === 'loading' ? 'i-svg-spinners:180-ring-with-bg' : status === 'error' ? 'i-ph:x-circle-light' : 'i-ph:check-circle-light'}`} />
                    <GradientIconBox iconClassName="i-codicon:github-inverted text-2xl" />
                </div>
                <h1 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    Github Authentication {status}
                </h1>
                {userData && (
                    <>
                        <div className="flex justify-center gap-2">
                            {userData.avatar_url && (
                                <img
                                    src={userData.avatar_url}
                                    alt={userData.login}
                                    className="w-12 h-12 rounded-full border-2 border-websparks-elements-item-contentAccent dark:border-websparks-elements-item-contentAccent"
                                />
                            )}
                        </div>
                        <div className="flex flex-col items-center mt-3 space-y-1 text-center">
                            <p className="font-medium">Connected as: {userData.name || userData.login}</p>
                            {/* <p className="text-gray-400">@{userData.login}</p> */}
                            {/* {userData.email && (
                                <p className="text-sm text-gray-300">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="i-heroicons:envelope-solid text-purple-400" />
                                        {userData.email} <span className="text-xs text-purple-300">(primary)</span>
                                    </span>
                                </p>
                            )} */}
                        </div>
                    </>
                )}
                <div className="text-sm text-gray-400 text-center mt-4">
                    <p>This window will close automatically in <span className="text-purple-400 font-semibold">{countdown}</span> seconds...</p>
                    <p className="mt-2">
                        <button
                            onClick={() => handleClose()}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-md hover:scale-105 transition-transform duration-200 mt-2"
                        >
                            Close Window Now
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GitHubCallback;