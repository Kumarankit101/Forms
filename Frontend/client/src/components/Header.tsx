import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, LogOut, User as UserIcon, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      // With JWT, we just need to remove the token from localStorage
      localStorage.removeItem('auth_token');
      
      // Call the logout endpoint (not strictly necessary with JWT, but for consistency)
      await fetch('/api/logout', {
        method: 'POST'
      });
      
      console.log("Logout successful");
      
      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <FileText className="text-primary text-2xl" />
            <h1 className="text-xl font-semibold font-heading text-primary">FormFlow</h1>
          </div>
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link href="/create">
                <Button className="hidden sm:inline-flex" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Create Form
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.name || user.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/auth">
              <Button variant="outline" size="sm">
                <UserIcon className="mr-1 h-4 w-4" /> Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};



export default Header;
