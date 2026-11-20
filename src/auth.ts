import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { loginSchema } from "@/domains/identity/auth-schemas";
import { findUserCredentialsByEmail } from "@/server/dal/user-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/entrar" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await findUserCredentialsByEmail(parsed.data.email);
        if (!user?.passwordHash) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      const authenticated = Boolean(session?.user);
      const privateRoute = request.nextUrl.pathname.startsWith("/app");
      if (privateRoute) return authenticated;
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.userId === "string") session.user.id = token.userId;
      return session;
    },
  },
});
