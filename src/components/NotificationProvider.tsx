import React, { useEffect, createContext, useContext } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, History, ExternalLink } from 'lucide-react';
import useNavigate from '@/libs/navigate';
import { Button } from '@/components/ui/button';

interface GitOpsNotification {
    type: 'GITOPS_CONFLICT' | 'GITOPS_SYNC_SUCCESS' | 'GITOPS_SYNC_ERROR';
    title?: string;
    message: string;
    action_url?: string;
    files?: string[];
}

const NotificationContext = createContext({});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const wsUrl = `ws://localhost:5001/ws/notifications`;

        let socket: WebSocket;
        let reconnectTimeout: any;

        const connect = () => {
            socket = new WebSocket(wsUrl);

            socket.onmessage = (event) => {
                try {
                    const data: GitOpsNotification = JSON.parse(event.data);

                    if (data.type === 'GITOPS_CONFLICT') {
                        toast.error(data.title || "Merge Conflict", {
                            description: data.message,
                            duration: 10000,
                            action: {
                                label: "Resolve Now",
                                onClick: () => navigate(data.action_url || '/settings/charts')
                            },
                            icon: <AlertCircle className="h-5 w-5 text-destructive" />
                        });
                    } else if (data.type === 'GITOPS_SYNC_SUCCESS') {
                        toast.success("Synchronization Successful", {
                            description: data.message,
                            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        });
                    } else if (data.type === 'GITOPS_SYNC_ERROR') {
                        toast.error("Synchronization Failed", {
                            description: data.message,
                            icon: <AlertCircle className="h-5 w-5 text-destructive" />
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse socket message", e);
                }
            };

            socket.onclose = () => {
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (socket) socket.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [navigate]);

    return (
        <NotificationContext.Provider value={{}}>
            {children}
        </NotificationContext.Provider>
    );
};
