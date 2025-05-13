import { json, useNavigate, useSearchParams } from '@remix-run/react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { GradientIconBox } from '~/components/ui/GradientIconBox';
import { API_BASE_URL } from '~/config';
import Logo from '~/icons/roundedlogo.svg';
import useGithub from '~/lib/hooks/useGithub';
import useUser from '~/types/user';

// This component handles the redirect from Google OAuth
export default function GoogleAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(5); // 5-second countdown

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

    console.log(code);

    useEffect(() => {
        const handleGoogleCallback = async () => {
            if (error) {
                console.error('Google OAuth error:', error);
                setStatus('error');
                setErrorMessage('Authentication was denied or cancelled');
                return;
            }

            if (!code) {
                console.error('No code received from Google');
                setStatus('error');
                setErrorMessage('No authentication code was received');
                return;
            }

            try {
                // Exchange the code for a token
                const response = await fetch('/api/google-exchange-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        redirectUri: window.location.origin + '/auth/google',
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Token exchange error:', errorData);
                    setStatus('error');
                    setErrorMessage('Failed to exchange authorization code for token');
                    return;
                }

                const data = await response.json();
                
                console.log(data);
                console.log(data.user.email, data.user.name, data.user.picture);
                try {
                    // Generate a random password for the user
                    const randomPassword = '';
                    
                    // Get referral code from localStorage
                    const referralCode = localStorage.getItem("referralCode");
                    
                    // Create the request body object, conditionally including referral_code
                    const requestBody = {
                        full_name: data.user.name,
                        profile_pic: data.user.picture,
                        email: data.user.email,
                        password: randomPassword
                    };
                    
                    // Only add referral_code to the request if it exists in localStorage
                    if (referralCode) {
                        requestBody.referral_code = referralCode;
                    }
                    
                    const webSparksResponse = await fetch('https://api.websparks.ai/google-sign', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    if (!webSparksResponse.ok) {
                        const errorText = await webSparksResponse.json();
                        console.log(errorText.detail);
                        setErrorMessage(errorText.detail || "Authentication failed");
                        localStorage.removeItem("referralCode"); // Delete referral code on error
                        setStatus('error');
                    } else {
                        const webSparksData = await webSparksResponse.json();
                        // Console log the full WebSparks response data
                        console.log('WebSparks API Response Data:', webSparksData);
                        
                        localStorage.setItem('websparks_token', webSparksData.access_token);
                        localStorage.removeItem("referralCode"); // Delete referral code on success
                        setStatus('success');
                        // The countdown will automatically start now since we set status to 'success'
                    }
                } catch (error) {
                    console.error('Error storing data in WebSparks API:', error);
                    localStorage.removeItem("referralCode"); // Delete referral code on error
                    setStatus('error');
                    setErrorMessage('Failed to store user data');
                }
            } catch (error) {
                console.error('Error during token exchange:', error);
                localStorage.removeItem("referralCode"); // Delete referral code on error
                setStatus('error');
                setErrorMessage('Authentication process failed');
            }
        };

        handleGoogleCallback();
    }, [code, error, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg border border-purple-500/20">
                <div className='flex items-center justify-center mb-4 gap-2'>
                    <img src={Logo} alt="Logo" className="h-10 w-auto relative z-10" />
                    <div className={`text-white text-lg ${status === 'loading' ? 'i-svg-spinners:180-ring-with-bg' : status === 'error' ? 'i-ph:x-circle-light' : 'i-ph:check-circle-light'}`} />
                    <GradientIconBox iconClassName="i-logos:google-icon " />
                </div>
                
                <h1 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    Google Authentication {status === 'success' ? 'Successful' : status}
                </h1>
                
                {status === 'success' && (
                    <div className="flex flex-col items-center mt-3 space-y-1 text-center">
                        {/* Success content would go here if needed */}
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
                        <p>Processing your Google authentication...</p>
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
}