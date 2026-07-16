import * as React from "react";
import {
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import useNavigate from "@/libs/navigate";
import { DefaultService } from "@/gingerJs_api_client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import CustomLink from "@/libs/Link";
import { cn } from "@/libs/utils";
import { NamespaceContext } from "./kubernetes/contextProvider/NamespaceContext";
import { getMenuItems, getV2MenuItems } from "@/config/menu-items";
import { toast } from "sonner";
import { getAuthToken } from "@/libs/auth";

export type MenuItem = string;

interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  picture: string | null;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> { }

export function AppSidebar({ ...props }: AppSidebarProps) {
  const { selectedNamespace } = React.useContext(NamespaceContext)
  const { state, setOpen } = useSidebar();
  const navigate = useNavigate();
  const [user, setUser] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const data = await DefaultService.apiV1AuthMeGet();
        setUser(data as UserProfile);
      } catch (error) {
        console.error("Failed to fetch user info", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await DefaultService.apiV1AuthLogoutPost();
      toast.success("Logged out successfully");
      navigate('/login');
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleMouseEnter = () => {
    if (state === "collapsed") {
      setTimeout(() => {
        setOpen(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    // No auto-minimize on leave for sticky feel
  };

  const [currentPath, setCurrentPath] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
    const handleLocationChange = () => {
      if (typeof window !== "undefined") {
        setCurrentPath(window.location.pathname);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", handleLocationChange);
      window.addEventListener("trackNavigation", handleLocationChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("popstate", handleLocationChange);
        window.removeEventListener("trackNavigation", handleLocationChange);
      }
    };
  }, []);

  const [expandedMenus, setExpandedMenus] = React.useState<{ [key: string]: boolean }>({});
  const [subExpandedMenus, setSubExpandedMenus] = React.useState<{ [key: string]: boolean }>({});
  const items = React.useMemo(() => {
    if (currentPath.startsWith('/new')) {
      return getV2MenuItems(selectedNamespace);
    }
    return getMenuItems(selectedNamespace);
  }, [currentPath, selectedNamespace]);

  React.useEffect(() => {
    const newExpandedMenus: { [key: string]: boolean } = { ...expandedMenus };
    const newSubExpandedMenus: { [key: string]: boolean } = { ...subExpandedMenus };
    let changed = false;

    Object.entries(items.items).forEach(([groupKey, group]) => {
      if (!group) return;
      group.childs.forEach((item) => {
        const itemKey = group.url + item.url;
        const itemFullPath = (group.url + item.url).replace(/\/\//g, '/');

        if (item.items) {
          item.items.forEach((subItem) => {
            const subItemKey = itemKey + subItem.url;
            const subItemFullPath = (group.url + item.url + subItem.url).replace(/\/\//g, '/');
            if (currentPath === subItemFullPath || currentPath.startsWith(subItemFullPath + '/')) {
              if (!newExpandedMenus[itemKey]) {
                newExpandedMenus[itemKey] = true;
                changed = true;
              }
            }

            if (subItem.items && subItem.items.length > 0) {
              subItem.items.forEach((subSubItem) => {
                const subSubItemFullPath = (group.url + item.url + subItem.url + subSubItem.url).replace(/\/\//g, '/');
                if (currentPath === subSubItemFullPath || currentPath.startsWith(subSubItemFullPath + '/')) {
                  if (!newExpandedMenus[itemKey]) {
                    newExpandedMenus[itemKey] = true;
                    changed = true;
                  }
                  if (!newSubExpandedMenus[subItemKey]) {
                    newSubExpandedMenus[subItemKey] = true;
                    changed = true;
                  }
                }
              });
            }
          });
        }
      });
    });

    if (changed) {
      setExpandedMenus(newExpandedMenus);
      setSubExpandedMenus(newSubExpandedMenus);
    }
  }, [currentPath, items]);

  const handleToggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleSubMenu = (key: string) => {
    setSubExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isItemActive = (itemPath: string, hasChildren: boolean = false) => {
    if (!itemPath) return false;
    const normalizedItemPath = itemPath.replace(/\/\//g, '/');
    if (normalizedItemPath === '/') return currentPath === '/';
    if (currentPath === normalizedItemPath) return true;
    if (hasChildren) return false;
    return currentPath.startsWith(normalizedItemPath + '/');
  };

  return (
    <>
      <Sidebar
        collapsible="icon"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent transition-colors duration-200 group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!w-full">
                <CustomLink href={items.header.url}>
                  <span className="bg-gradient-to-br from-primary to-purple-600 p-1 rounded-lg flex items-center justify-center shadow-md">
                    <items.header.icon className="h-5 w-5 text-white" />
                  </span>
                  <span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:opacity-0 transition-opacity">{items.header.title}</span>
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
                <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:!mt-0 transition-opacity">{value.title}</SidebarGroupLabel>
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
                              isActive={isItemActive(value.url + item.url, hasSubItems)}
                              className={cn(
                                "hover:bg-sidebar-accent transition-colors duration-200 group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!w-full h-auto p-2",
                                isItemActive(value.url + item.url, hasSubItems) && "bg-sidebar-accent/80 dark:bg-sidebar-accent/40 shadow-sm"
                              )}
                            >
                              <div className="flex items-center gap-1 cursor-pointer select-none w-full min-w-0">
                                <span
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleToggleMenu(menuKey);
                                  }}
                                  className="p-1 rounded-md hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:hidden"
                                >
                                  {expandedMenus[menuKey] ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </span>
                                <CustomLink
                                  key={menuKey}
                                  href={value.url + item.url}
                                  className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
                                >
                                  <span
                                    className="bg-sidebar-accent p-1.5 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:bg-primary/10 flex-shrink-0"
                                  >
                                    <item.icon className="h-5 w-5 text-sidebar-foreground" />
                                  </span>
                                  <span className="font-medium text-sidebar-foreground truncate group-data-[collapsible=icon]:opacity-0 transition-opacity">
                                    {item.title}
                                  </span>
                                </CustomLink>
                              </div>
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton
                              asChild
                              isActive={isItemActive(value.url + item.url, hasSubItems)}
                              className={cn(
                                "hover:bg-sidebar-accent transition-colors duration-200 group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!w-full h-auto p-2",
                                isItemActive(value.url + item.url, hasSubItems) && "bg-sidebar-accent/80 dark:bg-sidebar-accent/40 shadow-sm"
                              )}
                            >
                              <div className="flex items-center gap-1 w-full min-w-0">
                                <div className="w-6 h-6 shrink-0 group-data-[collapsible=icon]:hidden" />
                                <CustomLink
                                  key={menuKey}
                                  href={value.url + item.url}
                                  className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
                                >
                                  <span className="bg-sidebar-accent p-1.5 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-primary/10 flex-shrink-0">
                                    <item.icon className="h-5 w-5 text-sidebar-foreground" />
                                  </span>
                                  <span className="font-medium text-sidebar-foreground truncate group-data-[collapsible=icon]:opacity-0 transition-opacity">
                                    {item.title}
                                  </span>
                                </CustomLink>
                              </div>
                            </SidebarMenuButton>
                          )}
                          {hasSubItems && (
                            <div className={`overflow-hidden transition-all duration-300 ${expandedMenus[menuKey] ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
                              <SidebarMenuSub>
                                {item.items.map((subItem) => {
                                  if (!subItem) return null;
                                  const subItemKey = menuKey + subItem.url;
                                  const hasSubSubItems = subItem.items && subItem.items.length > 0;
                                  return (
                                    <SidebarMenuSubItem key={subItemKey}>
                                      {hasSubSubItems ? (
                                        <>
                                          <SidebarMenuSubButton
                                            asChild
                                            isActive={isItemActive(value.url + item.url + subItem.url, hasSubSubItems)}
                                            className={cn("hover:bg-sidebar-accent transition-colors duration-200 h-auto p-2", isItemActive(value.url + item.url + subItem.url, hasSubSubItems) && "bg-sidebar-accent/60 dark:bg-sidebar-accent/30 shadow-sm")}
                                          >
                                            <div className="flex items-center gap-1 cursor-pointer select-none w-full min-w-0">
                                              <span
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleToggleSubMenu(subItemKey);
                                                }}
                                                className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
                                              >
                                                {subExpandedMenus[subItemKey] ? (
                                                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                                ) : (
                                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                                )}
                                              </span>
                                              <CustomLink key={subItemKey} href={(value.url + item.url + subItem.url).replace(/\/\//g, '/')} className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                                <span className="bg-sidebar-accent/50 p-1 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-primary/10 flex-shrink-0">
                                                  {subItem.icon && <subItem.icon className="h-4 w-4 text-muted-foreground" />}
                                                </span>
                                                <span className="text-sm text-sidebar-foreground truncate">{subItem.title}</span>
                                              </CustomLink>
                                            </div>
                                          </SidebarMenuSubButton>
                                          <div className={`overflow-hidden transition-all duration-300 ${subExpandedMenus[subItemKey] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
                                            <SidebarMenuSub className="ml-2">
                                              {subItem.items.map((subSubItem) => {
                                                if (!subSubItem) return null;
                                                const subSubItemKey = subItemKey + subSubItem.url;
                                                const subSubItemFullPath = (value.url + item.url + subItem.url + subSubItem.url).replace(/\/\//g, '/');
                                                return (
                                                  <SidebarMenuSubItem key={subSubItemKey}>
                                                    <SidebarMenuSubButton
                                                      asChild
                                                      size="sm"
                                                      isActive={isItemActive(subSubItemFullPath, false)}
                                                      className={cn("hover:bg-sidebar-accent transition-colors duration-200 h-auto p-1.5 pl-6", isItemActive(subSubItemFullPath, false) && "bg-sidebar-accent/60 dark:bg-sidebar-accent/30 shadow-sm")}
                                                    >
                                                      <div className="flex items-center gap-1 cursor-pointer select-none w-full min-w-0">
                                                        <div className="w-4 h-4 shrink-0" />
                                                        <CustomLink key={subSubItemKey} href={subSubItemFullPath} className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                                          <span className="bg-sidebar-accent/30 p-0.5 rounded-sm flex items-center justify-center transition-all duration-200 hover:bg-primary/10 flex-shrink-0">
                                                            {subSubItem.icon && <subSubItem.icon className="h-4 w-4 text-muted-foreground" />}
                                                          </span>
                                                          <span className="text-sm text-sidebar-foreground truncate">{subSubItem.title}</span>
                                                        </CustomLink>
                                                      </div>
                                                    </SidebarMenuSubButton>
                                                  </SidebarMenuSubItem>
                                                );
                                              })}
                                            </SidebarMenuSub>
                                          </div>
                                        </>
                                      ) : (
                                        <SidebarMenuSubButton asChild isActive={isItemActive(value.url + item.url + subItem.url, false)} className={cn("hover:bg-sidebar-accent transition-colors duration-200 h-auto p-2", isItemActive(value.url + item.url + subItem.url, false) && "bg-sidebar-accent/60 dark:bg-sidebar-accent/30 shadow-sm")}>
                                          <div className="flex items-center gap-1 cursor-pointer select-none w-full min-w-0">
                                            <div className="w-5 h-5 shrink-0" />
                                            <CustomLink key={subItemKey} href={(value.url + item.url + subItem.url).replace(/\/\//g, '/')} className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                              <span className="bg-sidebar-accent/50 p-1 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-primary/10 flex-shrink-0">
                                                {subItem.icon && <subItem.icon className="h-4 w-4 text-muted-foreground" />}
                                              </span>
                                              <span className="text-sm text-sidebar-foreground truncate">{subItem.title}</span>
                                            </CustomLink>
                                          </div>
                                        </SidebarMenuSubButton>
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
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    {user?.picture ? (
                      <img src={user.picture} alt="profile" className="size-8 rounded-full" />
                    ) : (
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold">{user?.full_name || 'K1W1 User'}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                    <ChevronRight className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="right"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      {user?.picture ? (
                        <img src={user.picture} alt="profile" className="size-8 rounded-full" />
                      ) : (
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.full_name || 'K1W1 User'}</span>
                        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
