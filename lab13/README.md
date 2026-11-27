# №13 зертханалық жұмыс. CoffeeHouse: PM-нің статус ассистенті

Команда: Естемес Назгүл (PM), Жаукарбекова Элеонора (BA), Бейсенбек Нұрбиби (SA).

Жұмыс: өткен екі спринттің статус нобайы. Санды Python жинайды, Ollama ішіндегі `qwen2.5:3b` мәтін жазады. 2026-11-27 прогонында нобай жіберуге жарамады: 24 тұжырымның 19-ы жоқ, қате немесе жартылай. Журнал: `docs/verification.md`.

## Іске қосу

```bash
cd lab13
python3 scripts/run_status.py --facts-only
python3 scripts/run_status.py --draft-only
```

Ollama қосулы және `qwen2.5:3b` жүктелген болуы керек. `GITHUB_TOKEN` орта айнымалысы болса, API сол токенмен саналады. Болмаса, жария репозиторийге токенсіз сұраныс кетеді. Токен файлға жазылмайды.

Тест:

```bash
python3 -m pytest
```

## Артефакт қайда

| Талап | Жол |
|---|---|
| Жұмыс процесі және нұсқаулық | `docs/guide.md` |
| Промпт үлгісі | `prompts/status_v1.txt` |
| Факті мен BRIEF | `output/facts.json`, `output/brief.md` |
| Модель нобайы | `output/draft.md`, ашып көрсетумен `output/status-report.md` |
| Үзілген бірінші прогон | `output/draft-run1.md` |
| Адам жазған бақылау мәтіні | `output/manual-status.md` |
| Дәлсіздік журналы | `docs/verification.md` |
| Уақыт есебі | `docs/time.md` |
| Дүйсенбілік факті жинау | `.github/workflows/pm-status.yml` |
