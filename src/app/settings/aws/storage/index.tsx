import React from 'react';
import { Button } from '@/components/ui/button';
import { Box, Database } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import useNavigate from '@/libs/navigate';

export default function StorageIndex() {
    const navigate = useNavigate();

    return (
        <PageLayout title="Cloud Storage" subtitle="AWS object storage services" icon={Database}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <button
                    onClick={() => navigate('/settings/aws/storage/buckets')}
                    className="group border rounded-xl p-8 text-left hover:border-primary/50 hover:shadow-md transition-all bg-card"
                >
                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border mb-4 group-hover:bg-blue-100 transition-colors">
                        <Box className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">S3 Buckets</h3>
                    <p className="text-sm text-muted-foreground">
                        Standard S3 object storage with versioning, encryption, lifecycle policies,
                        and bucket policies.
                    </p>
                </button>

                <button
                    onClick={() => navigate('/settings/aws/storage/lightsail-buckets')}
                    className="group border rounded-xl p-8 text-left hover:border-primary/50 hover:shadow-md transition-all bg-card"
                >
                    <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border mb-4 group-hover:bg-emerald-100 transition-colors">
                        <Database className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Lightsail Buckets</h3>
                    <p className="text-sm text-muted-foreground">
                        Simplified object storage through Amazon Lightsail with bundled pricing,
                        pre-defined plans, and easy setup.
                    </p>
                </button>
            </div>
        </PageLayout>
    );
}
