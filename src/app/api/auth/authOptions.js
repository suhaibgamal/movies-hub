// app/api/auth/AuthOptions.js
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter your username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });
        if (!user) return null;
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;
        return { id: user.id, name: user.username };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.email.split("@")[0],
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        if (account) {
          token.provider = account.provider;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.provider = token.provider;
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        if (account.provider === "google") {
          const credsUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });
          if (credsUser && credsUser.password) {
            throw new Error("Email already used with password login");
          }
          const baseUsername = profile.name
            ? profile.name.replace(/\s+/g, "").toLowerCase()
            : profile.email.split("@")[0];
          let uniqueUsername = baseUsername;
          let counter = 1;
          while (true) {
            const existing = await prisma.user.findUnique({
              where: { username: uniqueUsername },
            });
            if (!existing) break;
            uniqueUsername = `${baseUsername}${counter}`;
            counter++;
          }
          await prisma.user.upsert({
            where: { email: profile.email },
            create: {
              id: profile.sub,
              username: uniqueUsername,
              email: profile.email,
              image: profile.picture,
            },
            update: {},
          });
        }
        return true;
      } catch (error) {
        console.error("Google SignIn Error:", error);
        return false;
      }
    },
  },
};
