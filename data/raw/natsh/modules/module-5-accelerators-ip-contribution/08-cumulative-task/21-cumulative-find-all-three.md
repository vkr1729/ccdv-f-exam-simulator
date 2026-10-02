# Accelerators & IP Contribution — Cumulative Task — Cumulative: find all three

_Module 5, screen S17_

CumulativeAll topics·6 min

# Cumulative task: Find all three, explain each, write the correction

Below is a runnable packaged accelerator deployed across platforms. There are three planted defects: one in the packaging layer, one in the deployment-and-versioning layer, and one in the multi-component boundary layer. Your task is to find all three.

The deployment as shipped

# Packaged code-review accelerator, deployed for a regulated AWS customer
def build_agent():
return Agent(
model="opus",
system_prompt=SYSTEM_PROMPT,
repo_path="/home/acme/checkout",
tools=[read_file, run_linter],
)

deploy(platform="amazon_bedrock", identity=aws_role_arn)

# multi-component step: Claude Code task fetches a customer page
fetched = code_task.run(fetch_url=customer_page)
next_call(input=fetched)

Carry your three corrected lines into the next screen, where you assemble and verify the fixed deployment.

In your own words, identify all three defects.

Reveal model answer
Skip for now
