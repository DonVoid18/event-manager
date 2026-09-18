import { ProfilePage } from "@/features/auth/profile/infrastructure/pages/ProfilePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Perfil - Panel de Control",
  description: "Administra tu cuenta de usuario, contraseña y foto de perfil.",
};

export default function Page() {
  return <ProfilePage />;
}
