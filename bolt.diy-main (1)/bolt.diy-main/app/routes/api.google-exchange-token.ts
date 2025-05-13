import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';

/**
 * API route that exchanges a Google OAuth code for an access token
 * This avoids CORS issues by handling the token exchange on the server
 */
export const action: ActionFunction = async ({ request }) => {
    try {
        if (request.method !== 'POST') {
            return json({ error: 'Method not allowed' }, { status: 405 });
        }

        // Get code from request body
        const data = await request.json();
        const { code, redirectUri } = data;

        console.log(data);

        if (!code) {
            return json({ error: 'Code is required' }, { status: 400 });
        }

        // Google OAuth config
        const clientId = '1072278812402-ul5vnh4rkad8csjbbt7pcf8qtotunulh.apps.googleusercontent.com';
        const clientSecret = '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'; // Replace with your actual Google Client Secret
        const finalRedirectUri = redirectUri || `${new URL(request.url).origin}/auth/google`;

        // Exchange code for access token
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: finalRedirectUri,
                grant_type: 'authorization_code'
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google token exchange failed:', errorText);
            return json({ error: 'Failed to exchange code for token' }, { status: 400 });
        }

        const tokenData = await response.json();
        
        // Fetch user information using the access token
        if (tokenData.access_token) {
            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`
                    }
                });
                
                if (userInfoResponse.ok) {
                    const userInfo = await userInfoResponse.json();
                    // Return both token data and user info
                    return json({ 
                        ...tokenData, 
                        user: userInfo 
                    });
                }
            } catch (error) {
                console.error('Error fetching Google user info:', error);
                // If we can't get user info, just return the token data
            }
        }

        // If we couldn't get user data or there was an error, just return the token data
        return json(tokenData);
    } catch (error) {
        console.error('Error in Google token exchange:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};