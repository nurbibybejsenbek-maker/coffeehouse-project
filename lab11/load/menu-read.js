import http from "k6/http";
import { check, sleep } from "k6";

// Мәзір SLO: p95 ≤ 400 мс (8-апта). Жергілікті sqlite баяу болса,
// бір реттік қарау үшін MENU_P95_MS=2000 беріңіз. Релиз қақпасы 400.

const baseUrl = __ENV.BASE_URL || "http://127.0.0.1:3000";
const menuP95 = __ENV.MENU_P95_MS || "400";

export const options = {
  scenarios: {
    menu_read: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 5),
      duration: __ENV.DURATION || "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:menu}": [`p(95)<${menuP95}`],
  },
};

export default function () {
  const menu = http.get(`${baseUrl}/api/menu`, { tags: { name: "menu" } });
  check(menu, {
    "menu 200": (response) => response.status === 200,
  });

  const invalid = http.post(`${baseUrl}/api/orders`, "{}", {
    headers: { "Content-Type": "application/json" },
    tags: { name: "order_invalid" },
  });
  check(invalid, {
    "empty order is 400": (response) => response.status === 400,
  });

  sleep(1);
}
