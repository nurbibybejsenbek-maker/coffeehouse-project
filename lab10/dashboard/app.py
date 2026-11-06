"""CoffeeHouse DORA дашборды. Сандарды output/metrics.json файлынан оқиды."""

from __future__ import annotations

import json
from pathlib import Path

import streamlit as st

LAB = Path(__file__).resolve().parents[1]
METRICS_PATH = LAB / "output" / "metrics.json"
REPORT_PATH = LAB / "output" / "dora-report.md"
PLAN_PATH = LAB / "release" / "release-plan.md"
ROLLBACK_PATH = LAB / "release" / "rollback-checklist.md"

LEVEL_COLOR = {
    "Elite": "#1b7f4e",
    "High": "#0f766e",
    "Medium": "#b45309",
    "Low": "#9b2226",
    "дерек жеткіліксіз": "#4b5563",
}


def load_metrics() -> dict:
    if not METRICS_PATH.exists():
        st.error("Алдымен `python scripts/collect_dora.py` командасын іске қосыңыз.")
        st.stop()
    return json.loads(METRICS_PATH.read_text(encoding="utf-8"))


def badge(level: str) -> str:
    color = LEVEL_COLOR.get(level, "#4b5563")
    return (
        f"<span style='background:{color};color:white;padding:2px 8px;"
        f"border-radius:999px;font-size:0.85rem'>{level}</span>"
    )


def show_metric(column, title: str, value: str, level: str, caption: str) -> None:
    column.metric(label=title, value=value)
    column.markdown(badge(level), unsafe_allow_html=True)
    column.caption(caption)


def main() -> None:
    st.set_page_config(page_title="CoffeeHouse DORA", layout="wide")
    metrics = load_metrics()
    df = metrics["deployment_frequency"]
    lead = metrics["lead_time"]
    cfr = metrics["change_failure_rate"]
    mttr = metrics["time_to_restore"]

    st.title("CoffeeHouse — жеткізу метрикалары")
    st.caption(
        f"{metrics['repository']} · соңғы {metrics['window']['days']} күн · "
        f"есептелген {metrics['generated_at']}"
    )
    st.warning(metrics["usage_policy"])

    left, right = st.columns([2, 1])
    with left:
        st.subheader("Төрт метрика")
        cfr_text = "—" if cfr["ratio"] is None else f"{cfr['ratio'] * 100:.0f}%"
        mttr_text = "—" if mttr["median_hours"] is None else f"{mttr['median_hours']} сағ"
        lead_text = "—" if lead["median_hours"] is None else f"{lead['median_hours']} сағ"
        top = st.columns(2)
        bottom = st.columns(2)
        show_metric(
            top[0],
            "Орналастыру жиілігі",
            f"{df['per_week']}/апта",
            df["level"],
            f"{df['production_deployments']} прод деплой",
        )
        show_metric(top[1], "Lead time", lead_text, lead["level"], f"{lead['sample_count']} үлгі")
        show_metric(
            bottom[0],
            "Сәтсіз өзгеріс",
            cfr_text,
            cfr["level"],
            "үлес есептелмейді" if cfr["ratio"] is None else f"{cfr['failed']} / {cfr['total']}",
        )
        show_metric(
            bottom[1],
            "Қалпына келтіру",
            mttr_text,
            mttr["level"],
            f"{mttr['sample_count']} үлгі",
        )
        diagnostic = lead.get("diagnostic")
        if diagnostic:
            st.info(
                f"Шықпаған өзгерістің жасы {diagnostic['age_days']} күн. "
                f"Бүгін продқа шықса, lead time деңгейі {diagnostic['lower_bound_level_if_deployed_now']} болар еді. "
                f"{diagnostic['note']}"
            )
        chart_dir = LAB / "output" / "charts"
        images = st.columns(3)
        for column, name in zip(
            images, ("activity_weekly.png", "levels.png", "lead_time_bound.png")
        ):
            path = chart_dir / name
            if path.exists():
                column.image(str(path), width="stretch")
    with right:
        st.subheader("Дереккөз")
        sources = metrics["sources"]
        st.markdown(
            f"- Коммит: **{sources['github_commits']}**\n"
            f"- PR: **{sources['pull_requests']}**\n"
            f"- Release: **{sources['releases']}**\n"
            f"- Deployment: **{sources['deployment_records']}**\n"
            f"- Actions: **{sources['workflow_runs']}**\n"
            f"- main қорғауы: **{'қосулы' if metrics['branch_protection']['enabled'] else 'өшірулі'}**"
        )
        devex = metrics["devex"]
        st.subheader("DevEx сигналы")
        feedback = devex["median_feedback_minutes"]
        st.markdown(
            f"CI кері байланысы: **{feedback if feedback is not None else '—'}** мин.  \n"
            f"Сәтті / сәтсіз іске қосу: {devex['ci_success']} / {devex['ci_failure']}."
        )
        st.caption("Жасыл CI өндірістік орналастыруға жатпайды.")

    tab_improve, tab_devex, tab_release, tab_rollback, tab_report = st.tabs(
        ["Жақсартулар", "DevEx және SPACE", "Релиз жоспары", "Кері қайтару", "Есеп"]
    )
    labels = {
        "deployment_frequency": "Орналастыру жиілігі",
        "lead_time": "Lead time",
        "change_failure_rate": "Сәтсіз өзгеріс үлесі",
        "time_to_restore": "Қалпына келтіру уақыты",
    }
    with tab_improve:
        for key, title in labels.items():
            st.markdown(f"### {title}")
            for item in metrics["improvements"][key]:
                st.markdown(f"**{item['title']}**")
                st.write(item["action"])
                st.success(item["expected_effect"])
    with tab_devex:
        st.markdown("### PM нақты нені жылжытады")
        st.markdown(
            f"1. **Құрастыру уақыты.** Мақсат < 15 минут. Қазір: "
            f"{devex['median_feedback_minutes'] if devex['median_feedback_minutes'] is not None else 'өлшем жоқ'}.\n"
            f"2. **Орта.** {devex['environment_note']}\n"
            "3. **Талап.** PR үлгісінде қабылдау критерийі бар. PR саны әзірге 0.\n"
            "4. **Үзіліс.** Прод терезесі сейсенбі 15:30–16:30. Апта ортасында тосын релиз жоқ."
        )
        st.markdown("### SPACE")
        for key, value in metrics["space"].items():
            st.markdown(f"- **{key}:** {value}")
        st.markdown("### Техқарыз броні")
        st.write(
            "Команда қуатының 20%-ы (аптасына 3 адам-күн) техқарыз бен сенімділікке. "
            "Бұл өлшенген үлес емес: PR әлі жоқ. Негіздеме — шықпаған өзгерістің жасы және "
            "қалпына келтіру жолының енді ғана жазылуы."
        )
    with tab_release:
        st.markdown(PLAN_PATH.read_text(encoding="utf-8"))
    with tab_rollback:
        st.markdown(ROLLBACK_PATH.read_text(encoding="utf-8"))
    with tab_report:
        if REPORT_PATH.exists():
            st.markdown(REPORT_PATH.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
