import { useState, useEffect } from 'react';
import { API_BASE_URL } from '~/config';

export interface Plan {
    id: number;
    user_id: number;
    plan_id: number;
    name: string;
    price: number;
    plan_start_date: string;
    plan_end_date: string;
}

export interface Payment {
    id: number;
    user_id: number;
    plan_id: number;
    invoice_no: string;
    total_price: number;
    payment_datetime: string;
    payment_type: string;
    payment_method: string;
    payment_card_no: string | null;
}

export interface BillingResponse {
    current_plan: Plan;
    payments: Payment[];
}

interface UseBillingReturn {
    billingData: BillingResponse | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useBilling = (token: string | null): UseBillingReturn => {
    const [billingData, setBillingData] = useState<BillingResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBillingData = async () => {
        if (!token) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/user-plan-and-payments`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('default_project');
                    window.location.reload();
                    return;
                }
                throw new Error('Failed to fetch billing data');
            }

            const data: BillingResponse = await response.json();
            setBillingData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching billing data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchBillingData();
        }
    }, [token]);

    return {
        billingData,
        isLoading,
        error,
        refetch: fetchBillingData
    };
};