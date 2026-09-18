export type UsuarioRole = "ADMIN" | "COLABORADOR";

export interface Usuario {
  id: string;
  name: string | null;
  email: string | null;
  role: UsuarioRole;
  isActive: boolean;
}
