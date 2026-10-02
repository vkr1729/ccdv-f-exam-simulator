# Accelerators & IP Contribution — Contributing Back — Watch Out: the PR a maintainer could not verify

_Module 5, screen S06_

Watch OutContributing Back·2 min

## The pull request a maintainer could not verify

Setup

You opened the contribution with the exact code that solved your problem. This was the natural choice because it worked in your case and it was accessible. It worked for you, but that is precisely why it was missing everything a stranger needs to trust it.

This is an exchange from an internal channel so you can hear how a maintainer explains the silence on a pull request.

### The exchange

Developer: My PR has been open three weeks with no review. The code works, I use it every day. What is the holdup?
Maintainer: It probably works for you. The problem is I can’t tell. There is no test I can run, no example that proves the behavior, and nothing saying what it assumes about the environment.
Developer: So, you want me to add a test and an example?
Maintainer: Yes. A contribution a reviewer cannot verify sits at the back of the queue until someone has time to reconstruct what it does. A focused PR with a test and an example gets reviewed fast because there is nothing left for me to reverse-engineer.

Why it broke

The code was correct. The contribution stalled because the maintainer could not verify it without reconstructing the developer's work. That gap is easy to overlook because the author already has the missing context. The example, the test, and the assumptions statement all seem obvious to the person who created the code. To the maintainer, however, they are not, and a reviewer who must reconstruct intent will always do it last.

What to Watch Out for

A pull request stalls on what the reviewer cannot verify. Before opening a contribution, add the example that shows it running, the test that proves the behavior, and the short statement naming what it assumes. Those three features are what move a contribution from the back of the queue to a fast review, because they leave the maintainer nothing to reverse-engineer.
