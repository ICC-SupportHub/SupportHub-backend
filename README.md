# 🌐 웹 프로젝트 이름 (예: WeatherFit)

> React + Spring Boot 기반의 팀 협업 웹 프로젝트

---
확장
README.md
3KB
﻿

# 🌐 웹 프로젝트 이름 (예: WeatherFit)

> React + Spring Boot 기반의 팀 협업 웹 프로젝트

---

## 📁 프로젝트 구조

```
/MyWebProject
├── backend     # Spring Boot 백엔드
│   ├── build.gradle
│   └── src/...
├── frontend    # React 프론트엔드 (Vite 기반)
│   ├── package.json
│   └── src/...
└── README.md
```

---

## 🚀 실행 방법

### 🔧 프론트엔드 (React with Vite)
```bash
cd frontend
npm install     # 처음 한 번만
npm run dev     # http://localhost:5173 실행
```

### ⚙️ 백엔드 (Spring Boot)
```bash
cd backend
./gradlew bootRun   # 또는 IntelliJ에서 실행
```
- API 서버 주소: `http://localhost:8080`

---

## 🔗 프론트 ↔ 백엔드 연동

- CORS 허용 주소: `http://localhost:5173`
- 프론트 `.env` 설정 예시:
  ```env
  VITE_API_BASE_URL=http://localhost:8080
  ```

---

## 🛡️ 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 배포용 (🔒 보호 브랜치) |
| `dev`  | 개발 통합 브랜치 (🔒 보호 브랜치) |
| `feature/*` | 각자 작업 브랜치 (예: `feature/login-api`) |

> 🔒 `main`, `dev` 브랜치에 직접 push 금지  
> 반드시 Pull Request(PR)로 병합 + 코드 리뷰

---

## 📌 협업 주의사항

- **절대 `main`에 직접 푸시하지 마세요**
- 커밋 메시지는 의미 있게 작성 (예: `feat: 로그인 API 구현`)
- 커밋 전 `npm run lint`, `build` 등 확인
- `.gitignore`에 `node_modules/`, `build/`, `*.log` 등 반드시 포함
- 협업자는 GitHub에서 **collaborator로 초대 후 참여**

---

## 🔐 보안 설정 (GitHub)

- `main`, `dev` 브랜치 → 브랜치 보호 규칙 적용
    - `Allow force pushes` ❌
    - `Allow deletions` ❌
    - `Require PR before merging` ✅
- 레포지토리는 기본 `private`으로 유지

---

## 📚 사용 스택

| 프론트엔드 | 백엔드 | 기타 |
|------------|--------|------|
| React + Vite | Spring Boot (Gradle) | MySQL, JPA, Lombok |
| Axios       | Spring Web           | GitHub, Postman |

---

## ✅ 개발 체크리스트

- [ ] API 명세 정리
- [ ] DB 모델링 완료
- [ ] 공통 DTO 구조 정의
- [ ] 로그인/회원가입 기능
- [ ] CORS, 인증 테스트

---

## 📞 문의 및 연락
> 팀원 연락처, 노션 링크, API 명세 문서 등을 여기에 추가
