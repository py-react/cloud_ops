import * as React from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { getMenuItems } from "@/config/menu-items";
import { useNavigate } from "react-router-dom";
import { FileIcon, LaptopIcon, MoonIcon, SunIcon } from "lucide-react"

export function CommandCenter() {
    const [open, setOpen] = React.useState(false);
    const { selectedNamespace } = React.useContext(NamespaceContext);
    const navigate = useNavigate();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "1" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    const menuItems = React.useMemo(() => getMenuItems(selectedNamespace), [selectedNamespace]);

    // Flatten the menu items for the command palette
    const flatItems = React.useMemo(() => {
        const items: {
            group: string;
            title: string;
            url: string;
            icon?: React.ElementType;
        }[] = [];

        // Add Dashboard
        items.push({
            group: "General",
            title: menuItems.header.title,
            url: menuItems.header.url,
            icon: menuItems.header.icon,
        });

        // Process other groups
        Object.values(menuItems.items).forEach((section: any) => {
            section.childs.forEach((child: any) => {
                const groupName = section.title;

                // Process nested items
                if (child.items && child.items.length > 0) {
                    child.items.forEach((subItem: any) => {
                        // Add the item itself (Level 2) (e.g. Source Control)
                        items.push({
                            group: `${groupName} > ${child.title}`,
                            title: subItem.title,
                            url: (section.url + child.url + subItem.url).replace(/\/\//g, '/'),
                            icon: subItem.icon,
                        });

                        // Process 3rd level items (e.g. PATs)
                        if (subItem.items && subItem.items.length > 0) {
                            subItem.items.forEach((deepItem: any) => {
                                items.push({
                                    group: `${groupName} > ${child.title} > ${subItem.title}`,
                                    title: deepItem.title,
                                    url: (section.url + child.url + subItem.url + deepItem.url).replace(/\/\//g, '/'),
                                    icon: deepItem.icon,
                                });
                            })
                        }
                    });
                }
            });
        });

        return items;
    }, [menuItems]);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                    {flatItems.map((item, index) => (
                        <CommandItem
                            key={`${item.url}-${index}`}
                            value={`${item.group} ${item.title}`}
                            onSelect={() => {
                                runCommand(() => navigate(item.url));
                            }}
                        >
                            {item.icon ? (
                                <item.icon className="mr-2 h-4 w-4" />
                            ) : (
                                <FileIcon className="mr-2 h-4 w-4" />
                            )}
                            <span>{item.title}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                                {item.group}
                            </span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
