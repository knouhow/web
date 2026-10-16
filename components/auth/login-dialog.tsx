"use client";

import { useRouter } from "next/navigation";
import { SchoolEmailLoginForm } from "@/components/auth/school-email-login-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSignedIn?: () => void;
}

export function LoginDialog({
  open,
  onOpenChange,
  onSignedIn,
}: LoginDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
        </DialogHeader>
        <SchoolEmailLoginForm
          onSignedIn={() => {
            onOpenChange(false);
            onSignedIn?.();
          }}
          onSignUp={() => {
            onOpenChange(false);
            router.push("/signup");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
