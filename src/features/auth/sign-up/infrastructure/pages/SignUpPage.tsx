import { AuthLayout } from "@/shared/infrastructure/components/AuthLayout";
import { SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";
import UserRegisterForm from "../components/UserRegisterForm";

const SignUpPage = () => {
  return (
    <AuthLayout>
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Crear una cuenta
        </h1>
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <a href={SIGN_IN_ROUTE} className="underline underline-offset-4 hover:text-primary">
            Iniciar sesión
          </a>
        </p>
      </div>
      <UserRegisterForm />
    </AuthLayout>
  );
};

export default SignUpPage;
