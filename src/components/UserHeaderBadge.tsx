"use client";

import React, { useState } from "react";
import { logoutUser } from "@/actions/auth";
import type { SessionUser } from "@/actions/auth";
import { User, LogIn, LogOut, ShieldCheck, Wrench, Building2 } from "lucide-react";
import { LoginModal } from "./LoginModal";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";

interface UserHeaderBadgeProps {
  currentUser?: SessionUser | null;
  targetRoleHint?: "TECHNIKER" | "OFFICE" | "ADMIN";
}

export function UserHeaderBadge({ currentUser, targetRoleHint }: UserHeaderBadgeProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logoutUser();
    toast("Erfolgreich abgemeldet.");
    router.push("/");
    router.refresh();
  };

  if (!currentUser) {
    return (
      <>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Anmelden</span>
        </button>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          targetRoleHint={targetRoleHint}
        />
      </>
    );
  }

  const isAdmin = currentUser.role === "ADMIN";
  const isOffice = currentUser.role === "OFFICE";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shrink-0 ${
            isAdmin
              ? "bg-violet-600"
              : isOffice
              ? "bg-blue-600"
              : "bg-indigo-600"
          }`}
        >
          {isAdmin ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : isOffice ? (
            <Building2 className="w-3.5 h-3.5" />
          ) : (
            <Wrench className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="hidden sm:block text-left">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 block leading-tight">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-zinc-400 block leading-tight font-mono">
            @{currentUser.username} • {currentUser.role}
          </span>
        </div>

        <span className="sm:hidden font-bold text-zinc-800 dark:text-zinc-200">
          {currentUser.name.split(" ")[0]}
        </span>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        title="Abmelden"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
