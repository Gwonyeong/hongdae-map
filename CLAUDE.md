# 함께 만들어가는 홍대 지도

## 프로젝트 개요
사용자들이 홍대 지역의 장소를 검색하고 리뷰와 함께 이모지 마커를 추가할 수 있는 참여형 지도 서비스

## 기술 스택
- **Frontend**: Next.js 14 (JavaScript), Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Map API**: 카카오맵 API
- **Features**: 장소 검색, 리뷰 작성, 이모지 마커, 별점 시스템

## 주요 기능
1. **장소 검색**: 카카오맵 API를 통한 홍대 주변 장소 검색
2. **리뷰 작성**: 제목, 설명, 별점(1-5), 이모지 선택
3. **이모지 마커**: 16개의 이모지 중 선택하여 지도에 표시
4. **리뷰 조회**: 마커 클릭 시 리뷰 내용, 별점, 작성일 표시

## 데이터베이스 스키마
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  googleId  String?  @unique  // 구글 로그인용
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  reviews Review[]
}

model Place {
  id          Int      @id @default(autoincrement())
  name        String   // 장소명
  address     String   // 주소
  latitude    Float    // 위도
  longitude   Float    // 경도
  category    String?  // 카테고리
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  reviews Review[]
  
  @@unique([latitude, longitude, name])
}

model Review {
  id          Int      @id @default(autoincrement())
  title       String   // 리뷰 제목
  description String   // 리뷰 내용
  rating      Int      // 별점 (1-5)
  emoji       String   // 마커 이모지
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  placeId Int
  place   Place @relation(fields: [placeId], references: [id], onDelete: Cascade)
  
  @@index([placeId])
  @@index([userId])
}
```

## API 엔드포인트
- `GET /api/reviews`: 모든 리뷰 조회
- `POST /api/reviews`: 새 리뷰 생성

## 컴포넌트 구조
- `KakaoMap`: 지도 표시 및 이모지 마커 렌더링
- `PlaceSearch`: 장소 검색 기능
- `ReviewForm`: 리뷰 작성 폼 (제목, 설명, 별점, 이모지)

## 환경 변수
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_KAKAO_MAP_KEY="카카오맵_API_키"
```

## 명령어
- `npm run dev`: 개발 서버 실행
- `npx prisma db push`: 데이터베이스 스키마 동기화
- `npx prisma studio`: Prisma Studio 실행 (DB 관리 UI)
- `npx prisma generate`: Prisma Client 생성