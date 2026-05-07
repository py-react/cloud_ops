import {
    LayoutDashboard,
    DockIcon as Docker,
    Box,
    Database,
    Network,
    Cpu,
    Server,
    Computer,
    BoxIcon,
    ShieldIcon,
    FileKeyIcon,
    NetworkIcon,
    RocketIcon,
    ListIcon,
    Layers,
    Settings,
    Users,
    Globe,
    Folder,
    Cog,
    FileCog,
    Unplug,
    Orbit,
    WaypointsIcon,
    SquareTerminal,
    Target,
    Braces,
    Layout,
    Key,
    Activity,
    AlertCircle,
    FileText,
} from "lucide-react";

export const getMenuItems = (selectedNamespace: string = "default") => ({
    header: {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
    },
    items: {
        queues: {
            title: "queues",
            url: "/",
            childs: [
                {
                    title: "queues",
                    url: "queues",
                    icon: Activity,
                    items: [],
                },
            ]
        },
        docker: {
            title: "CEE", // container excecution engine
            url: "/cee",
            color: "blue",
            childs: [
                {
                    title: "Docker",
                    url: "/docker",
                    icon: Docker,
                    items: [
                        {
                            title: "Conatiner",
                            url: "/container",
                            icon: Server,
                        },
                        {
                            title: "Packages",
                            url: "/packages",
                            icon: Box,
                        },
                        {
                            title: "Storages",
                            url: "/storages",
                            icon: Database,
                        },
                        {
                            title: "Network",
                            url: "/network",
                            icon: NetworkIcon,
                        },
                        {
                            title: "Hub",
                            url: "/hub",
                            icon: Computer,
                        },

                    ],
                },
            ],
        },
        orchestration: {
            title: "Orchestration",
            url: "/orchestration",
            color: "green",
            childs: [
                {
                    title: "Docker Swarms",
                    url: "/swarms",
                    icon: Network,
                    items: [],
                },
                {
                    title: "Kubernetes",
                    url: "/kubernetes",
                    icon: Cpu,
                    items: [
                        {
                            title: "Resources",
                            url: `/${selectedNamespace}/resources`,
                            icon: ListIcon,
                        },
                        {
                            title: "Deployment",
                            url: `/${selectedNamespace}/deployments`,
                            icon: RocketIcon,
                        },
                        {
                            title: "Config Map",
                            url: `/${selectedNamespace}/configmaps`,
                            icon: ShieldIcon,
                        },
                        {
                            title: "Pods",
                            url: `/${selectedNamespace}/pods`,
                            icon: BoxIcon,
                        },
                        {
                            title: "Secrets",
                            url: `/${selectedNamespace}/secrets`,
                            icon: FileKeyIcon,
                        },
                        {
                            title: "Services",
                            url: `/${selectedNamespace}/services`,
                            icon: NetworkIcon,
                        },
                        {
                            title: "Ingress",
                            url: `/${selectedNamespace}/ingresses`,
                            icon: Globe,
                        },

                    ],
                },
            ],
        },
        settings: {
            title: "Control Center",
            url: "/settings",
            color: "yellow",
            childs: [
                {
                    title: "Kubernetes",
                    url: "/kubernetes",
                    icon: Layout,
                    items: [
                        {
                            title: "Contexts",
                            url: "/contexts",
                            icon: Layers,
                        },
                        {
                            title: "Namespaces",
                            url: "/namespaces",
                            icon: Folder,
                        },
                        // {
                        //     title: "Resource Quota",
                        //     url: "/resource-quota",
                        //     icon: Settings,
                        // },
                        {
                            title: "Users and RBAC",
                            url: "/rbac",
                            icon: Users,
                        },
                    ],
                },
                {
                    title: "CI/CD",
                    url: "/ci_cd",
                    icon: Cog,
                    items: [
                        {
                            title: "Source Control",
                            url: "/source_control",
                            icon: Unplug,
                            items: [],
                        },
                        {
                            title: "Release Config",
                            url: "/release_config",
                            icon: FileCog,
                            items: [],
                        },
                        {
                            title: "Strategies",
                            url: "/release_strategies",
                            icon: Orbit,
                            items: [],
                        },
                        {
                            title: "Release Control",
                            url: "/release_control",
                            icon: RocketIcon,
                            items: [],
                        },
                    ],
                },
                {
                    title: "Docker",
                    url: "/docker",
                    icon: Docker,
                    items: [
                        {
                            title: "Config",
                            url: "/config",
                            icon: Settings,
                        },
                        {
                            title: "Image Registry",
                            url: "/registry",
                            icon: Folder,
                        },
                    ],
                },
                {
                    title: "Charts",
                    url: "/charts",
                    icon: Box,
                    items: [],
                },
                {
                    title: "Credentials Hub",
                    url: "/credentials",
                    icon: Key,
                    items: [],
                },
            ],
        },
        bastion: {
            title: "Bastion",
            url: "/bastion",
            color: "green",
            childs: [
                {
                    title: "Systems",
                    url: "/systems",
                    icon: Server,
                },
                {
                    title: "SSH Keys",
                    url: "/keys",
                    icon: Key,
                },
                {
                    title: "Audit Logs",
                    url: "/audit",
                    icon: Activity,
                },
            ],
        },
        library: {
            title: "Library",
            url: "/settings/ci_cd/library",
            color: "blue",
            childs: [
                {
                    title: "Charts",
                    url: "",
                    icon: Box,
                    items: [],
                },
            ],
        },
        productionEssentials: {
            title: "Add-ons",
            url: "/addons",
            color: "orange",
            childs: [
                {
                    title: "Essentials",
                    url: "/essentials",
                    icon: LayoutDashboard,
                    items: [
                    ],
                },
            ],
        },
        // infraManager: {
        //     title: "Infra",
        //     url: "/infra",
        //     color: "purple",
        //     childs: [
        //         {
        //             title: "Manager",
        //             url: "/manager",
        //             icon: WaypointsIcon,
        //             items: [],
        //         },
        //     ],
        // },
    },
});
