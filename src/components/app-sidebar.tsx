import * as React from "react";
import {
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";


import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import CustomLink from "@/libs/Link";
import { cn } from "@/libs/utils";
import { NamespaceContext } from "./kubernetes/contextProvider/NamespaceContext";
import { getMenuItems } from "@/config/menu-items";

export type MenuItem = string;

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> { }



export function AppSidebar({ ...props }: AppSidebarProps) {
  const { selectedNamespace } = React.useContext(NamespaceContext)
  const { state, setOpen } = useSidebar();
  const isHoverOpen = React.useRef(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (state === "collapsed") {
      hoverTimeoutRef.current = setTimeout(() => {
        setOpen(true);
        // isHoverOpen.current = true; // No longer needed as we don't auto-close
      }, 300); // 300ms delay
    }
  };

  // Sticky hover: No auto-minimize on leave
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // if (isHoverOpen.current) {
    //   setOpen(false);
    //   isHoverOpen.current = false;
    // }
  };

  // Track current path for active state and auto-expansion
  const [currentPath, setCurrentPath] = React.useState("");

  React.useEffect(() => {
    // Set initial path once on client side
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
      // Also listen for our custom trackNavigation event if applicable
      window.addEventListener("trackNavigation", handleLocationChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("popstate", handleLocationChange);
        window.removeEventListener("trackNavigation", handleLocationChange);
      }
    };
  }, []);

  // Track expanded state for sidebar children
  const [expandedMenus, setExpandedMenus] = React.useState<{ [key: string]: boolean }>({});

  // Menu items.
  const items = React.useMemo(() => getMenuItems(selectedNamespace), [selectedNamespace]);

  // Auto-expand parents of the active item
  React.useEffect(() => {
    const newExpandedMenus: { [key: string]: boolean } = { ...expandedMenus };
    let changed = false;

    Object.entries(items.items).forEach(([groupKey, group]) => {
      if (!group) return;
      group.childs.forEach((item) => {
        const itemKey = group.url + item.url;
        const itemFullPath = (group.url + item.url).replace(/\/\//g, '/');

        // Check if this item is the active one
        if (currentPath === itemFullPath) {
          if (!newExpandedMenus[itemKey]) {
            // No auto-expand for top level if it's the target? 
            // Actually, if it has children, we might want to expand it if a child is active.
          }
        }

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

            if ((subItem as any).items) {
              ((subItem as any).items as any[]).forEach((subSubItem) => {
                const subSubItemFullPath = (group.url + item.url + subItem.url + subSubItem.url).replace(/\/\//g, '/');
                if (currentPath === subSubItemFullPath) {
                  if (!newExpandedMenus[itemKey]) {
                    newExpandedMenus[itemKey] = true;
                    changed = true;
                  }
                  if (!newExpandedMenus[subItemKey]) {
                    newExpandedMenus[subItemKey] = true;
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
    }
  }, [currentPath, items]);

  // Toggle expand/collapse for a given menu key
  const handleToggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isItemActive = (itemPath: string, hasChildren: boolean = false) => {
    if (!itemPath) return false;
    const normalizedItemPath = itemPath.replace(/\/\//g, '/');
    if (normalizedItemPath === '/') return currentPath === '/';

    // If it's an exact match, it's definitely active
    if (currentPath === normalizedItemPath) return true;

    // If it has children, we only highlight if it's an exact match 
    // (parents shouldn't highlight if a child is active)
    if (hasChildren) return false;

    // For leaf nodes, we highlight if the path starts with the item path
    // (handles sub-routes like /edit/123 that aren't in the sidebar)
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
                                <div className="w-6 h-6 shrink-0 group-data-[collapsible=icon]:hidden" /> {/* Placeholder for alignment */}
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
                                        isActive={isItemActive(value.url + item.url + subItem.url, hasSubSubItems)}
                                        className={cn(
                                          "hover:bg-sidebar-accent transition-colors duration-200 h-auto p-2",
                                          isItemActive(value.url + item.url + subItem.url, hasSubSubItems) && "bg-sidebar-accent/60 dark:bg-sidebar-accent/30 shadow-sm"
                                        )}
                                      >
                                        <div className="flex items-center gap-1 cursor-pointer select-none w-full min-w-0">
                                          {hasSubSubItems ? (
                                            <span
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleMenu(subItemKey);
                                              }}
                                              className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
                                            >
                                              {expandedMenus[subItemKey] ? (
                                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                              ) : (
                                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                              )}
                                            </span>
                                          ) : (
                                            <div className="w-5 h-5 shrink-0" />
                                          )}
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
                                                  <SidebarMenuSubButton asChild isActive={isItemActive(value.url + item.url + subItem.url + subSubItem.url, false)} className={cn("hover:bg-sidebar-accent transition-colors duration-200 px-2 py-2.25 h-auto", isItemActive(value.url + item.url + subItem.url + subSubItem.url, false) && "bg-sidebar-accent/60 dark:bg-sidebar-accent/30 shadow-sm")}>
                                                    <CustomLink href={(value.url + item.url + subItem.url + subSubItem.url).replace(/\/\//g, '/')} className="min-w-0 overflow-hidden p-2">
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
      </Sidebar>
    </>
  );
}
