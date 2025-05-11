import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '~/config';

export interface User {
    full_name: string;
    fp_code_expire: string | null;
    access_token: string;
    role: string;
    created_at: string;
    status: string;
    theme: string;
    register_type: string;
    language: string;
    ev_code: string | null;
    register_ip: string;
    id: number;
    profile_pic: string;
    email: string;
    ev_code_expire: string | null;
    login_ip: string;
    email_verified: boolean;
    fp_code: string | null;
    refer_code: string; // Added refer_code field
}

interface Plan {
    unlimited_access: boolean;
    id: number;
    name: string;
    plan_start_date: string;
    plan_end_date: string;
    total_token: number;
    token_available: number;
    remaining_token: number;
    status: string;
    remaining_chat_time: number;
}

interface UserResponse {
    user: User;
    user_plan: Plan;
}

const STORAGE_KEY_USER = 'websparks_user_data';
const STORAGE_KEY_PLAN = 'websparks_user_plan';
const isBrowser = typeof window !== 'undefined';

// Get stored token from localStorage
const getStoredToken = (): string | null => {
    if (!isBrowser) return null;
    
    try {
        return localStorage.getItem('websparks_token');
    } catch (error) {
        console.error('Error accessing localStorage:', error);
        return null;
    }
};

// Get stored user data from localStorage
const getStoredUserData = (): { user: User | null, plan: Plan | null } => {
    if (!isBrowser) return { user: null, plan: null };
    
    try {
        const userJson = localStorage.getItem(STORAGE_KEY_USER);
        const planJson = localStorage.getItem(STORAGE_KEY_PLAN);
        
        return {
            user: userJson ? JSON.parse(userJson) : null,
            plan: planJson ? JSON.parse(planJson) : null
        };
    } catch (error) {
        console.error('Error retrieving stored user data:', error);
        return { user: null, plan: null };
    }
};

// Store user data in localStorage
const storeUserData = (user: User | null, plan: Plan | null): void => {
    if (!isBrowser) return;
    
    try {
        if (user) {
            // Only store specific fields including refer_code
            const filteredUser = {
                full_name: user.full_name,
                access_token: user.access_token,
                profile_pic: user.profile_pic,
                email: user.email,
                refer_code: user.refer_code // Added refer_code to stored data
            };
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(filteredUser));
        }
        if (plan) {
            const filteredPlan = {
                name: plan.name,
            };
            localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(filteredPlan));
        }
    } catch (error) {
        console.error('Error storing user data:', error);
    }
};

export const UserMe = async (token: string): Promise<UserResponse | null> => {
    if (!token) {
        console.error('No token provided');
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/user/me-new`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            localStorage.removeItem('websparks_token');
            localStorage.removeItem(STORAGE_KEY_USER);
            localStorage.removeItem(STORAGE_KEY_PLAN);
            window.location.reload();
            return null;
        }

        const data: UserResponse = await response.json();
        // Store the fetched data in localStorage for quick access on next load
        storeUserData(data.user, data.user_plan);
        return data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
};

const useUser = () => {
    // Initialize with data from localStorage for immediate access
    const storedData = getStoredUserData();
    const [user, setUser] = useState<User | null>(storedData.user);
    const [plan, setPlan] = useState<Plan | null>(storedData.plan);
    const [loading, setLoading] = useState<boolean>(!storedData.user); // Only show loading if no cached data
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = useCallback(async (token: string | null) => {
        if (!token) {
            setLoading(false);
            setError('No authentication token found.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await UserMe(token);
            
            if (result) {
                setUser(result.user);
                setPlan(result.user_plan);
                storeUserData(result.user, result.user_plan);
            } else {
                setError('Failed to fetch user data.');
            }
        } catch (err) {
            setError('An error occurred while fetching user data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only run effect in browser environment
        if (!isBrowser) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        const token = getStoredToken();

        // If we have cached data, we can fetch fresh data in the background
        if (storedData.user) {
            // Do the background fetch without setting loading state
            const backgroundFetch = async () => {
                if (!token) return;
                
                try {
                    const result = await UserMe(token);
                    if (isMounted && result) {
                        setUser(result.user);
                        setPlan(result.user_plan);
                    }
                } catch (error) {
                    console.error('Background fetch error:', error);
                }
            };
            
            backgroundFetch();
        } else {
            // No cached data, do a regular fetch with loading state
            fetchUserData(token);
        }

        return () => {
            isMounted = false;
        };
    }, [fetchUserData]);

    const refetchUser = async () => {
        const token = getStoredToken();
        await fetchUserData(token);
    };

    return { 
        getStoredToken,
        user, 
        plan,
        loading,
        error,
        refetchUser
    };
};

export default useUser;