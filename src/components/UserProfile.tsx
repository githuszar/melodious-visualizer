
import { UserMusicData } from "@/types/spotify";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface UserProfileProps {
  userProfile: UserMusicData["userProfile"];
}

const UserProfile = ({ userProfile }: UserProfileProps) => {
  if (!userProfile) return null;
  
  return (
    <Card className="mb-8 max-w-4xl mx-auto">
      <CardHeader className="pb-2">
        <span className="text-xs font-medium text-spotify bg-spotify/10 rounded-full px-3 py-1 w-fit">Perfil do Usuário</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {userProfile.image ? (
              <AvatarImage src={userProfile.image} alt={userProfile.name} />
            ) : (
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{userProfile.name}</h2>
            <p className="text-muted-foreground">{userProfile.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
