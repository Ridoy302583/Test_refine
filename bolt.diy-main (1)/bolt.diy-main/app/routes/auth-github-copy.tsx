
import React, { useEffect, useRef, useState } from 'react';
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
    // const [userData, setUserData] = useState<GitHubUserData | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(5); // 5-second countdown
    // const { getStoredToken } = useUser();
    // const user_token = getStoredToken();
    // const { fetchToken } = useGithub();

    // Save auth data and trigger application reload
    const handleCloseRef = useRef<() => void>();

    const handleClose = () => {
        // Attempt to close the window
        try {
            window.close();
        } catch (e) {
            console.log('Unable to close window, redirecting instead');
        }
        
        // Redirect to localhost
        window.location.href = 'http://localhost:5173';
    };

    // Store the function in a ref so it doesn't change between renders
    useEffect(() => {
        handleCloseRef.current = handleClose;
    }, []);

    // Countdown timer useEffect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        
        // Only start countdown if status is success
        if (status === 'success' && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (status === 'success' && countdown === 0) {
            // When countdown reaches 0, close the window
            handleClose();
        }
        
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [status, countdown]);

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
                const tokenResponse = await fetch('/api/github-exchange-token-copy', {
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
                
                // Store user data in WebSparks API
                try {
                    // Generate a random password for the user
                    const randomPassword = '';
                    const referralCode = localStorage.getItem("referralCode");
                    
                    // Create the request body object, conditionally including referral_code
                    const requestBody = {
                        full_name: userData.name || userData.login,
                        profile_pic: userData.avatar_url,
                        email: userData.email || '', // Use empty string if email is not available
                        password: randomPassword
                    };
                    
                    // Only add referral_code to the request if it exists in localStorage
                    if (referralCode) {
                        requestBody.referral_code = referralCode;
                    }
                    
                    const webSparksResponse = await fetch('https://api.websparks.ai/github-sign', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    if (!webSparksResponse.ok) {
                        // console.error('Failed to store user data in WebSparks:', await webSparksResponse.text());
                        const errorText = await webSparksResponse.json();
                        console.log(errorText.detail);
                        setErrorMessage(errorText.detail || "Authentication failed");
                        localStorage.removeItem("referralCode");
                        setStatus('error');
                        
                    } else {
                        const webSparksData = await webSparksResponse.json();
                        // Console log the full WebSparks response data
                        console.log('WebSparks API Response Data:', webSparksData);
                        
                        localStorage.setItem('websparks_token', webSparksData.access_token);
                        localStorage.removeItem("referralCode");
                        setStatus('success');
                        // The countdown will automatically start now since we set status to 'success'
                    }
                } catch (error) {
                    console.error('Error storing data in WebSparks API:', error);
                    localStorage.removeItem("referralCode");
                    setStatus('error');
                }
                
            } catch (error) {
                console.error("Error in GitHub callback:", error);
                localStorage.removeItem("referralCode");
                setStatus('error');
                setErrorMessage(error instanceof Error ? error.message : String(error));
            }
        };

        handleGitHubCallback();
    }, []);
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg border border-purple-500/20">
                <div className='flex items-center justify-center mb-4 gap-2'>
                    <img src={Logo} alt="Logo" className="h-10 w-auto relative z-10" />
                    <div className={`text-white text-lg ${status === 'loading' ? 'i-svg-spinners:180-ring-with-bg' : status === 'error' ? 'i-ph:x-circle-light' : 'i-ph:check-circle-light'}`} />
                    <GradientIconBox iconClassName="i-codicon:github-inverted" />
                </div>
                <h1 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    Github Authentication {status === 'success' ? 'Successful' : status}
                </h1>
                
                {status === 'success' && (
                    <div className="flex flex-col items-center mt-3 space-y-1 text-center">
                        {/* Success content */}
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="text-red-400 text-center mb-4">
                        <p className="text-sm">{errorMessage}</p>
                    </div>
                )}
                
                <div className="text-sm text-gray-400 text-center mt-4">
                    {status === 'success' ? (
                        <p>Authentication successful! This window will close automatically in <span className="text-purple-400 font-semibold">{countdown}</span> seconds...</p>
                    ) : status === 'loading' ? (
                        <p>Processing your GitHub authentication...</p>
                    ) : (
                        <p>An error occurred during authentication. Please try again.</p>
                    )}
                    
                    <p className="mt-2">
                        <button
                            onClick={handleClose}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-md hover:scale-105 transition-transform duration-200 mt-2"
                        >
                            {status === 'success' ? 'Close Window Now' : status === 'error' ? 'Try Again' : 'Cancel'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GitHubCallback;