export interface UserLoged {
  id: string;
  name: string;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: "ADMIN" | "COLABORADOR";
  isActive: boolean;
}
