import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 트랜잭션으로 사용자와 관련 데이터 삭제
    await prisma.$transaction(async (tx) => {
      // 1. 사용자의 리뷰들 삭제 (Cascade로 자동 삭제되지만 명시적으로)
      await tx.review.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      // 2. 사용자의 세션 삭제
      await tx.session.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      // 3. 사용자의 계정 정보 삭제
      await tx.account.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      // 4. 사용자 삭제
      await tx.user.delete({
        where: {
          id: session.user.id,
        },
      });
    });

    return NextResponse.json({
      message: "회원 탈퇴가 완료되었습니다.",
    });
  } catch (error) {
    console.error("회원 탈퇴 오류:", error);
    return NextResponse.json(
      { error: "회원 탈퇴에 실패했습니다." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}