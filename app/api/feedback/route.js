import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { subject, content } = await request.json();

    // 입력 검증
    if (!subject || !content?.trim()) {
      return NextResponse.json(
        { error: "문의 주제와 상세 내용을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 피드백 저장
    const feedback = await prisma.feedback.create({
      data: {
        subject,
        content: content.trim(),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        subject: feedback.subject,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("피드백 저장 오류:", error);
    return NextResponse.json(
      { error: "피드백 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 사용자의 피드백 목록 조회
    const feedbacks = await prisma.feedback.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        subject: true,
        content: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("피드백 조회 오류:", error);
    return NextResponse.json(
      { error: "피드백 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
