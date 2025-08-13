# Coffee Map - 연남동·망원동 커피숍 지도

서울시 마포구 연남동과 망원동의 영업중인 커피숍을 지도에 표시하는 웹 애플리케이션입니다.

## 🚀 시작하기

### 1. 카카오맵 API 키 발급
1. [카카오 개발자 사이트](https://developers.kakao.com)에 접속
2. 애플리케이션 생성
3. JavaScript 키 발급
4. 플랫폼 설정에서 사이트 도메인 추가 (개발: http://localhost:3000)

### 2. 환경 변수 설정
`.env.local` 파일에 카카오맵 API 키 추가:
```
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_javascript_key_here
```

### 3. 프로젝트 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📋 기능

- ☕ 164개 커피숍 위치 표시
- 🔍 카페 이름/주소 검색
- 📍 지역별 필터링 (연남동/망원동)
- 📱 반응형 디자인
- 🗺️ 카카오맵 연동

## 🛠️ 기술 스택

- Next.js 14
- React
- Tailwind CSS
- Kakao Maps API

## 📁 프로젝트 구조

```
coffee-map/
├── app/
│   ├── page.js         # 메인 페이지
│   └── globals.css     # 전역 스타일
├── components/
│   ├── KakaoMap.jsx    # 카카오맵 컴포넌트
│   └── CafeList.jsx    # 카페 목록 컴포넌트
├── public/
│   └── coffee-data.json # 카페 데이터
└── CLAUDE.md           # 프로젝트 계획 문서
```

## 📊 데이터

서울시 공공데이터 포털의 마포구 휴게음식점 인허가 정보를 필터링하여 사용합니다.
- 연남동/망원동 지역
- 영업중 상태
- 업태구분: 커피숍

## 🔮 향후 계획

- [ ] Prisma를 활용한 데이터베이스 연동
- [ ] 카페 상세 정보 페이지
- [ ] 사용자 리뷰 기능
- [ ] 즐겨찾기 기능
- [ ] 현재 위치 기반 추천