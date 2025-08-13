import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        // 데이터베이스에서 최신 사용자 정보 가져오기
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { id: true, name: true, image: true, email: true },
          });

          if (user) {
            session.user.id = user.id;
            session.user.name = user.name;
            session.user.image = user.image;
            session.user.email = user.email;
          }
        } catch (error) {
          console.error("세션 콜백에서 사용자 정보 가져오기 실패:", error);
          // 토큰에서 기본 정보 사용
          session.user.id = token.sub;
        }
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
