import React, { useState, useEffect, useRef } from 'react';
import Logo from '../../../icons/roundedlogo.svg';
import useAuth from '../useAuth';
import { Input } from '~/components/ui/Input';
import { classNames } from '~/utils/classNames';
import { Button } from '~/components/ui/Button';

interface PasswordSetProps {
    passwordSetOpen: boolean;
    email: string | null;
    code: string | null;
    handleSignInOpen: () => void;
}

interface FormData {
    newpassword: string;
    confirmpassword: string;
}

const PasswordSet: React.FC<PasswordSetProps> = ({
    passwordSetOpen,
    email,
    code,
    handleSignInOpen
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { resetPassword } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        newpassword: '',
        confirmpassword: '',
    });
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(3);

    // Handle countdown and redirect on success
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (success && redirectCountdown > 0) {
            timer = setTimeout(() => {
                setRedirectCountdown(prev => prev - 1);
            }, 1000);
        } else if (success && redirectCountdown === 0) {
            handleSignInOpen();
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [success, redirectCountdown, handleSignInOpen]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [event.target.id]: event.target.value,
        }));
        setError(''); // Clear error when user types
    };

    const handleToggleNewPasswordVisibility = () => {
        setShowNewPassword(prev => !prev);
    };

    const handleToggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(prev => !prev);
    };

    const validatePassword = (password: string) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        return regex.test(password);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !code) {
            setError('Email or verification code is missing');
            return;
        }

        if (!validatePassword(formData.newpassword)) {
            setError('Password must be at least 6 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.');
            return;
        }

        if (formData.newpassword !== formData.confirmpassword) {
            setError('New password and confirm password must match.');
            return;
        }

        try {
            setLoading(true);
            const result = await resetPassword(email, code, formData.newpassword);

            if (result.success) {
                setSuccess(true);
                setFormData({ newpassword: '', confirmpassword: '' });
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!passwordSetOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-md overflow-y-auto"
            style={{
                animation: 'fadeIn 0.3s ease-out forwards'
            }}
        >
            <div
                ref={menuRef}
                className="relative w-full max-w-lg p-6 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-lg rounded-2xl border border-purple-500/20 text-white shadow-2xl z-[1001] my-8"
                style={{
                    animation: 'scaleIn 0.3s ease-out forwards',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
            >
                {/* <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl"></div> */}
                <div className="flex justify-center w-full mb-2 relative">
                    <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
                </div>
                <div className="my-6">
                    <h2 className="text-xl font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                        {success ? 'Password Reset Successful!' : 'Set New Password'}
                    </h2>
                    <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
                        {success
                            ? `Redirecting to sign in page in ${redirectCountdown} seconds...`
                            : 'Please enter your new password'}
                    </p>
                </div>
                {success ? (
                    <div className="my-8 flex flex-col items-center">
                        {/* Success icon */}
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <p className="text-center text-green-300 mb-6">
                            Your password has been reset successfully!
                        </p>

                        <button
                            onClick={handleSignInOpen}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white rounded-lg"
                        >
                            Sign In Now
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="my-6 flex items-center">
                            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                            <span className="px-3 text-sm font-montserrat text-gray-300">New Password</span>
                            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div>
                                <div className="mb-5">
                                    <div className="relative group">
                                        <Input
                                            required
                                            type={showNewPassword ? 'text' : 'password'}
                                            id="newpassword"
                                            placeholder="Enter Your New Password"
                                            value={formData.newpassword}
                                            onChange={handleChange}
                                            className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                                                'border-red-500': false,
                                            })}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleToggleNewPasswordVisibility}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white bg-transparent hover:text-blue-400 transition-colors duration-200 p-1"
                                            style={{ background: 'transparent' }}
                                        >
                                            {showNewPassword ? (
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                                                    <path d="M9.9 4.24C10.5883 4.0781 11.2931 3.99775 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.481 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2219 9.18488 10.8539C9.34884 10.4859 9.58525 10.1547 9.88 9.88M1.45 1.45L4.65 4.65L4.84 4.84L7.88 7.88L14.12 14.12L16.01 16.01L19.55 19.55L22.55 22.55M1 12C1 12 5 4 12 4C12.7069 3.99775 13.4117 4.0781 14.1 4.24L16.85 6.99C17.9174 7.82224 18.8531 8.81332 19.63 9.93C20.4618 11.2915 21.1118 12.7814 21.56 14.34L21 21.94L18.11 19.05C17.5081 19.6303 16.753 20.0311 15.9282 20.1881C15.1035 20.3452 14.2473 20.2503 13.4872 19.9155C12.7271 19.5806 12.1005 19.0228 11.6967 18.3165C11.293 17.6101 11.1344 16.7933 11.25 16L7.86 12.61L5.52 10.27C4.35796 11.3466 3.42487 12.6342 2.78 14.06L2.6 14.44L1 12ZM12 7C11.4696 7 10.9609 7.21071 10.5858 7.58579C10.2107 7.96086 10 8.46957 10 9V9.73L12.73 12.46L13 12C13 11.4696 12.7893 10.9609 12.4142 10.5858C12.0391 10.2107 11.5304 10 11 10H10.88L12 9V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                                                    <path d="M12 5C8.24261 5 5.43602 7.4404 3.76737 8.99179C2.51521 10.1564 2.51521 11.8436 3.76737 13.0082C5.43602 14.5596 8.24261 17 12 17C15.7574 17 18.564 14.5596 20.2326 13.0082C21.4848 11.8436 21.4848 10.1564 20.2326 8.99179C18.564 7.4404 15.7574 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm password field with icon */}
                                <div className="mb-5">
                                    <div className="relative group">
                                        <Input
                                            required
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmpassword"
                                            placeholder="Confirm Your New Password"
                                            value={formData.confirmpassword}
                                            onChange={handleChange}
                                            className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                                                'border-red-500': false,
                                            })}                                        />
                                        <button
                                            type="button"
                                            onClick={handleToggleConfirmPasswordVisibility}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white bg-transparent hover:text-blue-400 transition-colors duration-200 p-1"
                                            style={{ background: 'transparent' }}
                                        >
                                            {showConfirmPassword ? (
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                                                    <path d="M9.9 4.24C10.5883 4.0781 11.2931 3.99775 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.481 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2219 9.18488 10.8539C9.34884 10.4859 9.58525 10.1547 9.88 9.88M1.45 1.45L4.65 4.65L4.84 4.84L7.88 7.88L14.12 14.12L16.01 16.01L19.55 19.55L22.55 22.55M1 12C1 12 5 4 12 4C12.7069 3.99775 13.4117 4.0781 14.1 4.24L16.85 6.99C17.9174 7.82224 18.8531 8.81332 19.63 9.93C20.4618 11.2915 21.1118 12.7814 21.56 14.34L21 21.94L18.11 19.05C17.5081 19.6303 16.753 20.0311 15.9282 20.1881C15.1035 20.3452 14.2473 20.2503 13.4872 19.9155C12.7271 19.5806 12.1005 19.0228 11.6967 18.3165C11.293 17.6101 11.1344 16.7933 11.25 16L7.86 12.61L5.52 10.27C4.35796 11.3466 3.42487 12.6342 2.78 14.06L2.6 14.44L1 12ZM12 7C11.4696 7 10.9609 7.21071 10.5858 7.58579C10.2107 7.96086 10 8.46957 10 9V9.73L12.73 12.46L13 12C13 11.4696 12.7893 10.9609 12.4142 10.5858C12.0391 10.2107 11.5304 10 11 10H10.88L12 9V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                                                    <path d="M12 5C8.24261 5 5.43602 7.4404 3.76737 8.99179C2.51521 10.1564 2.51521 11.8436 3.76737 13.0082C5.43602 14.5596 8.24261 17 12 17C15.7574 17 18.564 14.5596 20.2326 13.0082C21.4848 11.8436 21.4848 10.1564 20.2326 8.99179C18.564 7.4404 15.7574 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div className="mb-6 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-center text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Submit button with animated gradient */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className={`relative w-full flex justify-center items-center p-3.5 rounded-xl text-white font-medium text-base transition-all duration-300 
                                        ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 cursor-pointer'}
                                        overflow-hidden group shadow-lg shadow-blue-900/20 mt-2`}
                                >
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                    <span className="relative flex items-center justify-center">
                                        {loading ? (
                                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : 'Continue'}
                                        {!loading && (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        )}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </>
                )}

                {/* Divider with glow effect */}
                <div className="my-6 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

                {/* Footer with enhanced styling */}
                <div className="flex justify-center items-center">
                    <span className="text-sm text-gray-400">
                        Secured by <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Websparks</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PasswordSet;