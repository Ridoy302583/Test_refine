import React, { useEffect } from 'react';

// Google Sign-In Types
interface PromptMomentNotification {
    isDisplayed(): boolean;
    isNotDisplayed(): boolean;
    getNotDisplayedReason(): string;
    isDismissedMoment(): boolean;
    getDismissedReason(): string;
    isSkippedMoment(): boolean;
    getSkippedReason(): string;
}

interface GoogleCredentialResponse {
    credential?: string;
}

interface GsiButtonConfiguration {
    type: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: string | number;
    locale?: string;
}

// Extending Window interface
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: GoogleCredentialResponse) => void;
                        auto_select?: boolean;
                        cancel_on_tap_outside?: boolean;
                    }) => void;
                    prompt: (
                        momentListener?: (res: PromptMomentNotification) => void
                    ) => void;
                    renderButton: (
                        parent: HTMLElement,
                        options: GsiButtonConfiguration,
                        clickHandler?: () => void
                    ) => void;
                    disableAutoSelect: () => void;
                };
            };
        };
    }
}

interface SocialLoginProps {
    setSubmitError: (title: string) => void;
}

const SocialLogin: React.FC<SocialLoginProps> = ({ setSubmitError }) => {
    const GITHUB_CLIENT_ID = 'Ov23li0HVoGWJirGmrwr';
    const GOOGLE_CLIENT_ID = '1072278812402-ul5vnh4rkad8csjbbt7pcf8qtotunulh.apps.googleusercontent.com'; // Replace with your actual Google Client ID
    const REDIRECT_URI = `${window.location.origin}/auth/github`;
    // We don't need the googleButtonRef anymore

    useEffect(() => {
        // Parse URL to extract referral code
        const searchParams = window.location.search;
        // Check if the URL has the format "?=XXXX"
        if (searchParams.startsWith('?=')) {
            const extractedReferralCode = searchParams.substring(2);
            if (extractedReferralCode) {
                // setReferralCode(extractedReferralCode);
                // console.log('Referral code extracted from URL Social Login:', extractedReferralCode);
                localStorage.setItem("referralCode", extractedReferralCode);
            }
        }
    }, []);

    // We don't need the useEffect for Google Sign-In API anymore since we're using OAuth redirect

    const handleGoogleCredentialResponse = (response: GoogleCredentialResponse) => {
        try {
            // Handle Google Sign-In response - typically send the credential to your backend
            if (response.credential) {
                // Send the credential to your backend for verification
                console.log('Google Sign-In successful, credential:', response.credential);
                
                // You would typically make an API call to your backend here
                // Example:
                // await fetch('/api/auth/google', {
                //   method: 'POST',
                //   headers: { 'Content-Type': 'application/json' },
                //   body: JSON.stringify({ credential: response.credential })
                // });
                
                // Then handle the response or redirect as needed
            } else {
                setSubmitError('Failed to sign in with Google. Please try again.');
            }
        } catch (error) {
            setSubmitError('Failed to sign in with Google. Please try again.');
        }
    };

    const handleGoogleLogin = () => {
        try {
            // Create the Google OAuth URL
            const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
            const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/google`; // Should match your backend setup
            
            // Configure OAuth parameters
            const params = new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                redirect_uri: GOOGLE_REDIRECT_URI,
                response_type: 'code',
                scope: 'email profile',
                access_type: 'offline', // For refresh token
                prompt: 'select_account' // Forces account selection even if user is already logged in
            });
            // window.location.href = githubAuthorizeUrl;
            
            // Open the Google OAuth URL in a new tab
            window.location.href=`${GOOGLE_OAUTH_URL}?${params.toString()}`;
        } catch (error) {
            setSubmitError('Failed to connect with Google. Please try again.');
        }
    };
    
    const handleGitubConnect = async () => {
        const GITHUB_CLIENT_ID = 'Ov23li0HVoGWJirGmrwr';
        const REDIRECT_URI = `http://localhost:5173/auth-github-copy`;
        const githubAuthorizeUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo user delete_repo workflow gist admin:repo_hook&prompt=consent`;
        window.location.href = githubAuthorizeUrl;
        // setIsFetching(true);
        // setFetchCount(0);
        // const initialResult = await fetchData() as GitHubResponse;

        // if (initialResult && initialResult.github_token) {
        //     return;
        // }

        // if (fetchIntervalRef.current) {
        //     clearInterval(fetchIntervalRef.current);
        // }

        // fetchIntervalRef.current = setInterval(async () => {
        //     await fetchData();
        // }, 2000);
    };


    const handleGitHubLogin = () => {
        try {
            const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
                REDIRECT_URI
            )}&scope=user:email`;
            window.location.href = githubAuthUrl;
        } catch (error) {
            setSubmitError('Failed to connect with GitHub. Please try again.');
        }
    };

    return (
        <div className="flex justify-center w-full">
            <div className="w-full max-w-md space-y-4">
                <div className="flex flex-row gap-4">
                    {/* GitHub Button */}
                    <button
                        onClick={handleGitubConnect}
                        className="flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl border border-gray-300 border-opacity-10 bg-black/30 backdrop-blur-sm text-white font-montserrat transition-all duration-300 hover:bg-black/50 hover:shadow-lg hover:transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"
                            />
                        </svg>
                        <span className="ml-3 text-base font-medium tracking-wide">GitHub</span>
                    </button>

                    {/* Google Sign-In Button (Custom) */}
                    <button
                        onClick={handleGoogleLogin}
                        className="flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl border border-gray-300 border-opacity-10 bg-black/30 backdrop-blur-sm text-white font-montserrat transition-all duration-300 hover:bg-black/50 hover:shadow-lg hover:transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span className="ml-3 text-base font-medium tracking-wide">Google</span>
                    </button>
                </div>

                {/* We don't need the hidden div for Google's official button anymore */}
            </div>
        </div>
    );
};

export default SocialLogin;