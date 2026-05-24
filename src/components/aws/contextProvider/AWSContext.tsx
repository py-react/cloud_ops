import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AWSCredential {
    id: number;
    name: string;
    aws_access_key_id?: string;
    active?: boolean;
}

interface AWSContextType {
    awsCredentials: AWSCredential[];
    refreshAWSCredentials: () => Promise<void>;
    selectedAwsCredential: AWSCredential | null;
    setSelectedAwsCredential: (id: number | null) => void;
    selectedRegion: string;
    setSelectedRegion: (region: string) => void;
    availableRegions: { value: string; label: string }[];
    setAvailableRegions: (regions: { value: string; label: string }[]) => void;
}

const AWSContext = createContext<AWSContextType | undefined>(undefined);

const DEFAULT_REGION = 'us-east-1';

export const AWSContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [awsCredentials, setAwsCredentials] = useState<AWSCredential[]>([]);
    const [selectedAwsCredential, setSelectedAwsCredentialState] = useState<AWSCredential | null>(null);
    const [selectedRegion, setSelectedRegionState] = useState<string>(
        localStorage.getItem('k1w1_selected_aws_region') || DEFAULT_REGION
    );
    const [availableRegions, setAvailableRegions] = useState<{ value: string; label: string }[]>([]);

    const refreshAWSCredentials = useCallback(async () => {
        try {
            const token = document.cookie.split('; ').find(row => row.startsWith('k1w1_token='))?.split('=')[1];
            const res = await fetch('/api/integration/credentials', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            const awsCreds = (data || [])
                .filter((c: any) => c.provider === 'aws')
                .map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    aws_access_key_id: c.aws_access_key_id,
                    active: c.active
                }));
            setAwsCredentials(awsCreds);

            const storedId = localStorage.getItem('k1w1_selected_aws_credential');
            if (storedId) {
                const found = awsCreds.find((c: any) => c.id === parseInt(storedId));
                if (found) {
                    setSelectedAwsCredentialState(found);
                    return;
                }
            }

            if (awsCreds.length > 0 && !selectedAwsCredential) {
                setSelectedAwsCredentialState(awsCreds[0]);
                localStorage.setItem('k1w1_selected_aws_credential', String(awsCreds[0].id));
            }
        } catch (err) {
            console.error('Failed to fetch AWS credentials:', err);
        }
    }, []);

    const setSelectedAwsCredential = useCallback((id: number | null) => {
        if (!id) {
            setSelectedAwsCredentialState(null);
            localStorage.removeItem('k1w1_selected_aws_credential');
            return;
        }
        const cred = awsCredentials.find(c => c.id === id);
        if (cred) {
            setSelectedAwsCredentialState(cred);
            localStorage.setItem('k1w1_selected_aws_credential', String(id));
        }
    }, [awsCredentials]);

    const setSelectedRegion = useCallback((region: string) => {
        setSelectedRegionState(region);
        localStorage.setItem('k1w1_selected_aws_region', region);
    }, []);

    useEffect(() => {
        refreshAWSCredentials();
    }, []);

    return (
        <AWSContext.Provider value={{
            awsCredentials,
            refreshAWSCredentials,
            selectedAwsCredential,
            setSelectedAwsCredential,
            selectedRegion,
            setSelectedRegion,
            availableRegions,
            setAvailableRegions,
        }}>
            {children}
        </AWSContext.Provider>
    );
};

export const useAWS = () => {
    const context = useContext(AWSContext);
    if (context === undefined) {
        throw new Error('useAWS must be used within a AWSContextProvider');
    }
    return context;
};
