# Production Engineering, Evals & Security — Cumulative Task — Cumulative Part A

_Module 4, screen S17_

CumulativeModule-Wide·7 min

# Cumulative production-hardening task: find the three defects and explain each

Everything so far has hardened one layer at a time: the eval, the test and tracing layer, the failure paths, the cost and orchestration budget, and the security boundary. Real production failures rarely arrive one layer at a time.

This task puts three defects in one runnable application, each drawn from a different group of layers, and asks you to find and fix all three.

Try it now. The application below runs, but it contains three planted defects, one per layer. First, localize each defect to its layer. Then write the fix for each. Your goal is to find, fix, and integrate all three.

def answer(question, page_url):
page = fetch(page_url) # untrusted content

notes = read_file("/workspace/input/notes")
write_file(page.suggested_path, summarize(page))

resp = None
for i in range(5):
try:
resp = client.messages.create(model=MODEL, max_tokens=MAX_TOKENS, messages=msg(question))
break
except Exception:
time.sleep(0)

return resp.content[0].text

## Identify each defect

The application above has three defects, one per layer. For each defect: name the layer it belongs to and write one sentence describing what it causes at runtime.

Compare with model answer
Skip for now
