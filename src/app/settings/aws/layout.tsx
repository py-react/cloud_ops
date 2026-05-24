import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';

const AWSLayout = () => {
    const { selectedAwsCredential } = useAWS();

    return (
        <Outlet context={{ selectedAwsCredential }} />
    );
};

export default AWSLayout;
