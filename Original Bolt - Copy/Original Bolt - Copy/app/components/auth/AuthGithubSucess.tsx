//@ts-nocheck
import React, { useEffect } from 'react';
import { API_BASE_URL } from '~/config';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { useLocation } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';

interface GitHubUserEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

interface GitHubUserData {
  name: string;
  avatar_url: string;
  email?: string;
  login: string;  // Adding GitHub username
}

interface LoginResponse {
  access_token: string;
  default_project_id: string;
}

interface ErrorResponse {
  detail?: string;
  message?: string;
  [key: string]: any;
}

export const AuthSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const code = searchParams.get('code');

  function generateRandomCode(length: number = 100): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return result;
  }

  useEffect(() => {
    if (code && typeof window !== 'undefined') {
      exchangeCodeForAccessToken(code);
      const newUrl = window.location.origin + window.location.pathname + generateRandomCode();
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [code]);

  const exchangeCodeForAccessToken = async (code: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/github/oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const data: { access_token: string } = await response.json();
      console.log(data)
      await fetchGitHubUser(data.access_token);
    } catch (error) {
      // console.error('Error exchanging code for access token:', error);
      navigate('/?error=github-auth');
    }
  };

  const fetchGitHubUser = async (accessToken: string): Promise<void> => {
    try {
      // Fetch user data
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error(`GitHub API error: ${userResponse.status}`);
      }

      const userData: GitHubUserData = await userResponse.json();

      // Fetch email data
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!emailResponse.ok) {
        throw new Error(`GitHub Email API error: ${emailResponse.status}`);
      }

      const userEmails: GitHubUserEmail[] = await emailResponse.json();
      const primaryEmail = userEmails.find((item) => item.primary === true);

      // Use fallback values if data is missing
      const name = userData.name || userData.login || 'GitHub User';
      const email = primaryEmail?.email || '';
      const avatar_url = userData.avatar_url || '';
      
      await sendGithubLogin(name, avatar_url, email, null);
    } catch (error) {
      // console.error('Error fetching GitHub user data:', error);
    //   navigate('/?error=github-user-fetch');
    }
  };

  const sendGithubLogin = async (
    full_name: string,
    profile_pic: string,
    email: string,
    password: string | null
  ): Promise<LoginResponse | void> => {
    try {
      const requestBody = {
        full_name,
        profile_pic,
        email,
        password
      };

      const response = await fetch(`${API_BASE_URL}/github-sign`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to login with GitHub');
      }

      const result = responseData as LoginResponse;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('websparks_token', result.access_token);
        navigate('/');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const LoadingSpinner = () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm z-50">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-blue-500/20 filter blur-xl rounded-full scale-150 opacity-70"></div>
        
        {/* Spinner */}
        <div className="relative">
          <svg className="animate-spin h-16 w-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
      
      {/* Text with gradient */}
      <h3 className="mt-6 text-xl font-bold font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
        Logging in with GitHub...
      </h3>
    </div>
  );

  return (
    <ClientOnly fallback={<LoadingSpinner />}>
      {() => <LoadingSpinner />}
    </ClientOnly>
  );
};