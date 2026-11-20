"""gpt-4.1-mini сұранысының токенін tiktoken-пен санау.

OpenAI чат үстемесі: әр хабарламаға 3 токен және жауапты бастауға 3 токен.
Бұл cookbook есебі, шикі мәтіннен бөлек көрсетіледі.
"""

from __future__ import annotations

import tiktoken

CHAT_MODEL = "gpt-4.1-mini"
TOKENS_PER_MESSAGE = 3
REPLY_PRIMING = 3


def encoding():
    try:
        return tiktoken.encoding_for_model(CHAT_MODEL)
    except KeyError:
        return tiktoken.get_encoding("o200k_base")


def count_text(text: str) -> int:
    return len(encoding().encode(text))


def count_messages(messages: list[dict[str, str]]) -> int:
    enc = encoding()
    total = REPLY_PRIMING
    for message in messages:
        total += TOKENS_PER_MESSAGE
        total += len(enc.encode(message["role"]))
        total += len(enc.encode(message["content"]))
    return total
