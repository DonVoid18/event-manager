import {
  MAIN_ROUTE,
  SIGN_IN_ROUTE,
} from "@/shared/infrastructure/utils/routes";

import VerifyEmailPage from "@/features/auth/verify-email/infrastructure/pages/VerifyEmailPage";
import { auth } from "@/shared/infrastructure/libs/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();

  if (!session) {
    redirect(SIGN_IN_ROUTE);
  }

  if (session.user.emailVerified) {
    redirect(MAIN_ROUTE);
  }

  return <VerifyEmailPage />;
};

export default Page;
