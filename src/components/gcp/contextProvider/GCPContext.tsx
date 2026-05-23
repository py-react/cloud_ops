import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface GCPCredential {
    id: number;
    name: string;
    project_id?: string;
    client_email?: string;
    active?: boolean;
}

interface GCPContextType {
    gcpCredentials: GCPCredential[];
    refreshGCPCredentials: () => Promise<void>;
    selectedGcpCredential: GCPCredential | null;
    setSelectedGcpCredential: (id: number | null) => void;
}

const GCPContext = createContext<GCPContextType | undefined>(undefined);

export const GCPContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gcpCredentials, setGcpCredentials] = useState<GCPCredential[]>([]);
    const [selectedGcpCredential, setSelectedGcpCredentialState] = useState<GCPCredential | null>(null);

    const refreshGCPCredentials = useCallback(async () => {
        try {
            const token = document.cookie.split('; ').find(row => row.startsWith('k1w1_token='))?.split('=')[1];
            const res = await fetch('/api/integration/credentials', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            const gcpCreds = (data || [])
                .filter((c: any) => c.provider === 'gcp')
                .map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    project_id: c.gcp_project_id,
                    client_email: c.gcp_client_email,
                    active: c.active
                }));
            setGcpCredentials(gcpCreds);

            const storedId = localStorage.getItem('k1w1_selected_gcp_credential');
            if (storedId) {
                const found = gcpCreds.find((c: any) => c.id === parseInt(storedId));
                if (found) {
                    setSelectedGcpCredentialState(found);
                    return;
                }
            }
            
            if (gcpCreds.length > 0 && !selectedGcpCredential) {
                setSelectedGcpCredentialState(gcpCreds[0]);
                localStorage.setItem('k1w1_selected_gcp_credential', String(gcpCreds[0].id));
            }
        } catch (err) {
            console.error('Failed to fetch GCP credentials:', err);
        }
    }, []);

    const setSelectedGcpCredential = useCallback((id: number | null) => {
        if (!id) {
            setSelectedGcpCredentialState(null);
            localStorage.removeItem('k1w1_selected_gcp_credential');
            return;
        }
        const cred = gcpCredentials.find(c => c.id === id);
        if (cred) {
            setSelectedGcpCredentialState(cred);
            localStorage.setItem('k1w1_selected_gcp_credential', String(id));
        }
    }, [gcpCredentials]);

    useEffect(() => {
        refreshGCPCredentials();
    }, []);

    return (
        <GCPContext.Provider value={{
            gcpCredentials,
            refreshGCPCredentials,
            selectedGcpCredential,
            setSelectedGcpCredential
        }}>
            {children}
        </GCPContext.Provider>
    );
};

export const useGCP = () => {
    const context = useContext(GCPContext);
    if (context === undefined) {
        throw new Error('useGCP must be used within a GCPContextProvider');
    }
    return context;
};