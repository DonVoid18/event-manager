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
      <SidebarInset className="app-canvas h-svh min-w-0 overflow-hidden">
        <AppHeader />
        <div id="app-scroll" className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex w-full min-w-0 flex-1 flex-col gap-7 p-4 md:p-8 lg:p-10">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
