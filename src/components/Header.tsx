import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Settings, User, CreditCard, LogOut, Crown, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const { user, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  TranscribeAI
                </h1>
                <p className="text-xs text-muted-foreground">Professional Transcription</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#languages" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Languages
              </a>
            </nav>

            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  {/* User info and plan badge */}
                  <div className="hidden sm:flex items-center space-x-2">
                    <Badge variant={user.is_paid ? "default" : "secondary"}>
                      {user.is_paid ? (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          Unlimited
                        </>
                      ) : (
                        `Free (${user.usage_count}/3)`
                      )}
                    </Badge>
                  </div>
                  
                  {/* User menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="relative">
                        <User className="w-4 h-4 mr-2" />
                        {user.email.split('@')[0]}
                        {user.is_paid && (
                          <Crown className="w-3 h-3 ml-1 text-yellow-500" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.email}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.is_paid ? 'Unlimited Plan' : 'Free Plan'}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <a href="/transcribe" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          <span>Transcribe</span>
                        </a>
                      </DropdownMenuItem>
                      {!user.is_paid && (
                        <DropdownMenuItem asChild>
                          <a href="#pricing" className="cursor-pointer">
                            <Crown className="mr-2 h-4 w-4" />
                            <span>Upgrade to Unlimited</span>
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <a href="/account" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Account Settings</span>
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAuthModal(true)}
                    disabled={isLoading}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button 
                    variant="hero" 
                    size="sm"
                    onClick={() => setShowAuthModal(true)}
                    disabled={isLoading}
                  >
                    Start Free Trial
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default Header;