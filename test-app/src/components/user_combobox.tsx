/**
 * file_description: Combobox component for selecting users from hazo_users table
 * Fetches users from API and allows selection, excluding current logged-in user
 */

"use client";

// section: imports
import * as React from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// section: types
interface UserOption {
  id: string;
  email: string;
  name: string;
  profile_picture_url: string | null;
}

interface UserComboboxProps {
  value?: string;
  onValueChange?: (userId: string, user: UserOption | null) => void;
  placeholder?: string;
  className?: string;
}

// section: component
export function UserCombobox({
  value,
  onValueChange,
  placeholder = "Select a user...",
  className,
}: UserComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [users, setUsers] = React.useState<UserOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch users on mount
  React.useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch("/api/hazo_auth/users");
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.users);
        } else {
          setError(data.error || "Failed to fetch users");
        }
      } catch (err) {
        setError("Failed to fetch users");
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Find selected user
  const selectedUser = users.find((user) => user.id === value);

  // Handle selection
  const handleSelect = (userId: string) => {
    const user = users.find((u) => u.id === userId) || null;
    const newValue = userId === value ? "" : userId;
    onValueChange?.(newValue, newValue ? user : null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a user to chat with"
          className={cn("w-[280px] justify-between", className)}
        >
          {loading ? (
            <span className="text-muted-foreground">Loading users...</span>
          ) : error ? (
            <span className="text-destructive">{error}</span>
          ) : selectedUser ? (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {selectedUser.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : error ? error : "No users found."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.name} ${user.email}`}
                  onSelect={() => handleSelect(user.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


