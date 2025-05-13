import { atom } from 'nanostores';
import { API_BASE_URL } from '~/config';

interface AuthState {
    access_token: string | null;
    default_project_id: number | null;
    user: string | null;
}

interface AuthResponse {
    access_token: string;
    default_project_id: number;
    user: string;
}

interface ErrorResponse {
    message: string;
    code?: string;
    detail?: string;
}

interface VerificationResponse {
    access_token: string;
    default_project_id: number;
    message?: string;
}

interface RegisterRequest {
    full_name: string;
    profile_pic: string;
    email: string;
    password: string;
    referral_code?: string; 
}

// Type guard for VerificationResponse
function isVerificationResponse(data: any): data is VerificationResponse {
    return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.access_token === 'string' &&
        typeof data.default_project_id === 'number'
    );
}

// Type guard for ErrorResponse
function isErrorResponse(data: any): data is ErrorResponse {
    return (
        typeof data === 'object' &&
        data !== null &&
        (typeof data.detail === 'string' || typeof data.message === 'string')
    );
}

// Create the auth store
export const authStore = atom<AuthState>({
    access_token: null,
    default_project_id: null,
    user: null,
});

// Type guard for auth response
const isAuthResponse = (data: any): data is AuthResponse => {
    return data && 
           typeof data.access_token === 'string' && 
           typeof data.default_project_id === 'number'
};

// Helper function for API calls
const handleAuthResponse = async (response: Response): Promise<AuthResponse> => {
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json() as ErrorResponse;
            errorMessage = errorData.detail || errorData.message || errorMessage;
        }
        throw new Error(errorMessage);
    }
    
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json() as AuthResponse;
        return data;
    }
    throw new Error('Invalid response format from server');
};

// Helper function for error handling
const handleError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unexpected error occurred';
};

// Helper function to generate avatar
const generateAvatar = async (email: string, name: string): Promise<string> => {
    try {
        const { toSvg } = await import('jdenticon');
        const uniqueValue = `${email}-${name}`;
        const svgString = toSvg(uniqueValue, 512);
        const base64 = btoa(unescape(encodeURIComponent(svgString)));
        return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
        // console.error('Error generating avatar:', error);
        return ''; // Return empty string if avatar generation fails
    }
};

interface LoginResponse {
    success: boolean;
    message: string;
}

