import SignInPage from "@/features/auth/sign-in/infrastructure/pages/SignInPage";
import { auth } from "@/shared/infrastructure/libs/auth";
import { MAIN_ROUTE } from "@/shared/infrastructure/utils/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Página para iniciar sesión.",
};

export default async function Page() {
  const session = await auth();

  if (session) {
    redirect(MAIN_ROUTE);
  }

  return <SignInPage />;
}
