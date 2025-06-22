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
  Unplug
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

export type MenuItem = string;

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

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
    //       icon: MessageSquare,
    //       items: [],
    //     },
    //   ],
    // },
    docker: {
      title: "Docker",
      url: "/docker",
      childs: [
        {
          title: "Overview",
          url: "/",
          icon: Docker,
          items: [
            {
              title: "Conatiner",
              url: "container",
              icon: Server,
            },
            {
              title: "Packages",
              url: "packages",
              icon: Box,
            },
            {
              title: "Storages",
              url: "storages",
              icon: Database,
            },
            {
              title: "Network",
              url: "network",
              icon: NetworkIcon,
            },
            {
              title: "Hub",
              url: "hub",
              icon: Computer,
            },
          ],
        },
      ],
    },
    orchestration: {
      title: "Orchestration",
      url: "/orchestration",
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
              url: "/namespaced/resources",
              icon: ListIcon,
            },
            // {
            //   title: "Flow",
            //   url: "/namespaced/flow",
            //   icon: Share2Icon,
            // },
            {
              title: "Deployment",
              url: "/namespaced/deployments",
              icon: RocketIcon,
            },
            {
              title: "Config Map",
              url: "/namespaced/configmaps",
              icon: ShieldIcon,
            },
            {
              title: "Pods",
              url: "/namespaced/pods",
              icon: BoxIcon,
            },
            {
              title: "Secrets",
              url: "/namespaced/secrets",
              icon: FileKeyIcon,
            },
            {
              title: "Services",
              url: "/namespaced/services",
              icon: NetworkIcon,
            },
            {
              title: "Ingress",
              url: "/namespaced/ingresses",
              icon: Globe,
            },
            {
              title: "certificate",
              url: "/namespaced/certificates",
              icon: Certificate,
            },
            {
              title: "issuer",
              url: "/namespaced/issuers",
              icon: HandCoinsIcon,
            },
          ],
        },
      ],
    },
    settings:{
      title: "Control Center",
      url: "/settings",
      childs:[
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
              url: "/source_control_settings",
              icon: Unplug,
              items: [],
            },
            {
              title: "Release Config",
              url: "/release_config",
              icon: FileCog,
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
    infraManager: {
      title: "Infra",
      url: "/infra",
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

export function AppSidebar({ ...props }: AppSidebarProps) {
  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <CustomLink href={items.header.url}>
                  <items.header.icon className="h-6 w-6" />
                  <span className="font-semibold">{items.header.title}</span>
                </CustomLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {Object.values(items.items).map((value) => {
            if (!value) return null;
            return (
              <SidebarGroup key={value.url}>
                <SidebarGroupLabel>{value.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {value.childs.map((item) => {
                      return (
                        <SidebarMenuItem key={value.url + item.url}>
                          <SidebarMenuButton asChild>
                            <CustomLink key={value.url + item.url} href={value.url + item.url}>
                              <item.icon />
                              <span>{item.title}</span>
                            </CustomLink>
                          </SidebarMenuButton>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => {
                              if (!subItem) return null;
                              return (
                                <SidebarMenuSubItem key={value.url + item.url + subItem.url}>
                                  <SidebarMenuSubButton asChild>
                                    <CustomLink key={value.url + item.url + subItem.url} href={value.url + item.url + subItem.url}>
                                      <subItem.icon className="mr-2 h-4 w-4" />
                                      {subItem.title}
                                    </CustomLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
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
