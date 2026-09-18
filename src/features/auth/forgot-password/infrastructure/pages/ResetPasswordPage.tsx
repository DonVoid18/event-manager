import { AuthLayout } from "@/shared/infrastructure/components/AuthLayout";
import ResetPasswordForm from "../components/ResetPasswordForm";

interface ResetPasswordPageProps {
  email?: string;
}

const ResetPasswordPage = ({ email }: ResetPasswordPageProps) => {
  return (
    <AuthLayout>
      <ResetPasswordForm email={email} />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
