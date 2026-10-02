"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppToastProvider } from "@/components/toast-provider";
import { ExamStoreProvider } from "@/store/exam-store-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AppToastProvider>
        <AuthProvider>
          <ExamStoreProvider>{children}</ExamStoreProvider>
        </AuthProvider>
      </AppToastProvider>
    </QueryClientProvider>
  );
}
