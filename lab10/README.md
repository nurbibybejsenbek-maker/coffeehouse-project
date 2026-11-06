# №10 зертханалық жұмыс — CoffeeHouse: CI/CD және DORA

Команда: Естемес Назгүл (PM/QA), Жаукарбекова Элеонора (BA/Frontend), Бейсенбек Нұрбиби (SA/Backend).

Метрикалар GitHub API-дан есептеледі. Қолмен толтырылған мақсат жоқ. CI жасыл болуы өндірістік орналастыру емес.

## Іске қосу

```bash
cd lab10
./run.sh
# http://127.0.0.1:8091
```

Қадамдап:

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/collect_dora.py
.venv/bin/python scripts/verify.py
.venv/bin/streamlit run dashboard/app.py
```

Жеке репозиторий немесе rate limit болса: `GITHUB_TOKEN` орта айнымалысы. Токенды файлға жазбаңыз және `git remote` URL ішіне салмаңыз.

## Артефакт қайда

| Талап | Жол |
|---|---|
| Құбыржол: линтер, тест, құрастыру, OSV-Scanner, Trivy, артефакт | `.github/workflows/ci.yml` |
| Телефон нөмірін қалыпқа келтіретін тест | `tests/normalize-phone.test.ts` |
| main қорғауының ережесі | `lab10/branch-protection.json` |
| Ережені GitHub-қа қою | `python lab10/scripts/apply_branch_protection.py` |
| Ревью үлгісі және code owners | `.github/pull_request_template.md`, `.github/CODEOWNERS` |
| DORA есебі, график, JSON | `lab10/output/` |
| Streamlit дашборды | `lab10/dashboard/app.py` |
| Релиз жоспары | `lab10/release/release-plan.md` |
| Кері қайтару чек-парағы | `lab10/release/rollback-checklist.md` |

Репозиторий ашық (`nurbibybejsenbek-maker/coffeehouse-project`), сондықтан GitHub-hosted runner қолданылады. Орнату — репозиторийде бұрыннан бар `pnpm-lock.yaml` арқылы.

## Қорғау туралы шешім

`enforce_admins` өшірулі. Иесі жалғыз әкімші және өз PR-ын өзі бекіте алмайды. Write рөліндегі @Eleonoranr және @estemesnazgul-debug main-ге тікелей жібере алмайды: бір бекіту, жасыл үш тексеру, шешілген пікір, force-push жоқ.
