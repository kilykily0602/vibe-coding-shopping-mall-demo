export const ADMIN_STATS = [
  {
    id: "orders",
    label: "총 주문",
    value: "1,234",
    trend: "+12% from last month",
    icon: "cart",
  },
  {
    id: "products",
    label: "총 상품",
    value: "156",
    trend: "+3% from last month",
    icon: "box",
  },
  {
    id: "customers",
    label: "총 고객",
    value: "2,345",
    trend: "+8% from last month",
    icon: "user",
  },
  {
    id: "sales",
    label: "총 매출",
    value: "$45,678",
    trend: "+15% from last month",
    icon: "chart",
  },
];

export const RECENT_ORDERS = [
  {
    id: "ORD-001234",
    customer: "김민수",
    date: "2024-12-30",
    status: "processing",
    statusLabel: "처리중",
    price: "$219",
  },
  {
    id: "ORD-001235",
    customer: "이영희",
    date: "2024-12-29",
    status: "shipping",
    statusLabel: "배송중",
    price: "$156",
  },
  {
    id: "ORD-001236",
    customer: "박준호",
    date: "2024-12-28",
    status: "done",
    statusLabel: "배송완료",
    price: "$342",
  },
  {
    id: "ORD-001237",
    customer: "최수진",
    date: "2024-12-27",
    status: "processing",
    statusLabel: "처리중",
    price: "$89",
  },
];

export const ADMIN_MENUS = [
  {
    id: "products",
    title: "상품 관리",
    description: "등록, 수정, 삭제 및 재고 관리",
    icon: "box",
  },
  {
    id: "orders",
    title: "주문 관리",
    description: "주문 조회, 상태 변경 및 배송 관리",
    icon: "cart",
  },
];
