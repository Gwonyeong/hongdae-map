import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

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
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.AWS_S3_BUCKET_NAME
    ) {
      console.error("AWS 환경 변수가 설정되지 않았습니다.");
      return Response.json(
        { error: "AWS 설정이 완료되지 않았습니다." },
        { status: 500 }
      );
    }

    // 사용자 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("profileImage");

    if (!file) {
      return Response.json(
        { error: "프로필 이미지 파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일 형식 확인
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        {
          error: "지원되는 이미지 형식: JPEG, PNG, WebP",
        },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(
      `프로필 이미지 처리 시작: 원본 크기 ${(file.size / 1024 / 1024).toFixed(
        2
      )}MB`
    );

    // 프로필 이미지 리사이징 (정사각형, 300x300, 품질 85%)
    // 큰 이미지도 효율적으로 처리하고 파일 크기 최적화
    const resizedBuffer = await sharp(buffer)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
        withoutEnlargement: false, // 작은 이미지도 확대하여 300x300으로 맞춤
      })
      .jpeg({
        quality: 85,
        progressive: true, // 점진적 로딩 지원
        mozjpeg: true, // 더 나은 압축
      })
      .toBuffer();

    console.log(
      `프로필 이미지 리사이징 완료: 최종 크기 ${(
        resizedBuffer.length / 1024
      ).toFixed(2)}KB`
    );

    // 환경별 폴더 구분
    const environment = process.env.NODE_ENV === "production" ? "prod" : "dev";

    // 고유한 파일명 생성
    const fileExtension = "jpg";
    const fileName = `${environment}/profiles/${
      session.user.id
    }/${uuidv4()}.${fileExtension}`;

    // S3에 업로드
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: resizedBuffer,
      ContentType: "image/jpeg",
      CacheControl: "max-age=31536000",
      ACL: "public-read",
    });

    await s3Client.send(uploadCommand);

    // 업로드된 이미지 URL 생성
    const imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return Response.json(
      {
        success: true,
        imageUrl,
        fileName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("프로필 이미지 업로드 실패:", error);

    return Response.json(
      {
        error: "프로필 이미지 업로드에 실패했습니다.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
