import { MAIN_ROUTE, SIGN_IN_ROUTE, SIGN_UP_ROUTE } from "../utils/routes";

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import { encode } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { passwordIsValid } from "./password";
import { prisma } from "./prisma";
import { getLogger, sanitizeError } from "../logging/serverLogger";

const adapter = PrismaAdapter(prisma);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  logger: {
    error(error) {
      getLogger("auth").error(
        {
          err: sanitizeError(error),
          event: "auth.provider.error",
          operation: "authjs",
        },
        "Auth.js provider error"
      );
    },
    warn(code) {
      getLogger("auth").warn(
        { event: "auth.provider.warning", operation: "authjs", code },
        "Auth.js provider warning"
      );
    },
    debug(code) {
      getLogger("auth").debug(
        { event: "auth.provider.debug", operation: "authjs", code },
        "Auth.js provider debug event"
      );
    },
  },
  providers: [
    GitHub,
    Google,
    Credentials({
      credentials: {
        email: {
          type: "email",
          placeholder: "you@example.com",
        },
        password: {
          type: "password",
          placeholder: "your password",
        },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        const isValidPassword = await passwordIsValid(
          password,
          user?.password ?? ""
        );

        if (!user || !isValidPassword || !user.isActive) {
          return null;
        }

        return user;
      },
    }),
  ],
  callbacks: {
    // para saber que el usuario se autentico con credenciales
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
  },
  jwt: {
    encode: async (params) => {
      if (params.token?.credentials) {
        const sessionToken = Math.random().toString(36).substring(2);

        if (!params.token.sub) {
          throw new Error("No user id found in token");
        }

        const createdSession = await adapter?.createSession?.({
          sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        return sessionToken;
      }
      return encode(params);
    },
  },
  events: {
    async linkAccount({ account, user }) {
      // Este evento se dispara cuando se vincula una cuenta OAuth
      if (
        (account.provider === "github" || account.provider === "google") &&
        user.email
      ) {
        // Marcar el email como verificado
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
  },
  pages: {
    signIn: SIGN_IN_ROUTE,
    newUser: SIGN_UP_ROUTE,
    error: MAIN_ROUTE,
  },
});
