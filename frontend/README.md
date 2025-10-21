# 🌐 SupportHub - Frontend

> 감정 기반 공감 챗봇 플랫폼 **SupportHub**의 프론트엔드 프로젝트입니다.  
> **Next.js 13 (App Router) + Tailwind CSS + Spring Boot 백엔드 연동** 기반의 팀 협업 웹 프로젝트입니다.

---

## 📁 프로젝트 구조

```
/SUPPORTHUB-FRONTEND
├── public/                   # 정적 파일
├── src/
│   └── app/                  # App Router 구조
│       ├── layout.js
│       ├── page.js
│       └── globals.css
├── .gitignore
├── next.config.mjs
├── postcss.config.mjs
├── package.json
├── README.md
```

---

## 🚀 실행 방법

```bash
npm install       # 의존성 설치 (최초 1회만)
npm run dev       # http://localhost:3000 실행
```

- 환경변수 설정 파일: `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## 🔗 프론트 <-> 백엔드 연동

- 백엔드 서버 주소: `http://localhost:8080`
- 프론트는 환경변수 `NEXT_PUBLIC_API_URL`을 통해 API 요청
- 백엔드는 Spring Boot 기반 REST API
- CORS 허용 주소: `http://localhost:3000`

---

## 🛡️ 브랜치 전략

| 브랜치                    | 설명                                  |
| ------------------------- | ------------------------------------- |
| `main`                    | 운영 배포 브랜치 (🔒 보호)            |
| `development`             | 통합 개발 브랜치 (🔒 보호)            |
| `feat/{ticket-id}/{desc}` | 기능 단위 브랜치 (`feat/23/login-ui`) |

> `main`, `development`는 직접 push 금지  
> 반드시 PR을 통해 병합하며 코드 리뷰 필수

---

## 📝 PR 작성 규칙

- PR 제목 형식: `[티켓ID] 작업 내용`
- 예: `[#21] 감정 히스토리 목록 구현`
- PR 생성 시 티켓 상태 자동 업데이트

---

## 💬 커밋 규칙

커밋 메시지는 **한글**로 작성하고 다음 prefix를 사용합니다:

| Prefix     | 설명                                     |
| ---------- | ---------------------------------------- |
| `feat`     | 새로운 기능 추가                         |
| `fix`      | 버그 수정                                |
| `docs`     | 문서 작업 또는 README 수정               |
| `refactor` | 코드 리팩토링 (기능 변화 없음)           |
| `config`   | 설정 파일 변경 (예: tailwind, eslint 등) |

예시:

```bash
git commit -m "feat: 감정 일기 등록 API 연동"
```

---

## 📌 협업 주의사항

- `.env.local` 같은 민감 정보는 커밋 금지
- 기능별 브랜치 생성 후 작업 및 PR 요청
- PR은 코드 리뷰 완료 후만 병합 가능
- 작업 완료 후 **Notion에 기능 정리**
- **모든 팀원은 다른 팀원의 노션 정리를 참고하여 피드백 주고받기**

---

## 🔐 보안 설정 (GitHub)

- `main`, `development` 브랜치 보호 설정:

  - `Allow force pushes` ❌
  - `Allow deletions` ❌
  - `Require pull request before merging` ✅

- 레포지토리는 기본 `private` 상태 유지
- 환경변수 파일은 `.gitignore`로 관리

---

## 📚 사용 스택

| 구분       | 기술 스택                               |
| ---------- | --------------------------------------- |
| 프레임워크 | Next.js 13 (App Router), React 18       |
| 스타일링   | Tailwind CSS, PostCSS                   |
| HTTP 통신  | Axios                                   |
| 개발 환경  | ESLint, Prettier, GitHub Actions (선택) |
| 협업 도구  | GitHub, Notion, Figma (필요 시)         |

---

## ✅ 개발 체크리스트

- [ ] 라우팅 및 전역 스타일 설정 완료
- [ ] 기능별 폴더 구조 설계
- [ ] API 연동 테스트 완료
- [ ] 감정 일기, 챗봇, 커뮤니티 UI 구현
- [ ] PR 작성 및 코드 리뷰
- [ ] 기능별 정리 후 Notion 업로드

---

## 📅 회의 일정 및 협업 규칙

- ✅ **매주**: 각자 개발한 기능 정리 → Notion 업로드
- ✅ **모든 팀원**: 서로의 노션 문서를 참고하여 피드백 주고받기
- ✅ **2주마다**: 온라인 미팅 진행 (기능 공유 및 피드백)
- ✅ **한 달에 1회**: 전체 회의 필수 참석 (중간 회의 불참자 포함)

---

## 📞 문의 및 연락

- 팀장: 김도희
- GitHub: https://github.com/ICC-SupportHub/SupportHub-frontend
- Notion: https://www.notion.so/222672d5ce4680a0848bf36722bea3aa?v=222672d5ce4680af9968000cb3750e20&source=copy_link

---
