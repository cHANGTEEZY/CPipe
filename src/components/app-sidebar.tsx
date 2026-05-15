import { Link, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/animate-ui/components/radix/sidebar'
import { sidebarItems, type SidebarItem } from '@/data/sidebarData'
import { ChevronDown, ChevronRight } from 'lucide-react'

function NavItem({ item }: { item: SidebarItem }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isActive = location.pathname === item.to
  const hasChildren = item.children && item.children.length > 0

  if (!hasChildren) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild isActive={isActive}>
          <Link to={item.to!}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        onClick={() => setOpen(!open)}
        className="w-full"
      >
        {item.icon && <item.icon />}
        <span>{item.title}</span>
        <span className="ml-auto">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
      </SidebarMenuSubButton>
      {open && (
        <SidebarMenuSub>
          {item.children!.map((child) => (
            <NavItem key={child.title} item={child} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuSubItem>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            AP
          </div>
          <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">Admin Panel</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                const location = useLocation()
                const isActive = location.pathname === item.to
                const hasChildren = item.children && item.children.length > 0
                if (!hasChildren) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                        <Link to={item.to!}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }
                return <MenuItemWithChildren key={item.title} item={item} />
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            JD
          </div>
          <span className="truncate group-data-[collapsible=icon]:hidden">john@example.com</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function MenuItemWithChildren({ item }: { item: SidebarItem }) {
  const location = useLocation()
  const isAnyChildActive = item.children?.some((child) => location.pathname === child.to)
  const [open, setOpen] = useState(isAnyChildActive)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setOpen(!open)}
        className="w-full"
        tooltip={item.title}
        isActive={isAnyChildActive}
      >
        {item.icon && <item.icon />}
        <span>{item.title}</span>
        <span className="ml-auto group-data-[collapsible=icon]:hidden">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {item.children!.map((child) => (
            <NavItem key={child.title} item={child} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}
