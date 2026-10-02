# Production Engineering, Evals & Security — Cumulative Task — Cumulative Part B

_Module 4, screen S18_

CumulativeModule-Wide·8 min

# Cumulative production-hardening task: write the corrected version

Write the corrected version of the application. For each defect you identified, show the fixed code and name what it changes.

Application from the previous screen (for reference)

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

Compare with model answer
Skip for now (final task)
