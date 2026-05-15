import React from "react";
import { useLocation } from "wouter";
import { useAdminLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function AdminLogin() {
  const [password, setPassword] = React.useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  React.useEffect(() => {
    if (user?.role === "admin") {
      setLocation("/admin");
    } else if (user?.role === "shopOwner") {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: () => {
        toast({ title: "Logged in successfully" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/admin");
      },
      onError: () => {
        toast({ title: "Login failed", description: "Invalid password", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { password } });
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">MyPkStore Admin</CardTitle>
          <CardDescription>Super Admin Access</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
