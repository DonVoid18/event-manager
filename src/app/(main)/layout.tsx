import {
  SidebarInset,
  SidebarProvider,
} from "@/shared/infrastructure/shadcn/components/ui/sidebar";
import { EMAIL_VERIFICATION_ROUTE, SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";

import { auth, signOut } from "@/shared/infrastructure/libs/auth";
import { AppSidebar } from "@/shared/infrastructure/shadcn/components/app-sidebar";
import { UserLoged } from "@/shared/infrastructure/types/userLoged";
import { AppHeader } from "@/shared/infrastructure/components/AppHeader";
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

  if (!session.user.isActive) {
    await signOut({ redirect: false });
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
    role: session.user.role,
    isActive: session.user.isActive,
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <AppSidebar
        user={{
          name: user.name ?? "",
          email: user.email ?? "",
          avatar: user.image ?? "",
        }}
        role={user.role}
      />
      <SidebarInset className="h-svh overflow-hidden bg-background">
        <AppHeader />
        <div id="app-scroll" className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 p-4 md:p-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
