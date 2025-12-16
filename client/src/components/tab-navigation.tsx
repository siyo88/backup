import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "main", path: "/", color: "theme-pink" },
  { name: "me", path: "/me", color: "theme-pink" },
  { name: "follower1", path: "/follower1", color: "theme-blue" },
  { name: "follower2", path: "/follower2", color: "theme-purple" },
];

const colorClasses: Record<string, { active: string; underline: string }> = {
  "theme-pink": {
    active: "text-theme-pink",
    underline: "bg-theme-pink",
  },
  "theme-blue": {
    active: "text-theme-blue",
    underline: "bg-theme-blue",
  },
  "theme-purple": {
    active: "text-theme-purple",
    underline: "bg-theme-purple",
  },
};

export default function TabNavigation() {
  const [location] = useLocation();

  return (
    <nav className="w-full bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-center gap-8">
          {tabs.map((tab) => {
            const isActive = location === tab.path;
            const colors = colorClasses[tab.color];

            return (
              <Link key={tab.path} href={tab.path}>
                <button
                  className={cn(
                    "relative py-4 px-2 text-base font-medium transition-colors",
                    isActive ? colors.active : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`tab-${tab.name}`}
                >
                  {tab.name}
                  {isActive && (
                    <span
                      className={cn(
                        "absolute bottom-0 left-0 right-0 h-1 rounded-t-full",
                        colors.underline
                      )}
                    />
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
