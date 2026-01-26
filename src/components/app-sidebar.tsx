import * as React from "react";
import {
  LayoutDashboard,
  DockIcon as Docker,
  Box,
  Database,
  Network,
  Cpu,
  Server,
  ChevronLeft,
  ChevronRight,
  Computer,
  BoxIcon,
  ShieldIcon,
  HandCoinsIcon,
  FileKeyIcon,
  BadgeIcon as Certificate,
  WaypointsIcon,
  NetworkIcon,
  RocketIcon,
  ListIcon,
  Layers,
  Settings,
  Users,
  Globe,
  Folder,
  Plug,
  Cog,
  FileCog,
  Unplug,
  Orbit,
  ChevronDown,
  ChevronUp,
  Book,
  Activity,
  Zap,
  Calendar,
  Container,
  Boxes,
  SquareTerminal,
  Braces,
  Layout
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import CustomLink from "@/libs/Link";
import { ShuffleIcon } from "@radix-ui/react-icons";
import { NamespaceContext } from "./kubernetes/contextProvider/NamespaceContext";

export type MenuItem = string;

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> { }

function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  return (
    <SidebarTrigger
      onClick={toggleSidebar}
      className="absolute right-[-12px] top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
    >
      {state === "expanded" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </SidebarTrigger>
  );
}


export function AppSidebar({ ...props }: AppSidebarProps) {
  const { selectedNamespace } = React.useContext(NamespaceContext)

  // Track expanded state for sidebar children
  const [expandedMenus, setExpandedMenus] = React.useState<{ [key: string]: boolean }>({});

  // Toggle expand/collapse for a given menu key
  const handleToggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Menu items.
  const items = {
    header: {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    items: {
      // message_queue: {
      //   title: "Message Queues",
      //   url: "/queues",
      //   childs: [
      //     {
      //       title: "BullMQ Queues",
      //       url: "/",
      //       // icon: MessageSquare,
      //       items: [],
      //     },
      //   ],
      // },
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
              // {
              //   title: "Flow",
              //   url: `/${selectedNamespace}/flow`,
              //   icon: Share2Icon,
              // },
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
              // {
              //   title: "certificate",
              //   url: `/${selectedNamespace}/certificates`,
              //   icon: Certificate,
              // },
              // {
              //   title: "issuer",
              //   url: `/${selectedNamespace}/issuers`,
              //   icon: HandCoinsIcon,
              // },
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
            icon: Cpu,
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
              {
                title: "Resource Quota",
                url: "/resource-quota",
                icon: Settings,
              },
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
                items: [
                ],
              },
              {
                title: "Strategies",
                url: "/release_strategies",
                icon: Orbit,
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
                title: "Registry",
                url: "/registry",
                icon: Computer,
                items: [],
              },
            ],
          },
        ]
      },
      library: {
        title: "CI/CD Library",
        url: "/settings/ci_cd/library",
        color: "blue",
        childs: [
          {
            title: "Spec",
            icon: Braces,
            url: "",
            items: [
              {
                title: "Derived Container",
                url: `/${selectedNamespace}/spec/container`,
                icon: SquareTerminal,
                items: [
                  {
                    title: "Specifications",
                    url: `/profile`,
                    icon: Braces,
                  },
                ]
              },
              {
                title: "Derived Pods",
                url: `/${selectedNamespace}/spec/pod`,
                icon: Box,
                items: [
                  {
                    title: "Specifications",
                    url: `/profile`,
                    icon: Settings,
                  },
                  {
                    title: "Metadata",
                    url: `/metadata`,
                    icon: Layout,
                  },
                ]
              },
              {
                title: "Deployment spec",
                url: `/${selectedNamespace}/spec/deployment`,
                icon: Layers,
                items: []
              },
            ]
          },

        ]
      },

      infraManager: {
        title: "Infra",
        url: "/infra",
        color: "purple",
        childs: [
          {
            title: "Manager",
            url: "/manager",
            icon: WaypointsIcon,
            items: [],
          },
        ],
      },
    },
  };

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent transition-colors duration-200">
                <CustomLink href={items.header.url}>
                  <span className="bg-gradient-to-br from-primary to-purple-600 p-2 rounded-lg flex items-center justify-center shadow-md">
                    <items.header.icon className="h-5 w-5 text-white" />
                  </span>
                  <span className="font-semibold text-sidebar-foreground">{items.header.title}</span>
                </CustomLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {Object.entries(items.items).map(([valueKey, value]) => {
            if (!value) return null;
            return (
              <SidebarGroup key={value.url}>
                <SidebarGroupLabel>{value.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu >
                    {value.childs.map((item) => {
                      const hasSubItems = item.items && item.items.length > 0;
                      const menuKey = value.url + item.url;
                      return (
                        <SidebarMenuItem key={menuKey}>
                          {hasSubItems ? (
                            <SidebarMenuButton
                              asChild
                              className="hover:bg-sidebar-accent transition-colors duration-200"
                            >
                              <div className="flex items-center gap-2 cursor-pointer select-none w-full min-w-0">
                                <CustomLink
                                  key={menuKey}
                                  href={value.url + item.url}
                                  className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
                                >
                                  <span
                                    className="bg-sidebar-accent p-1.5 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:bg-primary/10 flex-shrink-0"
                                  >
                                    <item.icon className="h-4 w-4 text-sidebar-foreground" />
                                  </span>
                                  <span className="font-medium text-sidebar-foreground truncate">
                                    {item.title}
                                  </span>
                                </CustomLink>
                                <span onClick={() => handleToggleMenu(menuKey)} className="ml-auto p-1 rounded-md hover:bg-sidebar-accent transition-colors">
                                  {expandedMenus[menuKey] ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </span>
                              </div>
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton
                              asChild
                              className="hover:bg-sidebar-accent transition-colors duration-200"
                            >
                              <CustomLink
                                key={menuKey}
                                href={value.url + item.url}
                                className="flex items-center gap-2 min-w-0 overflow-hidden"
                              >
                                <span className="bg-sidebar-accent p-1.5 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-primary/10 flex-shrink-0">
                                  <item.icon className="h-4 w-4 text-sidebar-foreground" />
                                </span>
                                <span className="font-medium text-sidebar-foreground truncate">
                                  {item.title}
                                </span>
                              </CustomLink>
                            </SidebarMenuButton>
                          )}
                          {hasSubItems && (
                            <div
                              className={`overflow-hidden transition-all duration-300 ${expandedMenus[menuKey]
                                ? "max-h-[1000px] opacity-100 mt-2"
                                : "max-h-0 opacity-0 pointer-events-none"
                                }`}
                            >
                              <SidebarMenuSub>
                                {item.items.map((subItem) => {
                                  if (!subItem) return null;
                                  const subItemKey = menuKey + subItem.url;
                                  const hasSubSubItems = (subItem as any).items && (subItem as any).items.length > 0;

                                  return (
                                    <SidebarMenuSubItem
                                      key={subItemKey}
                                    >
                                      <SidebarMenuSubButton
                                        asChild
                                        className="hover:bg-sidebar-accent transition-colors duration-200"
                                      >
                                        <div className="flex items-center gap-2 cursor-pointer select-none w-full min-w-0">
                                          <CustomLink
                                            key={subItemKey}
                                            href={(value.url + item.url + subItem.url).replace(/\/\//g, '/')}
                                            className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
                                          >
                                            <span className="bg-sidebar-accent/50 p-1 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-primary/10 flex-shrink-0">
                                              {subItem.icon && <subItem.icon className="h-4 w-4 text-muted-foreground" />}
                                            </span>
                                            <span className="text-sm text-sidebar-foreground truncate">{subItem.title}</span>
                                          </CustomLink>
                                          {hasSubSubItems && (
                                            <span
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleMenu(subItemKey);
                                              }}
                                              className="ml-auto p-1 rounded-md hover:bg-sidebar-accent transition-colors"
                                            >
                                              {expandedMenus[subItemKey] ? (
                                                <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                              ) : (
                                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      </SidebarMenuSubButton>

                                      {hasSubSubItems && (
                                        <div
                                          className={`overflow-hidden transition-all duration-300 ${expandedMenus[subItemKey]
                                            ? "max-h-96 opacity-100 mt-1 ml-4"
                                            : "max-h-0 opacity-0 pointer-events-none"
                                            }`}
                                        >
                                          <SidebarMenuSub>
                                            {((subItem as any).items as any[]).map((subSubItem: any) => {
                                              const subSubItemKey = subItemKey + subSubItem.url;
                                              return (
                                                <SidebarMenuSubItem key={subSubItemKey}>
                                                  <SidebarMenuSubButton asChild className="hover:bg-sidebar-accent transition-colors duration-200 px-2 py-1.5 h-auto">
                                                    <CustomLink href={(value.url + item.url + subItem.url + subSubItem.url).replace(/\/\//g, '/')} className="min-w-0 overflow-hidden">
                                                      <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                                                        <span className="text-sm text-sidebar-foreground/90 font-normal truncate">{subSubItem.title}</span>
                                                      </div>
                                                    </CustomLink>
                                                  </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                              );
                                            })}
                                          </SidebarMenuSub>
                                        </div>
                                      )}
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </div>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
        <SidebarToggle />
      </Sidebar>
    </>
  );
}
