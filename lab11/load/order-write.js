import http from "k6/http";
import { check, sleep } from "k6";

// Жазу жүктемесі. Әдепкіде іске қосылмайды: әр итерация тапсырыс жазады.
// Релиз алдында, демо дерекпен: ALLOW_WRITES=1 k6 run lab11/load/order-write.js
// Тапсырыс SLO: сәтті POST p95 ≤ 800 мс.

const baseUrl = __ENV.BASE_URL || "http://127.0.0.1:3000";
const orderP95 = __ENV.ORDER_P95_MS || "800";

export const options = {
  scenarios: {
    order_write: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 1),
      duration: __ENV.DURATION || "20s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:order}": [`p(95)<${orderP95}`],
  },
};

export function setup() {
  if (__ENV.ALLOW_WRITES !== "1") {
    throw new Error("ALLOW_WRITES=1 керек. Скрипт тапсырыс жазады.");
  }
  const menu = http.get(`${baseUrl}/api/menu`);
  const items = menu.json();
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Мәзір бос, жазу жүктемесі тоқтады.");
  }
  return { menuItemId: items[0].id, unitPrice: items[0].price };
}

export default function (data) {
  const body = JSON.stringify({
    firstName: "Жүктеме",
    lastName: "Сынақ",
    phone: "+77000000011",
    email: "load@example.test",
    orderType: "PICKUP",
    paymentMethod: "CASH",
    items: [
      {
        menuItemId: data.menuItemId,
        quantity: 1,
        unitPrice: data.unitPrice,
        totalPrice: data.unitPrice,
      },
    ],
    totalAmount: data.unitPrice,
  });
  const response = http.post(`${baseUrl}/api/orders`, body, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "order" },
  });
  check(response, {
    "order 201": (item) => item.status === 201,
  });
  sleep(1);
}
