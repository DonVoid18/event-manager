import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/sidebar";
import { EMAIL_VERIFICATION_ROUTE, SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";

import { auth } from "@/shared/infrastructure/libs/auth";
import { AppSidebar } from "@/shared/infrastructure/shadcn/components/app-sidebar";
import { UserLoged } from "@/shared/infrastructure/types/userLoged";
import { Earth } from "lucide-react";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await auth();

  if (!session) {
    redirect(SIGN_IN_ROUTE);
  }

  if (!session.user.emailVerified) {
    redirect(EMAIL_VERIFICATION_ROUTE);
  }

  const user: UserLoged = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    image: session.user.image,
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user.name ?? "",
          email: user.email ?? "",
          avatar: user.image ?? "",
        }}
      />
      <SidebarInset className="h-svh overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Earth className="size-4" />
            </div>
            <span className="text-sm font-semibold">TEMPLATE</span>
          </div>
          <SidebarTrigger />
        </div>
        <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
