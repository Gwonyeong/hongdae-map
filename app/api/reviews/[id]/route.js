import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const reviewId = parseInt(params.id);

    // 리뷰가 존재하는지 확인하고 작성자가 현재 사용자인지 확인
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true, id: true }
    });

    if (!review) {
      return NextResponse.json(
        { error: '존재하지 않는 후기입니다.' },
        { status: 404 }
      );
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: '본인이 작성한 후기만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 리뷰 삭제
    await prisma.review.delete({
      where: { id: reviewId }
    });

    return NextResponse.json(
      { message: '후기가 성공적으로 삭제되었습니다.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Review deletion error:', error);
    return NextResponse.json(
      { error: '후기 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}