import ForgotPasswordPage from "@/features/auth/forgot-password/infrastructure/pages/ForgotPasswordPage";
import { auth } from "@/shared/infrastructure/libs/auth";
import { MAIN_ROUTE } from "@/shared/infrastructure/utils/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Página para recuperar la contraseña.",
};

export default async function Page() {
  const session = await auth();

  if (session) {
    redirect(MAIN_ROUTE);
  }

  return <ForgotPasswordPage />;
}
