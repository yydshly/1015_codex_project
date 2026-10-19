# Extracted verbatim from boss-agent-cli, Copyright (c) 2026 can4hou6joeng4.
# MIT License: ../licenses/boss-agent-cli-MIT.txt
# Source: https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/api/cdp_risk_lock.py
# Only standalone symbols are retained; imports below are extraction scaffolding.

import hashlib
from dataclasses import dataclass
ABSENT_STOKEN = "absent"

def hash_stoken(value: str | None) -> str:
	"""stoken → SHA-256 十六进制摘要；没有值时返回 ``ABSENT_STOKEN``。"""
	if not value:
		return ABSENT_STOKEN
	return hashlib.sha256(value.encode("utf-8")).hexdigest()

@dataclass(frozen=True)
class RiskLock:
	"""一把 code 37 锁。``stoken_sha256 is None`` 表示记录时读不到 Chrome cookie。"""

	stoken_sha256: str | None
	locked_at: float
	cdp_url: str | None = None
	corrupt: bool = False

	def matches(self, current_hash: str | None) -> bool:
		"""当前 stoken 是否仍是被拦截的那一个（读不到 / 记录不全时按「仍被锁」处理）。"""
		if self.corrupt or self.stoken_sha256 is None or current_hash is None:
			return True
		return current_hash == self.stoken_sha256
