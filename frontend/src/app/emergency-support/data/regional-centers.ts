// 전국 17개 시·도 기본 커버리지용 샘플 데이터
// 지역별 상세 번호는 차후 보강 가능. 기본으로 전국 공통 대표번호를 제공해 "항상 결과가 나오도록" 설계.
export type RegionalCenter = {
  name: string
  phone: string
  hours?: string
  address?: string
  keywords?: string[]
  features?: string[]
  isNational?: boolean
}

export type RegionalGroup = {
  region: string
  centers: RegionalCenter[]
}

export const regionalCenters: RegionalGroup[] = [
  // 수도권
  { region: "서울", centers: [
      { name: "서울 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", features: ["전국대표","자·타해 위기"], isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", features: ["긴급복지","학대신고"], isNational: true },
    ]},
  { region: "경기", centers: [
      { name: "경기 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", features: ["전국대표"], isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", features: ["긴급복지"], isNational: true },
    ]},
  { region: "인천", centers: [
      { name: "인천 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", features: ["전국대표"], isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},

  // 강원권
  { region: "강원", centers: [
      { name: "강원 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},

  // 충청권
  { region: "세종", centers: [
      { name: "세종 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
  { region: "대전", centers: [
      { name: "대전 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
  { region: "충북", centers: [
      { name: "충북 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
  { region: "충남", centers: [
      { name: "충남 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},

  // 전라권
  { region: "광주", centers: [
      { name: "광주 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
  { region: "전북", centers: [
      { name: "전북 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
  { region: "전남", centers: [
      { name: "전남 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},

  // 경상권
  { region: "대구", centers: [
      { name: "대구 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
  { region: "부산", centers: [
      { name: "부산 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
  { region: "울산", centers: [
      { name: "울산 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
  { region: "경북", centers: [
      { name: "경북 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
  { region: "경남", centers: [
      { name: "경남 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},

  // 제주
  { region: "제주", centers: [
      { name: "제주 정신건강 위기상담(대표 연결)", phone: "1577-0199", hours: "24시간", isNational: true },
      { name: "보건복지상담센터(긴급복지)", phone: "129", hours: "24시간", isNational: true },
    ]},
]
