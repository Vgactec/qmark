import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Menu } from "lucide-react";
import type { User } from "@shared/schema";

interface DashboardHeaderProps {
  user: User;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "US";
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">QMARK</span>
            </div>
            <span className="hidden sm:block text-sm text-neutral-600">|</span>
            <span className="hidden sm:block text-sm text-neutral-600">MicroInFortal</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-neutral-700 hover:text-primary font-medium">Dashboard</a>
            <a href="#" className="text-neutral-700 hover:text-primary font-medium">Automações</a>
            <a href="#" className="text-neutral-700 hover:text-primary font-medium">Conexões</a>
            <a href="#" className="text-neutral-700 hover:text-primary font-medium">Relatórios</a>
            <a href="#" className="text-neutral-700 hover:text-primary font-medium">Suporte</a>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
            </Button>
            
            {/* User Avatar */}
            <div className="relative flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={user.profileImageUrl || undefined} 
                  alt="Foto do perfil" 
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-neutral-900">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                  }
                </div>
                <div className="text-xs text-neutral-600">
                  Micro-empreendedor
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
