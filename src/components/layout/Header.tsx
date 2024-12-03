'use client'

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-semibold">
            Screenshot Tool
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="@user" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">User</p>
                  <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/settings">Account Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/support">Help & Support</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 