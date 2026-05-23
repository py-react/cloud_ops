import { useEffect } from 'react';
import useNavigate from '@/libs/navigate';

export default function StorageRedirect() {
    const navigate = useNavigate();
    useEffect(() => { navigate('/settings/gcp/storage/buckets', { replace: true }); }, [navigate]);
    return null;
}
