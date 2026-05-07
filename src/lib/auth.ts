import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/spreadsheets",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      const account = await prisma.account.findFirst({
        where: { userId: user.id, provider: "google" },
      });
      if (account) {
        session.user.id = user.id;

        // Refresh the access token if it's expired or about to expire
        const expiresAt = (account.expires_at ?? 0) * 1000;
        const isExpired = Date.now() > expiresAt - 60_000;

        if (isExpired && account.refresh_token) {
          try {
            const response = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: account.refresh_token,
              }),
            });
            const tokens = await response.json();
            if (tokens.access_token) {
              await prisma.account.update({
                where: { id: account.id },
                data: {
                  access_token: tokens.access_token,
                  expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 3600),
                },
              });
              session.accessToken = tokens.access_token;
            } else {
              session.accessToken = account.access_token ?? undefined;
            }
          } catch {
            session.accessToken = account.access_token ?? undefined;
          }
        } else {
          session.accessToken = account.access_token ?? undefined;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
