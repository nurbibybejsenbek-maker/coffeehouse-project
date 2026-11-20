# №12 зертханалық жұмыс. CoffeeHouse: пікір модерациясының жоспары

Команда: Естемес Назгүл (PM), Жаукарбекова Элеонора (BA), Бейсенбек Нұрбиби (SA).

Функция: қонақ пікірін `publish` / `hold` / `reject` деп ұсыну. Жариялауды адам басады. Өлшем Ollama ішіндегі `qwen2.5:3b` модельінде, 20 қараша 2026. v2 макро-F1 0,797, `reject` recall 0,833. Шешім: ұсыныс пилотын ашамыз, автоматты жариялау жоқ.

## Іске қосу

Тест пен қайта есептеу модельді қажет етпейді:

```bash
cd lab12
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest
.venv/bin/python scripts/verify.py
```

Өлшемді қайталау, Ollama қосулы және модель жүктелген болса:

```bash
ollama pull qwen2.5:3b
.venv/bin/python scripts/run_eval.py --prompt v1
.venv/bin/python scripts/run_eval.py --prompt v2
.venv/bin/python scripts/score.py
.venv/bin/python scripts/cost_report.py
```

## Артефакт қайда

| Талап | Жол |
|---|---|
| Функция карточкасы және тәуекел | `docs/function-card.md` |
| Эталон, 36 мысал | `data/eval-set.json` |
| Жүргізуден бұрынғы шек | `data/acceptance.json` |
| Шикі жауап | `output/raw-v1.jsonl`, `output/raw-v2.jsonl` |
| Өлшем | `output/eval-results.json` |
| Тариф және құн | `data/tariffs.json`, `docs/cost.md`, `output/cost.json` |
| Істейміз / істемейміз | `docs/adr/0001-review-moderation-pilot.md` |
