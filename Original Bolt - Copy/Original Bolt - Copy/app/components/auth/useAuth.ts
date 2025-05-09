import { useStore } from '@nanostores/react';
import { authActions, authStore } from './authStore';

const useAuth = () => {
    const authState = useStore(authStore);
    
    return {
        authState,
        login: authActions.login,
        register: authActions.register,
        logout: authActions.logout,
        verifyEmail: authActions.verifyEmail,
        resendVerificationCode: authActions.resendVerificationCode,
        resendVerificationOtpCode: authActions.resendVerificationOtpCode,
        sendForgotPasswordOtp: authActions.sendForgotPasswordOtp,
        verifyForgotPasswordOtp: authActions.verifyForgotPasswordOtp,
        resetPassword:authActions.resetPassword,
    };
};

export default useAuth;