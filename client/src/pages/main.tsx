import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ArrowRight } from "lucide-react";
import type { Member } from "@shared/schema";

const themeColors: Record<string, string> = {
  pink: "border-theme-pink",
  blue: "border-theme-blue",
  purple: "border-theme-purple",
};

const themeBgColors: Record<string, string> = {
  pink: "bg-theme-pink",
  blue: "bg-theme-blue",
  purple: "bg-theme-purple",
};

export default function MainPage() {
  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 
            className="font-bold text-foreground leading-tight"
            style={{ fontSize: "40px" }}
            data-testid="text-main-title"
          >
            The great me and The follower
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {members?.map((member) => (
            <Card 
              key={member.id}
              className={`overflow-visible rounded-2xl border-4 ${themeColors[member.themeColor] || "border-border"} transition-all duration-200 hover-elevate`}
              data-testid={`card-member-${member.slug}`}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Avatar className={`w-28 h-28 border-4 ${themeColors[member.themeColor] || "border-border"} mb-4`}>
                  {member.profileImage ? (
                    <AvatarImage src={member.profileImage} alt={member.name} />
                  ) : null}
                  <AvatarFallback className="bg-muted">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>

                <h2 className="text-xl font-semibold text-foreground mb-2" data-testid={`text-member-name-${member.slug}`}>
                  {member.name}
                </h2>

                {member.memo ? (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3" data-testid={`text-member-memo-${member.slug}`}>
                    {member.memo}
                  </p>
                ) : (
                  <p className="text-muted-foreground/50 text-sm mb-4 italic">
                    No memo yet
                  </p>
                )}

                <Link href={`/${member.slug}`}>
                  <Button 
                    className={`${themeBgColors[member.themeColor] || "bg-primary"} text-white rounded-full px-6`}
                    data-testid={`button-view-board-${member.slug}`}
                  >
                    View Board
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
