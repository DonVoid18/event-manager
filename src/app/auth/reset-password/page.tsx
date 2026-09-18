import ResetPasswordPage from "@/features/auth/forgot-password/infrastructure/pages/ResetPasswordPage";
import { auth } from "@/shared/infrastructure/libs/auth";
import { MAIN_ROUTE } from "@/shared/infrastructure/utils/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  description: "Página para restablecer la contraseña.",
};

interface PageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();

  if (session) {
    redirect(MAIN_ROUTE);
  }

  const params = await searchParams;

  return <ResetPasswordPage email={params.email} />;
}
