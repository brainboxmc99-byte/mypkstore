import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useLoginWithToken, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function ShopLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const tokenAttempted = useRef(false);

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  const loginMutation = useLoginWithToken({
    mutation: {
      onSuccess: () => {
        toast({ title: "Logged in successfully" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      },
      onError: () => {
        toast({ title: "Login failed", description: "Invalid or expired token", variant: "destructive" });
        setIsProcessing(false);
      }
    }
  });

  useEffect(() => {
    if (user?.role === "shopOwner") {
      setLocation("/dashboard");
      return;
    }
    if (user?.role === "admin") {
      setLocation("/admin");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token && !isUserLoading && !tokenAttempted.current) {
      tokenAttempted.current = true;
      setIsProcessing(true);
      loginMutation.mutate({ data: { token } });
    }
  }, [user, isUserLoading, setLocation]);

  if (isUserLoading || isProcessing) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold text-primary">MyPkStore</CardTitle>
          <CardDescription className="text-base mt-2">Welcome back to your shop</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-muted p-6 rounded-lg text-sm text-muted-foreground">
            Shop owners receive a magic login link via WhatsApp or from their administrator.
          </div>
          <p className="text-sm">
            Check your messages for your magic link, or contact support if you need a new one.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
