import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        place: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // 장소별로 리뷰 그룹화
    const placeGroups = {};
    reviews.forEach(review => {
      const placeId = review.placeId;
      if (!placeGroups[placeId]) {
        placeGroups[placeId] = {
          place: review.place,
          reviews: [],
          emojiCounts: {}
        };
      }
      
      placeGroups[placeId].reviews.push({
        id: review.id,
        title: review.title,
        description: review.description,
        rating: review.rating,
        emoji: review.emoji,
        images: review.images,
        createdAt: review.createdAt,
        userId: review.userId, // userId 추가
        user: review.user
      });
      
      // 이모지 카운트
      const emoji = review.emoji;
      placeGroups[placeId].emojiCounts[emoji] = (placeGroups[placeId].emojiCounts[emoji] || 0) + 1;
    });
    
    // 장소별 데이터로 변환 (맵 표시용)
    const placesWithReviews = Object.values(placeGroups).map(group => {
      // 가장 많이 사용된 이모지 찾기
      const sortedEmojis = Object.entries(group.emojiCounts)
        .sort(([,a], [,b]) => b - a);
      
      const mostUsedEmoji = sortedEmojis[0]?.[0] || '📍';
      
      // 상위 3개 이모지 (바텀시트용)
      const topEmojis = sortedEmojis.slice(0, 3).map(([emoji, count]) => ({
        emoji,
        count,
        reviews: group.reviews.filter(r => r.emoji === emoji)
      }));
      
      return {
        placeId: group.place.id,
        placeName: group.place.name,
        address: group.place.address,
        latitude: group.place.latitude,
        longitude: group.place.longitude,
        category: group.place.category,
        emoji: mostUsedEmoji, // 맵에 표시할 이모지
        totalReviews: group.reviews.length,
        avgRating: group.reviews.reduce((sum, r) => sum + r.rating, 0) / group.reviews.length,
        topEmojis, // 바텀시트에서 사용할 이모지별 그룹
        allReviews: group.reviews // 모든 리뷰
      };
    });
    
    return Response.json({ reviews: placesWithReviews });
  } catch (error) {
    console.error('리뷰 조회 실패:', error);
    return Response.json({ error: '리뷰를 불러올 수 없습니다.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    
    const { title, description, rating, emoji, placeName, address, latitude, longitude, category, images = [] } = body;
    
    if (!title || !description || !rating || !emoji || !placeName || !address || !latitude || !longitude) {
      return Response.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }
    
    // 현재 로그인한 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 장소 찾기 또는 생성
    let place = await prisma.place.findFirst({
      where: {
        name: placeName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });
    
    if (!place) {
      place = await prisma.place.create({
        data: {
          name: placeName,
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          category: category || null
        }
      });
    }
    
    // 리뷰 생성
    const review = await prisma.review.create({
      data: {
        title,
        description,
        rating: parseInt(rating),
        emoji,
        images,
        userId: user.id,
        placeId: place.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        place: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            category: true
          }
        }
      }
    });
    
    // 기존 형식과 호환되도록 데이터 변환
    const transformedReview = {
      id: review.id,
      title: review.title,
      description: review.description,
      rating: review.rating,
      emoji: review.emoji,
      placeName: review.place.name,
      address: review.place.address,
      latitude: review.place.latitude,
      longitude: review.place.longitude,
      createdAt: review.createdAt,
      user: review.user
    };
    
    return Response.json({ review: transformedReview }, { status: 201 });
  } catch (error) {
    console.error('리뷰 저장 실패:', error);
    return Response.json({ error: '리뷰 저장에 실패했습니다.' }, { status: 500 });
  }
}