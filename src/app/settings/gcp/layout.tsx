import React from 'react';
import { Outlet } from 'react-router-dom';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';

const GCPLayout = () => {
    const { selectedGcpCredential } = useGCP();

    return (
        <Outlet context={{ selectedGcpCredential }} />
    );
};

export default GCPLayout;