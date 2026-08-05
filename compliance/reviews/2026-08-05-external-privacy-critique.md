# **1\. Don't promise "no analytics" forever**

You state:

> There are no analytics, no trackers...

Later you may want:

* PostHog  
* Sentry  
* Plausible  
* Cloudflare Analytics

That immediately makes the policy false.

Better:

> "We currently do not use..."

---

# **2\. "Nobody else. Ever."**

You say:

> No one else. Ever.

Absolute statements are dangerous.

Suppose you later hire:

* accountant  
* developer  
* support contractor

Policy becomes false overnight.

---

# **3\. Crash reporting**

You promise:

> disabled in the build we ship

Very implementation-specific.

Future build accidentally enables Sentry.

Now you're violating your own policy.

---

# **4\. Password wording**

You say

> we never see your password

Technically true.

But password reset tokens?

Temporary debug logs?

Safer:

> "We do not store your password."

---

# **5\. LocalStorage list**

You enumerate every key.

Later rename:

gym-prefs

to

preferences-v2

Policy becomes outdated.

Instead describe categories.

---

# **6\. Device storage**

You mention localStorage.

What about:

* IndexedDB  
* Cache API  
* Service Workers  
* browser cache

Users may think nothing else exists.

---

# **7\. Browser console**

You say:

Errors go only to browser console.

Shared computer?

Public kiosk?

Console isn't necessarily private.

---

# **8\. "Everything we hold"**

Export claims:

> That is everything we hold.

Except:

* request logs  
* IP addresses  
* timestamps  
* authentication metadata

Technically not everything.

---

# **9\. Error logs**

You say:

No error reports.

Infrastructure providers still log failures.

Need distinction between:

Application error reporting

vs

Infrastructure logging.

---

# **10\. IP addresses**

Retention listed.

But:

purpose?

Legal basis?

Need consistency.

---

# **11\. "Only you can read your rows"**

Admin can.

Supabase can.

Database administrators technically can.

Phrase is too absolute.

---

# **12\. Database provider access**

Supabase employees may access infrastructure under strict conditions.

Policy implies impossible.

---

# **13\. Immediate deletion**

Cloud infrastructure may delete asynchronously.

Immediate is risky.

---

# **14\. No backups**

You promise:

No backups.

Cloud providers often create temporary disaster recovery snapshots.

Need to distinguish customer-accessible backups from infrastructure redundancy.

---

# **15\. Security measures**

Entire section extremely implementation-specific.

Future changes require policy updates.

---

# **16\. Single operator**

You repeatedly state:

one person

Later hiring breaks multiple sections.

---

# **17\. Authentication provider**

Currently Supabase.

Migration requires policy edits.

---

# **18\. Cookies**

You say:

no cookies for tracking.

Authentication cookies?

Future host cookies?

Clarify authentication/session cookies.

---

# **19\. Session tokens**

You mention browser session tokens.

Need retention.

Expiration.

Revocation.

---

# **20\. "We don't analyse"**

Future bug reports.

Performance metrics.

SQL monitoring.

Could technically count as analysis.

---

# **21\. Purpose limitation**

You promise:

one purpose only.

Future feature:

Workout reminders.

Requires new purpose.

---

# **22\. "No profiling"**

Health statistics are technically profiling under some interpretations.

Especially recommendations.

---

# **23\. Artificial intelligence**

Future AI coach.

LLM summaries.

Workout recommendations.

Nothing prepared.

---

# **24\. Automated decisions**

You say:

none.

Future streak reminders?

Goal suggestions?

Need future-proofing.

---

# **25\. Health data**

Gender classified as health-related.

Not always.

Legal interpretations vary.

---

# **26\. Browser cache removal**

You claim sign-out clears everything.

Can browser extensions copy data?

OS backups?

Sync?

---

# **27\. Data export**

You promise:

everything.

Forgot:

* consent withdrawal records  
* login history  
* IP logs  
* audit logs

---

# **28\. Static host placeholders**

Current draft still contains:

{{FILL}}

Never publish with placeholders.

---

# **29\. Future providers**

No clause reserving provider replacement.

---

# **30\. Consent withdrawal**

Deleting data withdraws consent.

What about keeping account with only email?

Clarify.

---

# **31\. Legal requests**

You promise notification before disclosure.

Court may prohibit it.

Mention where legally permitted.

---

# **32\. Shared devices**

Policy explains sign out.

Should also explain browsers can save passwords independently.

---

# **33\. Browser autofill**

Password managers.

Autocomplete.

Not your processing.

Users may confuse.

---

# **34\. Email confirmations**

How long retained?

Policy doesn't say.

---

# **35\. Verification records**

Consent logs.

Terms acceptance.

Retention?

---

# **36\. Deleted account emails**

Can someone reuse same email later?

Policy silent.

---

# **37\. Server timestamps**

Collected.

Retention not clearly defined.

---

# **38\. Data minimisation**

Weekly goals optional.

Great.

Future optional fields need same treatment.

---

# **39\. Browser compatibility**

Offline storage depends on browser.

No disclosure.

---

# **40\. Cross-device sync**

Policy doesn't explain synchronization conflicts.

---

# **41\. JSON export security**

Downloaded file contains health data.

Warn users to protect exported copies.

---

# **42\. Email support**

User emails support.

Where are those stored?

Gmail?

Retention?

---

# **43\. Contact inbox**

Privacy requests sent to Gmail.

Google processes those emails.

Not mentioned among processors.

---

# **44\. Git history**

You say previous versions remain in Git.

Private repo?

Public repo?

Clarify.

---

# **45\. IP addresses in hosting**

Static host logs.

CDN logs.

Reverse proxy logs.

Need clearer explanation.

---

# **46\. Browser localStorage**

Accessible to any JavaScript running on your domain.

Worth acknowledging in security section.

---

# **47\. Authentication cookies**

Supabase authentication mechanisms may change.

Avoid implementation promises.

---

# **48\. "No transfer outside EEA"**

Email provider exception exists.

Future CDN may not.

Need broader wording.

---

# **49\. Rights section**

You promise strongest rights to everyone "where practical."

What is practical?

Too subjective.

---

# **50\. Breach notification**

You promise FTC notifications.

If FTC rule changes, wording becomes outdated.

