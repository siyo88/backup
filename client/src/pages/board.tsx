import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, Paintbrush, User, MessageCircle, Send, Camera, Save, X } from "lucide-react";
import type { Member, Image, Comment, ImageWithComments } from "@shared/schema";
import PaintTool from "@/components/paint-tool";

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

export default function BoardPage() {
  const [, params] = useRoute("/:slug");
  const slug = (params?.slug || "").replace(/^\//, "");
  const { toast } = useToast();

  const [paintDialogOpen, setPaintDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageWithComments | null>(null);
  const [commentText, setCommentText] = useState("");
  const [memoText, setMemoText] = useState("");
  const [authorName, setAuthorName] = useState("");

  const { data: member, isLoading: memberLoading } = useQuery<Member>({
    queryKey: ["/api/members", slug],
    enabled: !!slug,
  });

  const { data: images, isLoading: imagesLoading } = useQuery<ImageWithComments[]>({
    queryKey: ["/api/images", slug],
    enabled: !!slug,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("memberId", member?.id || "");
      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images", slug] });
      toast({ title: "Image uploaded successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to upload image", variant: "destructive" });
    },
  });

  const uploadProfileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(`/api/members/${member?.id}/profile`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members", slug] });
      toast({ title: "Profile updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const updateMemoMutation = useMutation({
    mutationFn: async (memo: string) => {
      return apiRequest("PATCH", `/api/members/${member?.id}`, { memo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members", slug] });
      setProfileDialogOpen(false);
      toast({ title: "Memo updated!" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ imageId, author, content }: { imageId: string; author: string; content: string }) => {
      return apiRequest("POST", "/api/comments", { imageId, author, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images", slug] });
      setCommentText("");
      toast({ title: "Comment added!" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadProfileMutation.mutate(file);
    }
  };

  const handlePaintSave = async (blob: Blob) => {
    const file = new File([blob], "painting.png", { type: "image/png" });
    uploadMutation.mutate(file);
    setPaintDialogOpen(false);
  };

  const handleAddComment = () => {
    if (!selectedImage || !commentText.trim()) return;
    const author = authorName.trim() || "Anonymous";
    commentMutation.mutate({
      imageId: selectedImage.id,
      author,
      content: commentText.trim(),
    });
  };

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-48 rounded-2xl mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Member not found</p>
      </div>
    );
  }

  const themeColor = member.themeColor || "pink";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Card className={`rounded-2xl border-4 ${themeColors[themeColor]} mb-8 overflow-visible`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                <DialogTrigger asChild>
                  <button 
                    className="relative group cursor-pointer"
                    data-testid="button-edit-profile"
                    onClick={() => setMemoText(member.memo || "")}
                  >
                    <Avatar className={`w-24 h-24 border-4 ${themeColors[themeColor]}`}>
                      {member.profileImage ? (
                        <AvatarImage src={member.profileImage} alt={member.name} />
                      ) : null}
                      <AvatarFallback className="bg-muted">
                        <User className="w-10 h-10 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Profile Picture
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileUpload}
                        className="cursor-pointer"
                        data-testid="input-profile-image"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Memo
                      </label>
                      <Textarea
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        placeholder="Write a short memo about yourself..."
                        className="resize-none"
                        rows={4}
                        data-testid="input-memo"
                      />
                    </div>
                    <Button
                      onClick={() => updateMemoMutation.mutate(memoText)}
                      disabled={updateMemoMutation.isPending}
                      className={`w-full ${themeBgColors[themeColor]} text-white`}
                      data-testid="button-save-memo"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-board-title">
                  {member.name}'s Board
                </h1>
                {member.memo && (
                  <p className="text-muted-foreground" data-testid="text-board-memo">
                    {member.memo}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    data-testid="input-upload-image"
                  />
                  <Button
                    asChild
                    className={`${themeBgColors[themeColor]} text-white rounded-full cursor-pointer`}
                  >
                    <span data-testid="button-upload-image">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                </label>

                <Dialog open={paintDialogOpen} onOpenChange={setPaintDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className={`rounded-full border-2 ${themeColors[themeColor]}`}
                      data-testid="button-open-paint"
                    >
                      <Paintbrush className="w-4 h-4 mr-2" />
                      Paint
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden" aria-describedby={undefined}>
                    <DialogHeader className="sr-only">
                      <DialogTitle>Paint Tool</DialogTitle>
                    </DialogHeader>
                    <PaintTool onSave={handlePaintSave} onClose={() => setPaintDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {imagesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Dialog key={image.id}>
                <DialogTrigger asChild>
                  <Card 
                    className="overflow-hidden rounded-xl cursor-pointer hover-elevate group"
                    onClick={() => setSelectedImage(image)}
                    data-testid={`card-image-${image.id}`}
                  >
                    <div className="relative aspect-square">
                      <img
                        src={`/uploads/${image.filename}`}
                        alt={image.originalFilename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <div className={`${themeBgColors[themeColor]} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1`}>
                          <MessageCircle className="w-3 h-3" />
                          {image.comments?.length || 0}
                        </div>
                      </div>
                    </div>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden p-0" aria-describedby={undefined}>
                  <DialogHeader className="sr-only">
                    <DialogTitle>View Artwork</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="flex-1 bg-black flex items-center justify-center min-h-[300px]">
                      <img
                        src={`/uploads/${image.filename}`}
                        alt={image.originalFilename}
                        className="max-w-full max-h-[60vh] object-contain"
                        style={{ aspectRatio: `${image.width}/${image.height}` }}
                      />
                    </div>
                    <div className="w-full md:w-80 flex flex-col bg-background border-l border-border">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-semibold text-foreground">Comments</h3>
                      </div>
                      <ScrollArea className="flex-1 p-4">
                        {image.comments && image.comments.length > 0 ? (
                          <div className="space-y-3">
                            {image.comments.map((comment, idx) => (
                              <div 
                                key={comment.id}
                                className={`p-3 rounded-lg ${idx % 3 === 0 ? "bg-theme-pink/10" : idx % 3 === 1 ? "bg-theme-blue/10" : "bg-theme-purple/10"}`}
                                data-testid={`comment-${comment.id}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs bg-muted">
                                      {comment.author[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium text-foreground">
                                    {comment.author}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/80 pl-8">
                                  {comment.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            No comments yet
                          </p>
                        )}
                      </ScrollArea>
                      <div className="p-4 border-t border-border space-y-2">
                        <Input
                          placeholder="Your name (optional)"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="text-sm"
                          data-testid="input-comment-author"
                        />
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="flex-1 resize-none text-sm"
                            rows={2}
                            data-testid="input-comment-text"
                          />
                          <Button
                            size="icon"
                            onClick={handleAddComment}
                            disabled={!commentText.trim() || commentMutation.isPending}
                            className={themeBgColors[themeColor]}
                            data-testid="button-send-comment"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-muted rounded-2xl">
            <CardContent className="py-16 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No images yet</p>
              <p className="text-muted-foreground/70 text-sm">
                Upload your art or use the paint tool to create something!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
