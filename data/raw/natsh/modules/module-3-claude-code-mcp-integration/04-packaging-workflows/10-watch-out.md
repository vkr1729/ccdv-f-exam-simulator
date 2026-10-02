# Claude Code, MCP & Integration — Packaging Workflows — Watch Out

_Module 3, screen S10_

Watch OutPackaging Workflows·3 min

## The plugin that installed on your machine and failed on everyone else’s

Setup

A plugin installed cleanly tells you the package was assembled correctly; however, it does not tell you the plugin will run effectively, because installation and execution are different things. The install copies files into place. Execution resolves the paths and variables those files point at, against the machine where they are running. When a plugin author bakes their own machine’s layout into a skill, the install still succeeds everywhere, but the execution fails everywhere except the author’s own setup. This gap occurs because it’s something the author can’t see.

## What happened

A developer built a deployment workflow skill, packaged it as a plugin, and tested it locally. Local testing passed, the plugin went out to the team through the internal marketplace, and every teammate’s install succeeded, but the moment any teammate ran the skill, it failed.

The root cause sat in the skill’s SKILL.md, in a command that pointed at `/Users/alexmorgan/projects/deploy-utils/validate.sh`.

That directory existed on the author’s machine and nowhere else. The skill carried an absolute path to the author’s home directory, so every teammate’s run looked for a file that was on their system or included in the skill.

A second skill in the same plugin leaned on an environment variable, `DEPLOY_TOKEN`, that the author had set in their own shell profile, and the plugin’s README never mentioned it. Three teammates spent two hours debugging before they traced the second failure to the missing variable.

The plugin incorrectly treated the author’s machine as the team’s machine, which caused the break. Both failures in the example above have the same root cause and the same absolute path. It sits in the SKILL.md as plain text, and a reviewer reading the file can catch it. The environment variable can be dangerous because nothing in the package announces the associated dependency, meaning the skill runs fine right up until the step that needs the variable, and only then does it fail. This is why it can cost three people two hours to fix.

What to Watch Out for

Any path reference in a skill, hook command, or plugin component must be relative to the project root or use an environment variable for the base path. Use `$CLAUDE_PROJECT_DIR` to reference scripts stored in the project, and `${CLAUDE_PLUGIN_ROOT}` for scripts bundled inside the plugin itself, so the path resolves correctly no matter whose machine runs it or what directory the session started in. Make sure any scripts, config files, or other assets the plugin depends on are either bundled inside the plugin or included in a shared project location, so every teammate can access the same files after install. Document every environment variable the plugin requires and validate it at install time so a missing one surfaces immediately instead of mid-run. Then test the install on a clean machine before distribution; this will catch any issues that the build machine may be hiding.
