# 🌐 SupportHub - Backend

> 감정 기반 공감 챗봇 플랫폼 **SupportHub**의 백엔드 프로젝트입니다.  
> **Spring Boot + MySQL + JPA + JWT 기반 REST API 서버**로 구성되어 있으며, 프론트엔드와의 완벽한 연동을 목표로 합니다.

---

## 📁 프로젝트 구조

```
/SUPPORTHUB-BACKEND
├── build.gradle            # Gradle 빌드 설정
├── settings.gradle
├── src/
│   ├── main/
│   │   ├── java/           # 백엔드 Java 소스
│   │   └── resources/      # 설정 파일 및 정적 자원
│   └── test/               # 테스트 코드
├── .gitignore
├── README.md
```

---

## 🚀 실행 방법

### IntelliJ에서 실행

1. `backend` 폴더를 열기
2. `SupportHubApplication.java` 실행

### CLI로 실행

```bash
./gradlew bootRun
```

- 기본 포트: `http://localhost:8080`

- DB 및 환경 설정은 `application.yml` 또는 `application-local.yml`로 구성

---

## 🔗 프론트 <-> 백엔드 연동

- CORS 허용 주소: `http://localhost:3000` (프론트는 Next.js 사용)
- RESTful API는 `http://localhost:8080/api` 형태로 구성
- 프론트에서는 `.env.local`을 통해 API 주소를 지정함:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## 🛡️ 브랜치 전략

| 브랜치                    | 설명                                   |
| ------------------------- | -------------------------------------- |
| `main`                    | 운영 배포 브랜치 (🔒 보호)             |
| `development`             | 통합 개발 브랜치 (🔒 보호)             |
| `feat/{ticket-id}/{desc}` | 기능 단위 브랜치 (`feat/23/jwt-login`) |

> `main`, `development`는 직접 push 금지  
> 반드시 PR을 통해 병합하며 코드 리뷰 필수

---

## 📝 PR 작성 규칙

- PR 제목 형식: `[티켓ID] 작업 내용`
- 예: `[#11] JWT 로그인 기능 구현`
- PR 생성 시 티켓 상태 자동 업데이트

---

## 💬 커밋 규칙

커밋 메시지는 **한글**로 작성하고 다음 prefix를 사용합니다:

| Prefix     | 설명                                      |
| ---------- | ----------------------------------------- |
| `feat`     | 새로운 기능 추가                          |
| `fix`      | 버그 수정                                 |
| `docs`     | 문서 작업 또는 README 수정                |
| `refactor` | 코드 리팩토링 (기능 변화 없음)            |
| `config`   | 설정 파일 변경 (예: yml, build.gradle 등) |

예시:

```bash
git commit -m "feat: 회원가입 API 구현"
```

---

## 📌 협업 주의사항

- `.env`, `application-secret.yml` 등 민감 정보는 커밋 금지
- 모든 기능은 브랜치 분기 후 PR로 관리
- PR은 코드 리뷰 승인 후 병합
- 작업 후 **Notion에 기능 정리 필수**
- 모든 팀원은 서로의 정리 내용과 PR을 참고하여 **피드백 주고받기**

---

## 🔐 보안 설정 (GitHub)

- `main`, `development` 브랜치 보호 설정:

  - `Allow force pushes` ❌
  - `Allow deletions` ❌
  - `Require pull request before merging` ✅

- 레포지토리는 기본 `private` 유지
- DB 비밀번호, 시크릿 키 등은 환경파일에서 관리하고 절대 커밋 금지

---

## 📚 사용 스택

| 구분       | 기술 스택                             |
| ---------- | ------------------------------------- |
| 프레임워크 | Spring Boot 3.x                       |
| ORM        | JPA (Hibernate)                       |
| DB         | MySQL                                 |
| 보안       | Spring Security + JWT 인증            |
| 빌드 도구  | Gradle                                |
| API 문서화 | Swagger UI (`/swagger-ui/index.html`) |
| 기타       | Lombok, Validation, RestController 등 |

---

## ✅ 개발 체크리스트

- [ ] DB 모델링 및 엔티티 생성
- [ ] 공통 응답 DTO 설계
- [ ] Swagger 문서 자동화
- [ ] 회원가입 / 로그인 / 인증 API 개발
- [ ] CORS / JWT 필터 적용
- [ ] 기능 단위 테스트 코드 작성
- [ ] Notion에 기능 정리

---

## 📅 회의 일정 및 협업 규칙

- ✅ **매주**: 각자 개발한 기능 정리 → Notion 업로드
- ✅ **모든 팀원**: 서로의 노션 문서를 참고하여 피드백 주고받기
- ✅ **2주마다**: 온라인 미팅 진행 (기능 공유 및 피드백)
- ✅ **한 달에 1회**: 전체 회의 필수 참석 (중간 회의 불참자 포함)

---

## 📞 문의 및 연락

- 팀장: 윤상우
- GitHub: https://github.com/ICC-SupportHub
- Notion: (팀 노션 링크 삽입)
- 이메일: example@email.com

---
