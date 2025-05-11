import { useEffect, useState } from 'react';

export function useNetlifyAuth() {
  const [authData, setAuthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check for stored auth code on component mount
  useEffect(() => {
    const storedCode = localStorage.getItem('netlify_auth_code');
    const storedParams = localStorage.getItem('netlify_auth_params');
    
    if (storedCode) {
      try {
        const params = storedParams ? JSON.parse(storedParams) : {};
        console.log('Found stored Netlify auth data:', { code: storedCode, params });
        
        setAuthData({
          code: storedCode,
          params,
          source: 'localStorage',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error parsing stored auth params:', err);
      }
    }
  }, []);

  // Setup listener for message from popup window
  useEffect(() => {
    const handleAuthMessage = (event) => {
      // Validate message type
      if (event.data && event.data.type === 'netlify_auth_success') {
        console.log('Received auth message from popup:', event.data);
        
        // Store complete auth data
        setAuthData({
          ...event.data,
          source: 'popup',
          receivedAt: new Date().toISOString()
        });
        
        // You can exchange the code for tokens here or in a separate function
      }
    };

    window.addEventListener('message', handleAuthMessage);
    
    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  // Function to initiate Netlify OAuth - opens in a new tab
  const connectToNetlify = () => {
    setLoading(true);
    setError(null);
    
    try {
      const redirectUri = `${window.location.origin}/auth-netlify`;
      // Replace with your actual Netlify OAuth application client ID
      const clientId = encodeURIComponent('UTkfyvt70ispZi5RDESzjeO2glMx7YYupKSO59l504Q');
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      
      // Generate a random state value for CSRF protection
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('netlify_auth_state', state);
      
      // Construct the authorization URL
      const authUrl = `https://app.netlify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&state=${state}`;
      const authLink = `https://app.netlify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodedRedirectUri}&state=${state}`;

      console.log('Initiating Netlify OAuth flow:', { authUrl, redirectUri });
      
      // Open in a new tab
      window.open(
        authLink,
        '_blank',
        'noopener,noreferrer' // Security best practices for opening new windows
      );
      
      // Set a timer to periodically check for the auth code in localStorage
      const checkAuthCode = setInterval(() => {
        const storedCode = localStorage.getItem('netlify_auth_code');
        if (storedCode) {
          clearInterval(checkAuthCode);
          setLoading(false);
          
          try {
            const storedParams = localStorage.getItem('netlify_auth_params');
            const params = storedParams ? JSON.parse(storedParams) : {};
            
            console.log('Found auth code in localStorage:', { code: storedCode });
            
            setAuthData({
              code: storedCode,
              params,
              source: 'localStorage',
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.error('Error processing stored auth data:', err);
            setError('Error processing authentication data');
          }
        }
      }, 1000); // Check every second
      
      // Set a timeout to stop checking after 5 minutes (300000ms)
      setTimeout(() => {
        clearInterval(checkAuthCode);
        if (!localStorage.getItem('netlify_auth_code') && loading) {
          setLoading(false);
          setError('Authentication timed out. Please try again.');
          console.log('Auth timed out after 5 minutes');
        }
      }, 300000);
      
    } catch (err) {
      console.error('Error initiating Netlify auth:', err);
      setError(err.message || 'Failed to connect with Netlify');
      setLoading(false);
    }
  };

  // Function to exchange code for token (implement with your backend)
  const exchangeCodeForToken = async (code) => {
    if (!code) {
      console.error('No code provided to exchange for token');
      return { success: false, error: 'No code provided' };
    }
    
    setLoading(true);
    
    try {
      console.log('Exchanging code for token:', code);
      const response = await fetch('/api/exchange-netlify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token exchange failed:', response.status, errorData);
        throw new Error(errorData.message || `Failed to exchange code for token: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Token exchange successful');
      
      // Log information about the response but not the actual tokens
      console.log('Token response data keys:', Object.keys(data));
      console.log('Token expiry:', data.expires_in);
      
      // Store the tokens securely
      localStorage.setItem('netlify_token', data.access_token);
      localStorage.setItem('netlify_refresh_token', data.refresh_token);
      localStorage.setItem('netlify_token_expiry', new Date(Date.now() + (data.expires_in * 1000)).toISOString());
      
      setLoading(false);
      
      return { 
        success: true, 
        message: 'Token exchange successful',
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
      };
    } catch (err) {
      console.error('Error exchanging code for token:', err);
      setError(err.message || 'Failed to exchange code for token');
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Function to clear auth data
  const clearAuthData = () => {
    localStorage.removeItem('netlify_auth_code');
    localStorage.removeItem('netlify_auth_params');
    localStorage.removeItem('netlify_auth_state');
    localStorage.removeItem('netlify_token');
    localStorage.removeItem('netlify_refresh_token');
    localStorage.removeItem('netlify_token_expiry');
    setAuthData(null);
    setError(null);
    console.log('Cleared Netlify auth data');
  };

  return {
    authData,
    loading,
    error,
    connectToNetlify,
    exchangeCodeForToken,
    clearAuthData
  };
}