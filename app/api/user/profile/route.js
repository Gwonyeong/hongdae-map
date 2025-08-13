import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    console.log("프로필 업데이트 요청 - 세션 정보:", {
      session: session ? "존재함" : "없음",
      userId: session?.user?.id,
      userName: session?.user?.name,
      userEmail: session?.user?.email,
    });

    if (!session) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    if (!session.user?.id) {
      console.error("세션에 사용자 ID가 없습니다:", session.user);
      return NextResponse.json(
        { error: "사용자 ID를 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    const { name, image } = await request.json();

    console.log("업데이트 요청 데이터:", { name, image });

    if (!name) {
      return NextResponse.json(
        { error: "이름은 필수 항목입니다." },
        { status: 400 }
      );
    }

    console.log("데이터베이스 업데이트 시도:", {
      userId: session.user.id,
      name: name.trim(),
      image: image || null,
    });

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: name.trim(),
        image: image || null,
      },
    });

    console.log("데이터베이스 업데이트 성공:", {
      id: updatedUser.id,
      name: updatedUser.name,
      image: updatedUser.image,
    });

    return NextResponse.json({
      message: "프로필이 업데이트되었습니다.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    return NextResponse.json(
      { error: "프로필 업데이트에 실패했습니다." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
