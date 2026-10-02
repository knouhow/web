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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
        </DialogHeader>
        <SchoolEmailLoginForm
          onSignedIn={() => onOpenChange(false)}
          onSignUp={() => {
            onOpenChange(false);
            router.push("/signup");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