// Auth actions
export const authActions = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data: AuthResponse | ErrorResponse = await response.json();

            if (!response.ok) {
                if (isErrorResponse(data)) {
                    return {
                        success: false,
                        message: data.detail || data.message || 'Login failed'
                    };
                }
                return {
                    success: false,
                    message: 'Login failed'
                };
            }

            if (isAuthResponse(data)) {
                // Update auth store
                authStore.set({
                    access_token: data.access_token,
                    default_project_id: data.default_project_id,
                    user: data.user,
                });
                
                localStorage.setItem('websparks_token', data.access_token);
                return {
                    success: true,
                    message: 'Login successful'
                };
            }

            return {
                success: false,
                message: 'Invalid response format from server'
            };

        } catch (error) {
            // console.error('Error during login:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    },

    register: async ({ name, email, password }: { name: string; email: string; password: string; }): Promise<{ success: boolean; message: string }> => {
        try {
            const avatarBase64 = await generateAvatar(email, name);
            
            const requestData: RegisterRequest = {
                full_name: name,
                profile_pic: avatarBase64,
                email: email,
                password: password
            };

            // Add referral code if provided
            

            const response = await fetch(`${API_BASE_URL}/register-customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const responseData: unknown = await response.json();

            if (!response.ok) {
                const errorMessage = isErrorResponse(responseData) 
                    ? responseData.detail || responseData.message 
                    : 'Registration failed';
                return {
                    success: false,
                    message: errorMessage
                };
            }

            const message = isErrorResponse(responseData) 
                ? responseData.message 
                : 'Registration successful';

            return {
                success: true,
                message
            };
        } catch (error) {
            return {
                success: false,
                message: handleError(error)
            };
        }
    },

    verifyEmail: async (
        email: string, 
        verificationCode: string, 
        referralCode?: string
    ): Promise<{ success: boolean; message: string; data?: VerificationResponse }> => {
        try {
            // Create request body with required fields
            const requestBody: {
                email: string;
                ev_code: string;
                referral_code?: string;
            } = {
                email,
                ev_code: verificationCode
            };

            // Add referral code to request if provided
            if (referralCode) {
                requestBody.referral_code = referralCode;
            }

            const response = await fetch(`${API_BASE_URL}/verify-email`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const responseData: unknown = await response.json();

            if (!response.ok) {
                const errorMessage = isErrorResponse(responseData) 
                    ? responseData.detail || responseData.message 
                    : 'Verification failed';
                return {
                    success: false,
                    message: errorMessage
                };
            }

            if (!isVerificationResponse(responseData)) {
                return {
                    success: false,
                    message: 'Invalid server response'
                };
            }

            authStore.set({
                access_token: responseData.access_token,
                default_project_id: responseData.default_project_id,
                user: null,
            });
            // console.log('<<<<<<< Auth Store >>>>>>>>>>', authStore)
            localStorage.setItem('websparks_token', responseData.access_token);
            return {
                success: true,
                message: responseData.message || 'Verification successful',
                data: responseData
            };
        } catch (error) {
            return {
                success: false,
                message: handleError(error)
            };
        }
    },

    resendVerificationCode: async (email: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/send-verification-email`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gmail: email })
            });

            const responseData: unknown = await response.json();

            if (!response.ok) {
                const errorMessage = isErrorResponse(responseData) 
                    ? responseData.detail || responseData.message 
                    : 'Failed to resend verification code';
                return {
                    success: false,
                    message: errorMessage
                };
            }

            const message = isErrorResponse(responseData) 
                ? responseData.message || 'Verification code sent successfully'
                : 'Verification code sent successfully';

            return {
                success: true,
                message
            };
        } catch (error) {
            return {
                success: false,
                message: handleError(error)
            };
        }
    },
    resendVerificationOtpCode: async (email: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/send-forgot-password-otp`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });

            const responseData: unknown = await response.json();

            if (!response.ok) {
                const errorMessage = isErrorResponse(responseData) 
                    ? responseData.detail || responseData.message 
                    : 'Failed to resend verification code';
                return {
                    success: false,
                    message: errorMessage
                };
            }

            const message = isErrorResponse(responseData) 
                ? responseData.message || 'Verification code sent successfully'
                : 'Verification code sent successfully';

            return {
                success: true,
                message
            };
        } catch (error) {
            return {
                success: false,
                message: handleError(error)
            };
        }
    },

    logout: async (tokenData: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/signout`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${tokenData}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to log out');
            }

            authStore.set({
                access_token: null,
                default_project_id: null,
                user: null,
            });
            
            localStorage.removeItem('websparks_token');
            localStorage.removeItem('websparks_user_data');
            localStorage.removeItem('websparks_user_plan');
            window.location.href='/';
            return true;
        } catch (error) {
            // console.error('Error during logout:', handleError(error));
            return false;
        }
    },

    sendForgotPasswordOtp: async (email: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/send-forgot-password-otp`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const responseData: unknown = await response.json();

            if (!response.ok) {
                const errorMessage = isErrorResponse(responseData) 
                    ? responseData.detail || responseData.message 
                    : 'Failed to send verification code';
                return {
                    success: false,
                    message: errorMessage
                };
            }

            const message = isErrorResponse(responseData) 
                ? responseData.message || 'Verification code sent successfully'
                : 'Verification code sent successfully';

            return {
                success: true,
                message
            };
        } catch (error) {
            return {
                success: false,
                message: handleError(error)
            };
        }
    },

    verifyForgotPasswordOtp: async (email: string, verificationCode: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/otp-verify`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    fp_code: verificationCode
                })
            });

            const responseData: unknown = await response.json();

            if (!response.ok) {
                const errorMessage = isErrorResponse(responseData) 
                    ? responseData.detail || responseData.message 
                    : 'Verification failed';
                return {
                    success: false,
                    message: errorMessage
                };
            }

            return {
                success: true,
                message: 'Verification successful'
            };
        } catch (error) {
            return {
                success: false,
                message: handleError(error)
            };
        }
    },

    resetPassword: async (email: string, verificationCode: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    fp_code: verificationCode,
                    new_password: newPassword
                })
            });

            const responseData: unknown = await response.json();

            if (!response.ok) {
                const errorMessage = isErrorResponse(responseData) 
                    ? responseData.detail || responseData.message 
                    : 'Password reset failed';
                return {
                    success: false,
                    message: errorMessage
                };
            }

            return {
                success: true,
                message: 'Password reset successful'
            };
        } catch (error) {
            return {
                success: false,
                message: handleError(error)
            };
        }
    },

    // Initialize auth state from localStorage on app load
    initializeAuth: () => {
        const token = localStorage.getItem('websparks_token');
        if (token) {
            authStore.set({
                access_token: token,
                default_project_id: null,
                user: null,
            });
        }
    },
};