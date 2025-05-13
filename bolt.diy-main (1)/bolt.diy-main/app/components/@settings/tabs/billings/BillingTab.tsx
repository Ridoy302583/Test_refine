import React, { useState, useCallback, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { Dialog, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import Logo from '../../../../icons/logo.svg'
import Map from '../../../../icons/world.png'
import { API_BASE_URL, PRICING_URL } from '~/config';
import useUser from '~/types/user';
import { useBilling } from '~/lib/hooks/useBilling';


interface LocalState {
    status: string;
    pause_start_date: string;
    pause_end_date: string;
    remaining_tokens: number;
}

interface PauseCollection {
    behavior: string;
    resumes_at: string | null;
}

interface StripeState {
    status: string,
    pause_collection: PauseCollection | null,
    customer: string;
    current_period_end: number;
    success: boolean;
}
interface StatusProps {
    local_state: LocalState;
    stripe_state: StripeState;
}

export default function BillingTab() {
    const { getStoredToken, plan, user } = useUser();
    const token = getStoredToken();
    const { billingData, isLoading, error } = useBilling(token);
    const [statusData, getStatusData] = useState<StatusProps>();
    const planName = billingData?.current_plan?.name || plan?.name;
    const isFree = planName === 'Free';

    const getSubscriptionStatus = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/subscription-state`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Unauthorized - Please log in again');
                    return null;
                }
                throw new Error(`Failed to pause subscription: ${response.status}`);
            }

            const result = await response.json() as StatusProps;
            console.log("result", result)
            if (result) {
                getStatusData(result);
            }
        }
        catch (error) {
            throw error;
        }
    }

    useEffect(() => {
        if (token) {
            const initialData = async () => {
                getSubscriptionStatus();
            }
            initialData();
        }
    }, [token])

    const pauseSubscription = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/pause-subscription`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Unauthorized - Please log in again');
                    return null;
                }
                throw new Error(`Failed to pause subscription: ${response.status}`);
            }

            const result = await response.json();
            if (result) {
                getSubscriptionStatus();
            }
            return result;
        } catch (err) {
            console.error('Error pausing subscription:', err);
            throw err;
        }
    };

    const resumeSubscription = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/resume-subscription`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: ''
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Unauthorized - Please log in again');
                    return null;
                }
                throw new Error(`Failed to pause subscription: ${response.status}`);
            }

            const result = await response.json();
            if (result) {
                getSubscriptionStatus();
            }
            return result;
        } catch (err) {
            console.error('Error pausing subscription:', err);
            throw err;
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);

        // Array of month names
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${day} ${month}, ${year}`;
    };

    const formatCurrency = (amount: number): string => {
        return `$${amount.toFixed(2)}`;
    };

    const DisableButton: React.FC<{ subsacriptionDisabled: boolean }> = ({ subsacriptionDisabled }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [isLoading, setIsLoading] = useState(false);
        const planName = billingData?.current_plan?.name || plan?.name;
        const isFree = planName === 'Free';
    
        const handleOpenChange = useCallback((open: boolean) => {
            setIsOpen(open);
        }, []);
    
        const handleSubscription = useCallback(async () => {
            if (user?.id) {
                setIsLoading(true);
                try {
                    const data = !statusData?.stripe_state.pause_collection 
                        ? await pauseSubscription() 
                        : await resumeSubscription();
                    console.log(data);
                } catch (error) {
                    console.error("Subscription operation failed:", error);
                } finally {
                    setIsLoading(false);
                    setIsOpen(false);
                }
            }
        }, [user, statusData]);
    
          const handleUpgradeClick = () => {
            if (token) {
              window.open(`${PRICING_URL}/${token}`, '_blank');
            }
          };
    
        // Return Upgrade button for Free plan
        if (isFree) {
            return (
                <button
                    onClick={handleUpgradeClick}
                    className={classNames(
                        'group flex items-center gap-2',
                        'rounded-lg px-3 py-1.5',
                        'text-sm text-white',
                        'bg-gradient-to-r from-blue-600 to-purple-600',
                        'hover:from-blue-500 hover:to-purple-500',
                        'shadow-lg shadow-blue-900/20',
                        'transition-all duration-200',
                    )}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <polyline points="16 16 12 12 8 16"></polyline>
                        <line x1="12" y1="12" x2="12" y2="21"></line>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                        <polyline points="16 16 12 12 8 16"></polyline>
                    </svg>
                    Upgrade Plan
                </button>
            );
        }
    
        // Original Disable/Enable subscription code for paid plans
        return (
            <DialogRoot open={isOpen} onOpenChange={handleOpenChange}>
                {!statusData?.stripe_state.pause_collection ? (
                    <button
                        onClick={() => setIsOpen(true)}
                        className={classNames(
                            'group flex items-center gap-2',
                            'rounded-lg px-3 py-1.5',
                            'text-sm text-white',
                            'bg-red-600/20',
                            'border border-red-500/20',
                            'hover:bg-red-500 hover:text-white',
                            'transition-all duration-200',
                        )}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-400 group-hover:text-white transition-colors">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        Disable Subscription
                    </button>
                ) : (
                    <button
                        onClick={() => setIsOpen(true)}
                        className={classNames(
                            'group flex items-center gap-2',
                            'rounded-lg px-3 py-1.5',
                            'text-sm text-white',
                            'bg-green-600/20',
                            'border border-green-500/20',
                            'hover:bg-green-500/50 hover:text-white',
                            'transition-all duration-200',
                        )}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Active Subscription
                    </button>
                )}
                <Dialog showCloseButton>
                    {/* Dialog content remains the same */}
                    <div className="p-6 bg-gradient-to-br from-gray-900/90 to-black/90 rounded-lg">
                    <div className='mb-4'>
                                {!statusData?.stripe_state.pause_collection ? (
                                    <div className='w-full flex justify-center'>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24 text-orange-500">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className='w-full flex justify-center'>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24 text-green-300">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                )}
                                <p className='text-center text-white text-lg mt-4'>Are you sure you want to {!statusData?.stripe_state.pause_collection ? 'disable' : 'resume'} your plan? </p>
                                <p className='text-gray-300 text-center mt-2'>Disabling your subscription will cancel future billing cycles. You'll still have access to your current plan until the billing period ends.</p>
                            </div>
                        {/* Dialog content here */}
                        <div className="mt-4 flex flex-col gap-2">
                            {/* Dialog content here */}
                            <div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2'>
                                <button
                                    onClick={handleSubscription}
                                    disabled={isLoading}
                                    className={classNames(
                                        'group flex items-center justify-center gap-2',
                                        'rounded-lg px-4 py-2.5',
                                        'text-sm font-medium text-white',
                                        'bg-gradient-to-r from-blue-600 to-purple-600',
                                        'hover:from-blue-500 hover:to-purple-500',
                                        'shadow-lg shadow-blue-900/20',
                                        'transition-all duration-300',
                                        isLoading ? 'opacity-90 cursor-not-allowed' : ''
                                    )}
                                >
                                    {isLoading ? (
                                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    )}
                                    Yes, {!statusData?.stripe_state.pause_collection ? 'disable it' : 'resume it'}
                                </button>
                                {/* No button remains the same */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className={classNames(
                                        'group flex items-center justify-center gap-2',
                                        'rounded-lg px-4 py-2.5',
                                        'text-sm font-medium text-white',
                                        'bg-white/5 hover:bg-white/10',
                                        'border border-purple-500/20',
                                        'transition-all duration-200',
                                    )}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    No, keep it {!statusData?.stripe_state.pause_collection ? 'active' : 'disable'}
                                </button>
                                
                            </div>
                        </div>
                        
                    </div>
                </Dialog>
            </DialogRoot>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto mb-4">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-center">Failed to load billing information</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4">
            {/* Subscription Card */}
            <div
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(37, 99, 235, 0.9), rgba(124, 58, 237, 0.9)), url(${Map})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
                className="w-full h-56 rounded-xl p-6 flex flex-col justify-between shadow-lg overflow-hidden relative"
            >
                {/* Glow effects */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className="text-white text-xs">Plan Status </div>
                        
                        {planName=== 'Free' ? (
                            <p className="text-lg uppercase font-bold text-yellow-300">Free Plan</p>
                        ) : (
                            <p className={`text-lg uppercase font-bold ${!statusData?.stripe_state.pause_collection ? "text-green-300" : "text-red-300"}`}>
                                {!statusData?.stripe_state.pause_collection ? "Running" : "Paused"}
                            </p>
                        )}
                    
                    </div>
                    <div className="flex items-center">
                        <img src={Logo} className='w-10 h-10' alt="Sparks Logo" />
                        <div className='font-bold text-xl text-white'>SPARKS</div>
                    </div>
                </div>
                <div className="relative z-10">
                    <div className="w-11 h-7 bg-gray-800/50 backdrop-blur-sm rounded-md mr-3 flex items-center justify-center border border-white/20">
                        <div className="w-10 h-6 border border-gray-300/50 rounded-sm grid grid-cols-2 grid-rows-2 gap-px">
                            <div className="bg-[#DBA514]"></div>
                            <div className="bg-[#DBA514]"></div>
                            <div className="bg-[#DBA514]"></div>
                            <div className="bg-[#DBA514]"></div>
                        </div>
                    </div>
                    <div className="text-white text-xl tracking-wider mt-2 font-semibold">
                        {billingData?.current_plan?.name || plan?.name} Sparks User
                    </div>
                </div>

                {/* Card Footer - Name, Valid, and Chip */}
                <div className="flex justify-between items-end relative z-10">
                    <div className="flex flex-col">
                        <div className="text-white/70 text-xs uppercase mb-1">
                            name on subscription
                        </div>
                        <div className="text-white text-sm">
                            {user?.full_name ? user.full_name.toUpperCase() : 'USER'}
                            
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="flex flex-col">
                            <div className="text-white/70 text-xs uppercase mb-1">
                                valid thru
                            </div>
                            <div className="text-white text-sm">
                                {formatDate(plan?.plan_start_date || '')} - {formatDate(plan?.plan_end_date || '')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Payment History Section */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Payment History</h2>

                {/* Payment History Items */}
                <div className="grid grid-cols-1 gap-4 relative">
                    {billingData?.payments && billingData.payments.length > 0 ? (
                        billingData.payments.map((payment) => (
                            <div
                                key={payment.id}
                                className={classNames(
                                    'flex flex-col px-4 py-3 rounded-lg transition-all duration-200',
                                    'bg-gradient-to-br from-gray-900/90 to-black/90',
                                    'border border-purple-500/20',
                                    'hover:shadow-lg hover:shadow-blue-900/10',
                                    'text-white',
                                    'relative'
                                )}
                            >
                                <div className="absolute right-4 top-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/20">
                                    <div className="w-2 h-2 rounded-full animate-pulse bg-green-500 shadow-lg shadow-green-500/20" />
                                    <span className="text-xs text-green-400">Paid</span>
                                </div>

                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-lg font-semibold">{formatDate(payment.payment_datetime)}</p>
                                </div>

                                <div className='w-full flex justify-between'>
                                    <div className="flex flex-col">
                                        <p className="text-gray-300 text-sm">
                                            <span className="text-sm">Invoice No:</span> {payment.invoice_no}
                                        </p>
                                        <div className="flex gap-4 mt-1">
                                            <p className="text-gray-300 text-sm">
                                                <span className="text-sm">Method:</span> {payment.payment_method || "Online"}
                                            </p>
                                            <p className="text-gray-300 text-sm">
                                                <span className="text-sm">Type:</span> {payment.payment_type || "Subscription"}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">{formatCurrency(payment.total_price)}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/20 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-50">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <p className="text-gray-400">No payment history available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end">
                <DisableButton subsacriptionDisabled={!!statusData?.stripe_state} />
            </div>
        </div>
    );
}