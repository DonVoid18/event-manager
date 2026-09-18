import { AuthLayout } from "@/shared/infrastructure/components/AuthLayout";
import UserAuthForm from "../components/UserAuthForm";

const SignInPage = () => {
  return (
    <AuthLayout>
      <UserAuthForm />
    </AuthLayout>
  );
};

export default SignInPage;
