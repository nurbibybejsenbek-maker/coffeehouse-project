# №11 зертханалық жұмыс — CoffeeHouse: тестілеу, UAT, postmortem

Команда: Естемес Назгүл (PM/QA), Жаукарбекова Элеонора (BA/Frontend), Бейсенбек Нұрбиби (SA/Backend).

Қабылдау мен пайдалану релизден кейін емес, осы аптада жоспарланады. Postmortem кінәлі іздемейді. Үш әрекеттің иесі мен мерзімі бэклогта.

## Іске қосу

```bash
cd lab11
./run.sh
```

Қадамдап:

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest
.venv/bin/python scripts/verify.py
```

Uptime Kuma, қолданба 3000 портта тұрғанда:

```bash
docker compose -f monitoring/docker-compose.yml up -d
# http://127.0.0.1:3001
```

Әкімші тіркелгісін UI-де қойыңыз. Құпиясөзді файлға жазбаңыз. Зондтар: `monitoring/monitors.json`.

```bash
k6 run lab11/load/menu-read.js
cd e2e && npm install && npm run install-browser && npx playwright test
# 3000 порт бос болмаса: жоба түбінде PORT=3010 npm run dev
# содан lab11/e2e ішінде: BASE_URL=http://127.0.0.1:3010 npx playwright test
```

Bruno жинағы: `lab11/bruno/coffeehouse`, орта `Demo`.

## Артефакт қайда

| Талап | Жол |
|---|---|
| Тестілеу жоспары | `docs/test-plan.md` |
| UAT сценарийлері және хаттама | `docs/uat-protocol.md`, `data/uat-scenarios.json` |
| Ескертулер, severity, басымдық, SLA | `data/defects.json` |
| Postmortem әрекеттері бэклогта | `docs/postmortem.md`, `data/backlog.json` |
| Runbook, бір сценарий | `docs/runbook.md` (`RB-ORDER-5XX`) |
| pytest | `tests/`, `quality/` |
| Playwright | `e2e/` |
| k6 | `load/menu-read.js`, `load/order-write.js` |
| Bruno | `bruno/coffeehouse/` |
| Uptime Kuma | `monitoring/docker-compose.yml` |

CI осы пакетті `quality-lab11` жұмысында жүгіреді.

## Шешім

13 қараша UAT **қабылданбады**: ашық S2 екеу, DEF-11-01 және DEF-11-02. S3 және чекке балл сұраған CR-11-01 тоқтатпайды. Қайта қабылдау 20 қараша, екі S2 жабылған соң.
