# Extracted verbatim from boss-agent-cli, Copyright (c) 2026 can4hou6joeng4.
# MIT License: ../licenses/boss-agent-cli-MIT.txt
# Source: https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/search_filters.py
# Only standalone symbols are retained; imports below are extraction scaffolding.

WELFARE_KEYWORDS: dict[str, list[str]] = {
	"双休": ["双休", "周末双休", "五天工作制", "5天工作制"],
	"五险一金": ["五险一金"],
	"五险": ["五险一金", "五险"],
	"年终奖": ["年终奖"],
	"带薪年假": ["带薪年假"],
	"餐补": ["餐补", "包吃", "免费午餐"],
	"住房补贴": ["住房补贴", "住房补助"],
	"定期体检": ["定期体检"],
	"股票期权": ["股票期权"],
	"加班补助": ["加班补助"],
}

def resolve_welfare_keywords(label: str) -> list[str]:
	"""Resolve a welfare label to matching keywords."""
	return WELFARE_KEYWORDS.get(label, [label])

def _check_welfare_in_text(keywords: list[str], text: str) -> bool:
	return any(kw in text for kw in keywords)

def match_all_welfare(
	conditions: list[tuple[str, list[str]]],
	welfare_list: list[str],
	description: str,
) -> list[str]:
	"""Check all welfare conditions (AND). Returns match descriptions or empty list."""
	text = " ".join(welfare_list)
	full_text = text + " " + description
	results = []
	for label, keywords in conditions:
		if _check_welfare_in_text(keywords, text):
			results.append(f"{label}(标签)")
		elif description and _check_welfare_in_text(keywords, full_text):
			results.append(f"{label}(描述)")
		else:
			return []
	return results
