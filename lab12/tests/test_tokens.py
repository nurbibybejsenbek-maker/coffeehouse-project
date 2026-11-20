from quality.tokens import count_messages, count_text


def test_tiktoken_counts_the_commercial_tokenizer():
    assert count_text("latte") > 0
    longer = count_text("latte " * 20)
    shorter = count_text("latte")
    assert longer > shorter


def test_chat_overhead_is_added_on_top_of_the_text():
    messages = [
        {"role": "system", "content": "policy"},
        {"role": "user", "content": "comment"},
    ]
    bare = count_text("policy") + count_text("comment")
    assert count_messages(messages) > bare
