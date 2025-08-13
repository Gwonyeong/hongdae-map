import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    // AWS 환경 변수 확인
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      console.error('AWS 환경 변수가 설정되지 않았습니다:', {
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        hasBucketName: !!process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION
      });
      return Response.json({ error: 'AWS 설정이 완료되지 않았습니다.' }, { status: 500 });
    }

    // 사용자 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return Response.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 });
    }

    // 파일 형식 확인
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        error: '지원되는 이미지 형식: JPEG, PNG, WebP' 
      }, { status: 400 });
    }

    // 파일을 Buffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 이미지 리사이징 (최대 800x600, 품질 80%)
    const resizedBuffer = await sharp(buffer)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 환경별 폴더 구분
    const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    
    // 고유한 파일명 생성
    const fileExtension = 'jpg'; // 리사이징 후 JPEG로 통일
    const fileName = `${environment}/reviews/${uuidv4()}.${fileExtension}`;

    // S3에 업로드
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: resizedBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=31536000', // 1년 캐시
      ACL: 'public-read', // 공개 읽기 권한
    });

    await s3Client.send(uploadCommand);

    // 업로드된 이미지 URL 생성
    const imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return Response.json({ 
      success: true, 
      imageUrl,
      fileName 
    }, { status: 200 });

  } catch (error) {
    console.error('이미지 업로드 실패:', {
      message: error.message,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      stack: error.stack
    });
    
    return Response.json({ 
      error: '이미지 업로드에 실패했습니다.',
      details: error.message
    }, { status: 500 });
  }
}