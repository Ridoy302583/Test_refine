// app/routes/api.github-exchange-token.ts
import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';

/**
 * API route that exchanges a GitHub OAuth code for an access token
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

        console.log(data)

        if (!code) {
            return json({ error: 'Code is required' }, { status: 400 });
        }

        // GitHub OAuth config
        const clientId = "Ov23li0HVoGWJirGmrwr";
        const clientSecret = "fde2dd0cc8d41b2d12c257213971ce24a76727e9";
        const finalRedirectUri = redirectUri || `${new URL(request.url).origin}/auth-github-copy`;

        // Exchange code for access token
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: finalRedirectUri,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GitHub token exchange failed:', errorText);
            return json({ error: 'Failed to exchange code for token' }, { status: 400 });
        }

        const tokenData = await response.json();

        // If we got a token but couldn't get user data, just return the token
        return json(tokenData);
    } catch (error) {
        console.error('Error in GitHub token exchange:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};