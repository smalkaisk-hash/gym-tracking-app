# FitPulse — Terms of Service

**Version 1.2 · Effective 4 September 2026 · Last updated 5 August 2026**

<!-- internal:start -->
> **NOT LEGAL ADVICE — no placeholders remain, but this has not been reviewed by a lawyer.**
> Every fact is filled: operator is Karlis Smalkais acting personally, governing law Latvia,
> EUR 100 liability cap, 10 working days / 30 days response times. The draft banner is off,
> so the published page no longer warns readers — if you reopen a clause, either fill it or
> restore the `legal:draft` HTML-comment marker on this line. (Write it as a real comment;
> it is deliberately not spelled out here, because the build script scans this file for that
> exact string before it strips internal notes, so even a mention inside this box counts.)
>
> **Version 1.2 (5 August 2026, effective 4 September 2026)** answers the v4 liability audit
> in [LEGAL-LIABILITY-AUDIT.md](../LEGAL-LIABILITY-AUDIT.md) Part D. Six changes, none of
> which imposes an obligation on the user or removes a right:
> **§ 2.2(a)** is made expressly subject to § 8.5 — the two clauses contradicted each other on
> whether these Terms or the Privacy Policy win on a data protection point, and D3/D4 are
> exactly such points (audit D6(d));
> **§ 12.7** grows from three limbs to five: support correspondence and the authentication
> provider's security log both survive a deletion, and the old list closed with "and nothing
> else", which was therefore false the moment anyone emailed us or signed in (audit D3, D4);
> **§ 13.1(a)** no longer warrants fitness against an App Store listing that does not exist
> for a web app (audit D6(c));
> **§ 17.3** is narrowed to business users and a new **§ 17.4** says plainly that a consumer
> outside the EEA/UK keeps their local rights — the old wording put exclusive Latvian
> jurisdiction on, say, a US consumer, which is a standard unconscionability hook and can
> taint the whole document. Old 17.4 becomes **17.5**; Schedule B.3.2 is rewritten to match
> (audit D6(b));
> **§ 19.8** adds 2.2, 8.5 and 11.2 to the survival list, so the clauses that decide a
> post-deletion retention dispute outlive the agreement that dispute is about (audit D6(e)).
>
> A second batch landed in the same unreleased v1.2, from the **v5** pass (Part E of the
> audit): **§ 12.9** now makes the dormancy warning a *condition* of the deletion rather
> than a courtesy — `scripts/dormant.mjs` refuses to delete an account with no recorded
> notice, and migration `0006` is the evidence table, so the rule is inert until a warning
> genuinely goes out; **§ 16.2** (and § 10.3, § 12.5(a), which now point at it) describe
> notice as in-app **and** by email where we can send one, because there is no outbound mail
> channel in the project and a clause promising one was unperformable; **§ 6.2** stops
> claiming ownership of individual exercise names and of third-party images and fonts; and
> **§ 8.9** stops purporting to take feedback "without attribution", which is a moral right
> that cannot be waived by contract in much of Europe.
>
> Sections 12, 13, 17 and 19 changed, and § 16.3 makes changes to 12, 13 and 17 material —
> so this needs affirmative acceptance, not just notice. `TERMS_VERSION` is bumped to 1.2 and
> `POLICIES_EFFECTIVE_FROM` is set to the effective date above in the same commit, which is
> what gives the § 16.2 thirty days and the in-app notice banner their meaning. The Service
> still has no users, so no notice was actually sent.
>
> **Still open and NOT fixed here — audit D6(a), and it wants a lawyer.** § 19.9 provides
> these Terms in English only, while § 17.1 chooses Latvian law and § 18.2 names PTAC as our
> supervisor. Latvia's Official Language Law requires consumer-facing information about a
> service to be given in the state language, and Directive 93/13 Art. 5 requires plain,
> intelligible language. English-only terms from a Latvian-established trader are therefore
> arguable both ways. Do not resolve this by machine-translating the document — a bad
> translation of a contract is worse than none, and § 19.9 would then have to say which
> language governs. Get advice, then either commission a Latvian version or accept the
> exposure knowingly and write the decision here.
>
> **Version 1.1 (2 August 2026)** answers an external review of v1.0. It imposes no new
> obligation on the user and removes no right: every change either defines a term v1.0 left
> vague (commercial use, material reduction, disproportionate load, anonymous), states a
> practice the code already has (device-clock dating, offline reconciliation, what survives
> deletion, what the export holds), or future-proofs a promise that was written against one
> implementation (security measures, export format, providers, browsers, free of charge), or
> says in plain language what a clause already meant — the § 14.4 note is the example: on a
> free service limb (a) is nil, so the cap is EUR 100, and a reader should not have to hold
> § 13.6 in their head eleven clauses later to work that out. Art. 5 of Directive 93/13
> requires consumer terms to be in plain, intelligible language, and a cap that talks about
> what you paid, in a contract for something with no price, is exactly the kind of clause
> that reads as opaque. It changes no substance and narrows no liability.
> `TERMS_VERSION` in `src/gym-tracker-app.tsx` is bumped to 1.1 in the same commit, so the
> acceptance record names the document the user actually read. No § 16.2 notice was sent
> because the Service is not deployed and has no users — once it has any, a v1.2 needs the
> 30 days, and §§ 8, 9, 12, 13 and 14 changed here, which § 16.3 makes material.
>
> Two open items that are NOT placeholders and so do not block the build:
> 1. [TERMS-RATIONALE.md](TERMS-RATIONALE.md) § 3 still reasons from **Spanish** law and
>    needs redoing against Latvian law. Schedule B was written against Latvian
>    establishment and does not depend on that rewrite, but the rationale should catch up.
> 2. [TERMS-RATIONALE.md](TERMS-RATIONALE.md) predates v1.1 and carries no reasoning for the
>    clauses it added: 4.2, 5.5–5.9, 6.4–6.7, 7.4–7.5, 8.7–8.9, 9.7–9.8, 10.6–10.8,
>    11.5–11.8, 12.7–12.9, 13.4–13.6, 14.7, 19.10–19.11 and 20.7.
>
> Resolved since: § 18.2 now names **PTAC**, and Schedule B collects every region-specific
> term in one place (see its own internal notes for the four rules it follows).
>
> See [TERMS-RATIONALE.md](TERMS-RATIONALE.md) for the reasoning behind every clause.
<!-- internal:end -->

<!-- The published page carries a shorter draft banner instead, injected by
     scripts/build-legal.mjs when it sees the legal:draft marker above. The block
     above stays in the repo copy because it is aimed at whoever edits this file,
     and it links to an internal document that is deliberately never published. -->

---

## Summary (not part of the agreement)

This box is a plain-English orientation. It is **not** legally binding and does not change
anything below. If it conflicts with the numbered terms, the numbered terms win.

- FitPulse is a workout and body-weight logging app. It is **not** medical advice and not a
  medical device.
- Exercise carries real risk of injury. You train at your own risk and should talk to a
  doctor before starting or changing a programme.
- Your workout data is yours. You can export it and delete your account at any time.
- We try hard not to lose your data, but you should keep your own exports. See section 11.
- FitPulse is for logging **your own** training. Using it to run other people's training, or
  as part of a service you charge for, is commercial use — see clause 6.4.
- Dates, streaks and the weekly goal are measured by **your device's clock and time zone**,
  not ours. Clause 9.7 explains what that means when you travel.
- If two of your devices edit the same session, the later change to reach our servers wins.
  Clause 11.8 sets out exactly how offline changes are reconciled.
- We can only change these Terms for the specific reasons listed in section 16, and we will
  tell you first.
- Nothing here takes away rights the law gives you as a consumer.

---

## 1. Who we are and how to reach us

FitPulse ("**FitPulse**", "**the Service**") is operated by **Karlis Smalkais**, a private
individual acting in a personal capacity, of Klusa Street 2a, Riga, LV-1007, Latvia
("**we**", "**us**", "**our**").

Contact for any matter under these Terms, including complaints: **smalkaisk@gmail.com**.

We will reply to any message about these Terms within **10 working days**.

## 2. What these Terms are, and what else forms our agreement

2.1 These Terms of Service ("**Terms**") are a binding contract between you and us. They
govern your access to and use of FitPulse.

2.2 Our agreement with you consists of, in this order of precedence where they conflict:

&nbsp;&nbsp;(a) these Terms, **except** that on any data protection matter clause 8.5
applies and the Privacy Policy governs;
&nbsp;&nbsp;(b) our [**Privacy Policy**](/privacy.html), which explains how we handle your
personal data and is incorporated into these Terms by reference;
&nbsp;&nbsp;(c) any additional terms we present to you and you accept for a specific
feature, which apply only to that feature.

The exception in (a) matters because the two documents describe overlapping ground: what we
hold, how long we hold it, and what survives a deletion are all set out in both. Where they
differ on such a point, the Privacy Policy is the one to rely on — it is the document written
to the standard the data protection law requires, and reading it as subordinate would let a
summary in these Terms narrow a disclosure the law obliges us to make in full.

2.3 If you obtained FitPulse through the Apple App Store or Google Play, the additional
terms in **Schedule A** also apply, and the store's own terms apply between you and the
store operator.

2.4 **Your consumer rights are not affected.** Nothing in these Terms excludes, restricts or
modifies any right or remedy you have under the mandatory consumer protection law of the
country where you live, and no clause below applies to the extent it would do so. Where a
clause is limited by this section, the rest of these Terms continues to apply.

2.5 **Where you live changes some of these Terms.** Consumer law is not the same everywhere,
and the differences are collected in **Schedule B** rather than scattered through the
document — so you can read one section and know what applies to you. Schedule B does not
give you fewer rights than the main Terms: where it changes a clause it says so, and where
it only confirms a right the law already gives you, it says that too.

## 3. How you accept these Terms

3.1 You accept these Terms by ticking the acceptance box and selecting **Create account**
on the sign-up screen. That action creates the contract.

3.2 We keep a record of which version of these Terms you accepted and when. You may request
a copy of that record and of the accepted version at any time via the contact address in
section 1.

3.3 If you do not accept these Terms, do not create an account or use FitPulse.

## 4. Who may use FitPulse

4.1 You may use FitPulse only if you are **18 or older** and legally able to enter into a
contract. FitPulse is not directed at, and must not be used by, anyone under 18.

4.2 **Which sanctions rules these are.** We are established in Latvia, so the regimes that
bind us are those of the **European Union** and the **United Nations**. You confirm that you
are not located in, or ordinarily resident in, a country or territory subject to a
comprehensive embargo under either of those regimes, and that you are not a person or entity
named on the **EU Consolidated Financial Sanctions List**, the **UN Security Council
Consolidated List**, or an equivalent restricted-parties list maintained under them. If you
obtained FitPulse from the Apple App Store or Google Play, the separate United States
confirmation in Schedule A.7 also applies to that copy, because those stores require it of
us. No other country's sanctions list is incorporated into these Terms.

4.3 If we learn that an account belongs to someone under 18, we will close it and delete
the associated data.

## 5. Your account

5.1 You must give accurate registration information and keep your email address current. We
send important notices — including notice of changes to these Terms — to that address.

5.2 You are responsible for keeping your password confidential and for activity that occurs
under your account, **except** activity that results from our own failure to keep the
Service secure, or that you could not reasonably have prevented.

5.3 Tell us promptly at **smalkaisk@gmail.com** if you believe your account has been accessed
without your authorisation.

5.4 One person, one account. Do not share your account or transfer it to anyone else.

5.5 **What happens if you break clause 5.4.** Sharing your account, letting someone else use
it, or transferring it is a material breach for the purposes of clause 12.2(a), so we may
suspend, restrict or terminate the account. Section 12 applies in full when we do: we act
proportionately, we give you notice and a chance to put it right unless 12.3 says otherwise,
and you may challenge the decision under 12.4. We would not suspend an account over a
one-off lapse that you have already fixed.

5.6 **Your email address is how you get back in.** If you forget your password, we send a
reset link to the address registered on the account, and following that link is the only way
to set a new one. We cannot see your password, and we cannot reset it for you. **If you lose
access to that mailbox we cannot verify that the account is yours, and we cannot restore
access to it** — there is no security question, no backup code and no identity-document
route, because we hold nothing to check them against. Two consequences worth acting on: keep
the address current under clause 5.1, and keep your own export under clause 11.2.

5.7 **Confirming your email address.** We may require you to confirm that the address you
registered is yours — before the account becomes usable, or later if we have reason to
believe the address is no longer yours or is being used to impersonate someone. Where
confirmation is pending, some functions may be unavailable until it is done. We use
confirmation only to check control of the address; it is not identity verification and we
do not ask you for identity documents.

5.8 **More than one account.** Clause 5.4 is aimed at sharing an account and at passing one
to someone else. It is not aimed at you having a second one of your own: creating a new
account because you lost access to the first, or to try something out, is not a breach of
these Terms. Creating one to evade a suspension or termination under section 12 is, and is
treated as a material breach under 12.2(a).

5.9 **Nothing you enter is shown to anyone else.** FitPulse has no public profiles, no
usernames, no sharing, no feed and no way for one user to see another's data. The display
name you choose is used only to greet you on your own screen. Because of that we place no
restrictions on what you call yourself beyond clause 7.1 — there is no one for a misleading
name to mislead. If we ever add a feature where something you write becomes visible to
another person, that is a material change under clause 16.3, and it would come with rules
about names and content before it shipped.

## 6. Your licence to use FitPulse

6.1 We grant you a **personal, non-exclusive, non-transferable, non-sublicensable, revocable
licence** to install and use FitPulse on devices you own or control, for your own personal,
non-commercial fitness tracking, for as long as these Terms are in force.

6.2 FitPulse is **licensed, not sold**. We and our licensors keep whatever intellectual
property rights exist in the Service — its software, its design, the selection and
arrangement of its exercise catalogue, and its text. You get no rights other than those
expressly granted in clause 6.1.

Two honest limits on that sentence, because a licence clause that claims more than it has is
worth less, not more. **Individual exercise names are not ours** — "Bench Press" is a fact
about the world, and nothing in this clause stops you using, writing down or publishing the
name of any exercise; what we claim is the particular selection, grouping and ordering we
assembled, and the text we wrote around it. And where an image, font or library in the
Service belongs to somebody else, it is theirs on their own licence terms, not ours.

6.3 You may not, and may not permit anyone else to:

&nbsp;&nbsp;(a) copy, modify, translate or create derivative works of the Service;
&nbsp;&nbsp;(b) reverse engineer, decompile or disassemble any part of the Service, **except**
to the extent that applicable law gives you a right to do so that cannot be excluded by
contract, and then only after asking us in writing for the information you need;
&nbsp;&nbsp;(c) rent, lease, lend, sell, sublicense or otherwise make the Service available
to a third party;
&nbsp;&nbsp;(d) remove or obscure any copyright, trade mark or other proprietary notice.

6.4 **What "personal, non-commercial" means in clause 6.1.** Commercial use is using
FitPulse to log, plan, monitor or manage the training of **anyone other than yourself**, or
using it as part of a service you provide to others, whether or not you are paid. Without
limiting that, each of these is commercial use: a coach or personal trainer recording
clients' sessions; a gym, team, club or employer running accounts on behalf of members;
a researcher collecting participants' training data; and reselling or bundling access to
FitPulse with something else.

The following are **not** commercial use, and clause 6.1 covers them:

&nbsp;&nbsp;(a) logging your own training, however you earn a living — a professional
athlete, a coach or a physiotherapist logging their **own** sessions is a personal user;
&nbsp;&nbsp;(b) talking about FitPulse in public, including where you are paid to: reviewing
it, posting screenshots of your own data, filming yourself using it, or recommending it;
&nbsp;&nbsp;(c) exporting your own data and doing whatever you like with it, including
publishing it or feeding it into something else you use.

If you want to use FitPulse commercially, ask us at the address in section 1. We are not
offering a commercial licence today, and we would rather tell you that than have you build
on a licence that does not cover you.

6.5 **If you are not a consumer.** These Terms are written for consumers, and much of what
they give you comes from consumer law. Where they refer to your rights as a consumer, those
references apply to you only if you are a consumer under the law that applies to you. If you
use FitPulse for business purposes: your use is outside the licence in clause 6.1; clause
14.3(b) and 14.3(c) exclude business loss; and clause 2.4 and Schedule B, which preserve
consumer protection, do not enlarge rights you do not have. Everything else in these Terms
applies to you as written.

6.6 **You may say what you like about FitPulse.** Nothing in clause 6.3 stops you describing,
reviewing, criticising, benchmarking or publicly comparing the Service, or publishing what
you measured. Clause 6.3(b) is about taking the software apart, not about your opinion of it,
and we do not require approval of a review and will not treat a bad one as a breach.

6.7 **There is no public interface, yet.** FitPulse has no public API, and clause 7.1(d)
means the app itself is the documented interface. If we ever publish an API, it will come
with its own terms, quotas and rate limits, which are additional terms under clause 2.2(c)
and apply only to that interface — using it will be optional, and nothing about it will
change your rights under these Terms.

## 7. Acceptable use

7.1 You must not use FitPulse to do any of the following, and must not attempt to or help
anyone else to:

&nbsp;&nbsp;(a) break any law, or infringe anyone's rights;
&nbsp;&nbsp;(b) access, or try to access, another user's account or data;
&nbsp;&nbsp;(c) probe, scan, or test the vulnerability of the Service, or defeat or
circumvent any authentication, rate limit, or security measure — **except** under a
security-research disclosure we have agreed to in writing in advance;
&nbsp;&nbsp;(d) access the Service by any automated means, including scraping or bulk
extraction, other than through an interface we have documented for that purpose;
&nbsp;&nbsp;(e) upload or transmit malware, or anything designed to disrupt or damage the
Service or any user's device;
&nbsp;&nbsp;(f) send content or data that is unlawful, or that infringes the rights of
another person;
&nbsp;&nbsp;(g) impose a load on the Service that is materially disproportionate to normal
individual use, in a way that degrades the Service for other users;
&nbsp;&nbsp;(h) misrepresent your identity or your affiliation with any person.

7.2 In addition to 7.1, you must not use the Service in any way that is unlawful or that
**we reasonably determine**, on the basis of specific evidence, creates a material risk of
harm to us, to another user, or to a third party. Items (a) to (h) above are examples of the
kinds of use this covers; they do not limit it, and conduct does not have to resemble them
to be caught by this clause.

7.3 If we act under this section, we will act proportionately and, where practicable, tell
you what we relied on. Section 12 sets out what we may do and your right to challenge it.

7.4 **What counts as a disproportionate load under 7.1(g).** We measure this by machine
standards, not by how hard you train. It means, in substance, traffic no person operating the
app could generate by hand: scripted or automated requests, bulk import or export repeated at
machine frequency, or sustained request volume that measurably degrades the Service for other
users. **Ordinary use is never disproportionate, however heavy** — logging every session of
every day, editing years of history, exporting as often as you want, and using the app on as
many of your own devices as you like are all normal individual use. Where a limit is needed
we will rate-limit the requests rather than suspend the account, for as short a time as
possible, and clause 11.7 applies specifically to export.

7.5 **Automated detection.** We do not operate any automated system that suspends or
restricts accounts: every decision under section 12 is made by a person looking at specific
evidence. Our infrastructure provider does apply its own automatic rate limits to sign-in,
sign-up and password-reset requests, which can temporarily refuse requests from you or your
network — that is a technical throttle, it is not a suspension, it clears by itself, and the
app tells you when it happens. If we ever introduce automated detection of our own, we will
say so in this clause before it starts, we will not terminate an account on an automated
decision alone, and clause 12.4's right to have a person review the decision applies.

## 8. Your data and your content

8.1 **You keep ownership** of the workouts, weigh-ins, notes, preferences and other data you
put into FitPulse ("**Your Data**"). We do not claim ownership of it.

8.2 You grant us a **limited, worldwide, royalty-free, non-exclusive licence** to host,
store, copy, transmit, back up and display Your Data — **solely** to the extent necessary to
operate, secure, support and maintain the Service for you, and to comply with the law. This
licence is **not** sublicensable except to our hosting and infrastructure providers acting
on our instructions as processors, it grants us no right to publish Your Data or use it for
advertising, and it ends when Your Data is deleted.

8.3 We will not sell Your Data.

8.4 **If we ever want to use Your Data for anything beyond clause 8.2** — for example
aggregated research or product analytics that is not necessary to operate the Service — we
will ask for your separate, specific, opt-in consent first, and you may refuse or withdraw
it without losing access to the Service.

8.5 How we handle Your Data as personal data — including the legal basis, retention periods,
our processors, and your rights of access, rectification, erasure, portability and objection
— is set out in the [**Privacy Policy**](/privacy.html). Where these Terms and the Privacy
Policy conflict on a data protection matter, the Privacy Policy governs.

8.6 You confirm you have the right to submit Your Data and that doing so does not breach any
law or any third party's rights.

8.7 **What you write is yours; the app around it is ours.** Exercise names you type yourself,
the names you give your training days, your session notes and any other text you enter are
Your Data under clause 8.1, and clause 8.2 is the only licence we take in them. Our exercise
catalogue, its grouping into muscle groups, the starter templates, and the rest of the app's
text, design and software stay ours under clause 6.2. Typing a name that happens to match one
of ours gives neither of us any right in the other's — you do not acquire our catalogue by
retyping it, and we do not acquire your wording because it sits next to ours.

8.8 **What "aggregated" and "anonymous" mean in clause 8.4.** Data is anonymous only where
neither we nor anyone else can link it back to you, directly or indirectly, and the link
cannot be restored — the standard in Recital 26 of the GDPR. Deleting your name and email is
**not** enough: a training history is distinctive enough to identify someone. Anything short
of that standard is still your personal data, and clause 8.4 applies to it in full, including
the requirement for separate opt-in consent. Genuinely anonymous statistics — for example the
total number of sessions logged across all accounts in a month — are not personal data, are
not Your Data, and clause 8.4 does not apply to them. We do not produce any such statistics
today.

8.9 **Feedback.** You never have to send us feedback. If you choose to — a bug report, a
suggestion, a review, a feature request — you allow us to use it to improve FitPulse, free of
charge, without any obligation to you, and including where the same idea reaches us from
someone else. We do not normally credit feedback and are not obliged to, though any moral
right of attribution you have under the law of your country is unaffected — those rights
cannot be given away by a clause like this one in much of Europe, and we would rather say so
than write something unenforceable. Feedback is not confidential unless we agree otherwise in
writing beforehand, so please do not send us anything you need kept secret. If you send a
screenshot, an export file or a copy of your data so we can reproduce a problem, that is Your
Data and not feedback: we use it only to investigate the problem, section 8 governs it, and
we delete it once the issue is closed. This clause gives us no rights in Your Data and no
rights in anything you have not chosen to send us.

## 9. Health, fitness and safety — please read this section

9.1 **FitPulse is a general fitness logging and information tool. It is not a medical device
and does not provide medical advice.** Nothing in the Service is a diagnosis, a treatment, a
prescription, a medical opinion, or a substitute for professional medical advice.

9.2 **Talk to a doctor first.** You should obtain advice from a qualified medical
professional before beginning, resuming or materially changing any exercise programme,
diet or weight-management effort. This is particularly important if you are pregnant or
postpartum, are or have been injured, are over 35 and previously inactive, or have or have
had any cardiovascular, respiratory, metabolic, musculoskeletal or eating-related condition,
or take any medication.

9.3 **Assumption of risk.** You understand that resistance training, cardiovascular exercise
and weight management carry inherent risks — including muscle strain, joint injury, hernia,
fracture, cardiac events, and in rare cases death — which cannot be eliminated no matter how
carefully you train. **You voluntarily assume those risks.** You are solely responsible for
choosing your exercises, loads, volume and technique, and for deciding whether any given
session is safe for you on the day.

9.4 **Do not rely on the numbers.** Volumes, totals, trends, estimates, streaks, goals and
charts in FitPulse are arithmetic conveniences derived from what you typed. They may be
wrong, incomplete or out of date. Do not use them to make any medical, dietary or
health decision.

9.5 **Stop and seek help.** If you experience pain, dizziness, faintness, chest discomfort,
shortness of breath or any other warning sign, stop immediately and seek medical attention.
FitPulse cannot detect that anything is wrong and will not prompt you to stop.

9.6 Nothing in this section 9 limits our liability for death or personal injury caused by
our own negligence — see clause 14.2.

9.7 **Dates, streaks and your device's clock.** Everything in FitPulse is timestamped by
**your device**, in the time zone your device is set to. We do not correct it against server
time, and there is no authoritative clock on our side: what your phone says the date is, is
the date the session is filed under. So a session belongs to the calendar day your device is
on when you save it; the weekly goal counts the trailing seven calendar days as your device
measures them; and a streak counts the gaps between local calendar days. Travelling across
time zones, or changing your device's clock, moves those boundaries — it can shift a session
onto a different day, break a streak that looked alive, or extend one that was not.
A session dated in the future is left out of the weekly count. None of this is a defect;
clause 9.4 applies to all of it. If a date matters to you, check it in the app and correct it
in History.

9.8 **Suggestions, plans, and anything automated we add later.** FitPulse does not tell you
what to train, how much to lift, how often to train or what to weigh. Everything it shows is
arithmetic on what you typed, plus a starting list of exercises you are free to change or
delete. **If we ever add a feature that recommends, plans, coaches, predicts or scores —
whether it is a simple rule, a statistical model, or an AI model — the whole of this section
9 applies to it in full.** Any such output would be general information and not medical,
clinical, dietary or physiotherapy advice; it may be confidently wrong; it cannot know your
injuries, your medication, your sleep or how you feel today; and clauses 9.2, 9.3, 9.4 and
9.5 continue to govern your decision to act on it. We would label machine-generated output as
such, would not present it as personalised medical advice, and would treat its introduction
as a material change under clause 16.3.

## 10. The Service, and changes to it

10.1 FitPulse is **under active development**. Features may be added, changed or removed.

10.2 We may change the Service at any time to:

&nbsp;&nbsp;(a) add, improve or maintain features;
&nbsp;&nbsp;(b) fix defects or security problems;
&nbsp;&nbsp;(c) reflect changes in the law, in regulatory guidance, or in the terms of a
platform or provider we depend on;
&nbsp;&nbsp;(d) reflect changes in the technology we use, including where a third-party
service we rely on changes or ceases.

10.3 **If a change would materially reduce a feature you use**, we will give you at least
**30 days' notice** before it takes effect — in the app, and by email where we are able to
send one, as clause 16.2 describes — explain what is changing, and you may close your account
and export Your Data before the change applies. We will not make a material reduction
retroactively.

10.4 We may suspend the Service temporarily for maintenance, repairs, or to address a
security issue. Where the suspension is planned we will give reasonable advance notice.
Where it is not, we will restore service as quickly as we reasonably can and tell you what
happened.

10.5 We do not promise any particular level of uptime and we do not offer a service-level
agreement.

10.6 **What counts as a material reduction under 10.3.** A change materially reduces a
feature if it removes it, or degrades it enough that a reasonable user of FitPulse would
notice and mind. Without limiting that, we treat each of the following as material: logging a
session; editing or deleting one afterwards; keeping, searching and filtering your history;
the charts and statistics; the weekly goal; using the app offline; syncing between your
devices; exporting your data; and deleting your data or your account. Removing your ability
to export or to delete would be material, and we will not do either. What is **not** a
material reduction: cosmetic and layout changes, changes to the exercise catalogue, the
starter templates or the day names we ship, adding something new, and fixing a defect —
including where the fix changes a number you had got used to seeing, because a wrong figure
was never the feature.

10.7 **What "reasonable advance notice" means in 10.4.** For planned maintenance we expect to
last more than an hour, at least **24 hours'** notice, by email or in the app. For anything
shorter, notice in the app where we can give it. For an unplanned outage or an urgent
security fix, there is no advance notice — that is what makes it urgent — and the second
sentence of 10.4 applies instead: we restore service as fast as we can and tell you what
happened.

10.8 **We may change the companies we depend on.** Hosting, the database, authentication and
email are supplied to us by third parties, and we may add, replace or remove one — for cost,
reliability, security, or because they stop offering the service. That is a change to the
Service under clause 10.2(d). Two limits on it. First, where a new provider would process
your personal data, it becomes a recipient under the Privacy Policy: we will name it there
and give you advance notice as section 12 of that policy requires, **before** your data
reaches it. Second, a change of provider does not widen clause 8.2 — a provider acts on our
instructions as a processor and gets no right to use Your Data for anything of its own. If a
change of provider would itself materially reduce the Service for you, clause 10.3 applies.

## 11. Backups, export and loss of data

11.1 We take reasonable technical and organisational measures to keep Your Data safe.
Specifically:

&nbsp;&nbsp;(a) every row of your data is scoped to your account at the database level, so
one account cannot read or write another's;
&nbsp;&nbsp;(b) traffic between the app and our servers is encrypted in transit (HTTPS);
&nbsp;&nbsp;(c) we never see or store your password — authentication is handled by our
infrastructure provider, which stores only a hash of it;
&nbsp;&nbsp;(d) access to the production database is limited to the people who operate the
Service — today that is one person — and is granted through our database provider's
administrative console; and
&nbsp;&nbsp;(e) the app itself holds no credential that could reach another user's rows — the
key it ships with is a public one, and everything it does with it is constrained by (a).

Items (a) to (e) describe the measures in place as at the date of this version. Technology
and providers change, so we may change how we meet the obligation in the first sentence of
11.1 — but **only in a way that does not materially reduce the protection you have**, and we
will not withdraw a measure and put nothing in its place. The obligation to take reasonable
technical and organisational measures does not depend on the list; the list is us saying
concretely what we do, so that you can hold us to it.

We deliberately do not claim more than that. In particular, **we do not promise that we hold
a restorable backup of your data**, which is why clause 11.2 matters.

11.2 **FitPulse is not a system of record and must not be your only copy.** You are
responsible for keeping your own copy of anything you cannot afford to lose. The Service
provides an export function for exactly this purpose, at **Settings → Data → Export backup**.
It writes a single file — today a JSON file named `fitpulse-backup-YYYY-MM-DD.json` —
containing your workouts, your body-weight log, your weekly goal, your preferences, and your
account details: the email address on the account, when it was created, and the record of the
consent and the Terms version you accepted. What we promise about the format is that it will
always be **documented, machine-readable, non-proprietary, and readable without FitPulse**.
JSON is how we do that today; if we ever change it, it will be to another format meeting that
description, and we will say so in a release note. The exported file can also be imported
back into a FitPulse account — see clause 11.6 for the limits of that.

11.3 Some of your data is held temporarily on your own device so the app works offline. Data
that has not yet reached our servers can be lost if you clear your browser storage,
uninstall the app, or lose the device. The app marks such data as not yet synced.

11.4 Clause 11.2 does not reduce our own obligation to take the measures described in 11.1,
and does not limit our liability where we fail to take them.

11.5 **The export keeps up with the app.** If we add a new kind of data you can put into
FitPulse, we will include it in the export in the same release. The commitment in 11.2 is to
give you **everything we hold that is yours**, in one file — not to give you the particular
list of things the app happened to store when this version was written. If you ever find
something in the app that is not in your export, tell us at the address in section 1: that is
a defect, and it is also a data protection matter under the Privacy Policy.

11.6 **Importing a backup into a later version.** Your export carries the name of the app and
a format version, and the importer accepts a file it recognises. We will keep import working
for files written by earlier versions wherever we reasonably can. We cannot promise it
absolutely: a future change to how sessions are stored could make an old file unreadable to
the importer even though it stays perfectly readable to you, and pretending otherwise would
be a promise about software that does not exist yet. The commitment in 11.2 is that you can
always get your data **out** in a documented format you can read and use elsewhere; putting
an old file **back** into a future version is best-effort. If an import you expected to work
fails, tell us — where we can help by hand, we will.

11.7 **Limits on how often you export.** Export is there to be used whenever you want, and we
do not meter it. If a single account exports at a rate that is plainly automated and is
degrading the Service for others, we may rate-limit it under clause 7.1(g), for as short a
time as possible and after telling you. **We will never use that to delay or refuse a request
under data protection law.** If a limit ever gets in the way of getting your own data, email
us at the address in section 1 and we will send you the export ourselves.

11.8 **Working offline, and what happens when two devices disagree.** FitPulse keeps a copy
of your data on each device you use it on, so it works without a connection. You should know
how those copies are reconciled, because it decides what survives:

&nbsp;&nbsp;(a) a change you make while offline is held on that device and marked as not yet
synced, and is sent the next time the app successfully writes to, or loads from, our servers.
There is **no background retry** — the app is not running when it is closed, so a change made
offline waits until you open FitPulse again on that device;
&nbsp;&nbsp;(b) when the app loads your data, a not-yet-synced change on that device takes
precedence over our server's copy of the same record, and a not-yet-synced record that never
reached us is kept rather than dropped;
&nbsp;&nbsp;(c) **between devices, the later change to reach our servers is the one that
survives.** There is no merge of two edits to the same session and no version history: if you
edit the same session on two devices, the second write replaces the first, and the first is
gone;
&nbsp;&nbsp;(d) deletion is not held offline. If a deletion cannot reach our servers the app
puts the record back and tells you it did not delete — try again when you are connected. A
deletion that did reach us stays done, and a later load does not resurrect it;
&nbsp;&nbsp;(e) a change that has not reached our servers exists only on that device, so
clause 11.3 applies to it: clearing your browser storage, uninstalling, or losing the device
loses it.

This is a deliberate design for a single-user training log, not a defect, and clause 14.7
allocates the risk accordingly. The practical advice: make large edits on one device while
you are online, and open the app on any device that has been used offline before you rely on
what another device shows.

## 12. Suspension, termination and what happens to your data

12.1 **You may leave at any time**, for any reason and without giving a reason, by deleting
your account at **Settings → Delete account**. Deletion is immediate and permanent. Export
Your Data first if you want to keep it.

12.2 **We may suspend or restrict your account** where we reasonably believe, on the basis
of specific evidence, that:

&nbsp;&nbsp;(a) you have materially breached section 7 (Acceptable use);
&nbsp;&nbsp;(b) your account is being used unlawfully or has been compromised;
&nbsp;&nbsp;(c) suspension is necessary to protect the security or integrity of the Service
or other users; or
&nbsp;&nbsp;(d) we are required to do so by law or by a court, regulator or platform we are
bound by.

12.3 Before suspending, we will give you notice and a reasonable opportunity to put the
matter right, **unless** doing so would be unlawful, would defeat the purpose of the
suspension, or the breach is serious and immediate. In that case we will tell you as soon as
we lawfully can afterwards.

12.4 **You may challenge any suspension or termination** by writing to
**smalkaisk@gmail.com**. We will review the decision, and we will not have the sole or final
say on whether a breach occurred — your statutory rights and access to the courts are
unaffected.

12.5 **We may terminate your account and this agreement** only:

&nbsp;&nbsp;(a) on **30 days' written notice** given the way clause 16.2 describes, if we
discontinue the Service;
&nbsp;&nbsp;(b) where you do not accept a material change to these Terms under clause 16.3,
with effect no earlier than the effective date of that change and on the notice already
required by clause 16.2; or
&nbsp;&nbsp;(c) immediately, if grounds 12.2(a)–(d) apply and are serious or have not been
remedied.

In the cases in (a) and (b) we will make export available for at least the notice period.
This clause states the only grounds on which we may terminate.

12.6 On termination: your licence under section 6 ends, and the sections listed in clause
19.8 survive. Your Data is deleted as follows:

&nbsp;&nbsp;(a) **if you delete your account in the app**, deletion happens immediately.
Your login, your workouts, your body-weight log and your settings are removed at once. There
is no grace period and we cannot restore them afterwards;
&nbsp;&nbsp;(b) **if you ask us to delete your account by email**, we will do so within
**30 days** of verifying the request;
&nbsp;&nbsp;(c) in either case we keep only what the law requires us to keep, for only as
long as it requires, and we use it for nothing else.

The copy of Your Data cached on your own device is cleared at the same time on the device you
used. See our [account deletion page](/delete-account.html) for the full detail.

12.7 **What "immediately" means, and what is left afterwards.** Deleting in the app is a
single database operation, not a queued job: your login, your workouts, your weigh-ins and
your settings are removed when you confirm, and we hold no backup of the database for them to
survive in. Five things sit outside that sentence, and we would rather name them than let
you assume otherwise:

&nbsp;&nbsp;(a) **infrastructure logs.** Our providers keep short-lived technical logs of
requests — the time, the network address a request came from, and what was asked for. They
are not your training data, they are deleted automatically on the schedule set out in section
7 of the [Privacy Policy](/privacy.html), and we do not consult them about a deleted account;
&nbsp;&nbsp;(b) **copies on your own devices.** The offline copy is cleared on the device you
delete from. We cannot reach the others, and we will not pretend to: clear the site's data in
that browser, or sign out there. The [account deletion page](/delete-account.html) explains
this in full;
&nbsp;&nbsp;(c) **email between us — what you have sent, our replies, and any notice we
have sent you.** If you have written to the address in section 1, that correspondence sits in
our mailbox and is not deleted by deleting your account. The same is true of a notice we sent
you: a warning under clause 12.9, or a change notice under clause 16.2, is a message
addressed to you and a record that we gave the notice those clauses require. We keep both for
the period set out in section 7 of the [Privacy Policy](/privacy.html) and use them only to
handle your request, to send the notice, and to show that we did. If you would rather it went
at the same time as your account, say so and we will delete the thread;
&nbsp;&nbsp;(d) **our authentication provider's security log.** Signing in, signing up and
resetting a password are recorded by the provider that performs them, with the time, the
network address and the email address used. It is a security record, not your training data,
it is never used to reconstruct a deleted account, and section 7 of the
[Privacy Policy](/privacy.html) gives the period we keep it for;
&nbsp;&nbsp;(e) **anything the law requires us to keep**, under clause 12.6(c), and nothing
else.

Crash and error reporting is switched off in the app we ship, so no error report containing
your data exists anywhere. If we ever turn it on, it becomes a sixth item in this list and
the Privacy Policy will say so before it starts. Deletion by email under clause 12.6(b) is
the one route that is not instant, because we have to verify the request first.

12.8 **If we cannot give 30 days' notice.** Clause 12.5(a) assumes we can see the end coming.
Where an event outside our reasonable control makes that impossible — an infrastructure
provider terminating our account or shutting down, a legal or regulatory order, insolvency,
or the death or serious incapacity of the operator — we, or whoever is acting for us, will
give you as much notice as the circumstances allow, as soon as we are able, and will keep
export working for as long as we can. Clause 19.6 governs delay in performing our obligations
during such an event; this clause governs the end of the Service itself; clause 19.11 governs
export and deletion while it lasts. This is the second reason clause 11.2 asks you to keep
your own copy: a service run by one person can stop for reasons that no notice period can
cover.

12.9 **Abandoned accounts are eventually deleted.** We keep your data for as long as you are
using FitPulse, and we do not want to hold a stranger's training history forever because they
tried the app once. So:

&nbsp;&nbsp;(a) after **24 months** with no activity we email you to say the account is due
for deletion, when that will happen, and that signing in once cancels it and resets the clock;
&nbsp;&nbsp;(b) after **36 months** with no activity — a full year after that warning — the
account and everything in it are deleted;
&nbsp;&nbsp;(c) **"no activity" means no activity of any kind**: no sign-in, no logged
session, no weigh-in and no settings change in the whole period. Any one of those keeps the
account, so simply using FitPulse is enough and you never have to do anything special.

**The warning is a condition of the deletion, not a courtesy attached to it.** We will not
delete an account under this clause unless the warning in (a) was actually sent to you and we
hold a record of when. If for any reason it was not sent, the account is not deleted — the
clock does not start until you have been told. We have built it this way round on purpose:
this is the only thing in these Terms that would destroy your data, and "we meant to warn
you" is not a warning.

Section 7 of the [Privacy Policy](/privacy.html) states the same rule as a retention period,
which is what it is: holding personal data with no end date is not something we are entitled
to do just because it would be convenient. If we ever change either number, that is a
material change under clause 16.3.

## 13. What we promise, and what we do not

13.1 **What we promise.** We will supply the Service with reasonable care and skill, and it
will be:

&nbsp;&nbsp;(a) fit for the purpose it is described as serving on our website and in these
Terms, and — where FitPulse is distributed through an app store — in that store listing.
FitPulse is a web app today and has no store listing, so the description that binds us is
the one on our own pages and in this document;
&nbsp;&nbsp;(b) of the quality and possess the features and performance that is normal for a
free personal fitness logging app, and that you can reasonably expect given our public
descriptions of it; and
&nbsp;&nbsp;(c) supplied with the updates we tell you about.

If it is not, you have the remedies given to you by the consumer law of your country,
including — where you are in the EEA or UK — the right to have the Service brought into
conformity and, where that is impossible or disproportionate, to terminate this agreement.
Contact **smalkaisk@gmail.com** and we will address it.

13.2 **What we do not promise.** Subject always to clause 13.1 and section 2.4, and to the
extent permitted by law, the Service is provided **"as is" and "as available"**, and we do
not promise that:

&nbsp;&nbsp;(a) it will be uninterrupted, error-free or free of harmful components;
&nbsp;&nbsp;(b) any figure, chart, estimate or trend it produces will be accurate or
complete;
&nbsp;&nbsp;(c) it will meet a requirement you have not told us about;
&nbsp;&nbsp;(d) it will be compatible with every device, browser or operating system version;
&nbsp;&nbsp;(e) any defect will be corrected within any particular time.

13.3 We are not responsible for third-party services, sites or content that FitPulse links
to or interoperates with, and their availability or terms are a matter between you and them.

13.4 **What FitPulse needs in order to run.** FitPulse is a web app, and clause 13.1 is a
promise about it running on a device that meets these requirements: a **current version of a
mainstream browser** — Chrome, Edge, Firefox or Safari, in the current or immediately
preceding major version — on a device whose operating system still receives updates from its
maker, with **JavaScript enabled** and **browser storage available to the site**. Storage is
not optional: it holds the offline copy and keeps you signed in, so FitPulse will not work
usefully in a private window that discards storage, or where site data is blocked. We develop
and test primarily against current Chromium-based browsers, we do not test every browser,
version or device, and clause 13.2(d) applies outside the requirements above — as it does to
browsers modified by extensions that alter the page. We will not deliberately break a browser
that its own maker still supports, and if we ever have to raise this floor we will say so in
a release note and give notice under clause 10.3 where it materially reduces the Service for
you.

13.5 **Your typing, our defects — where the line is.** Clauses 13.2(b) and 14.3(e) are about
arithmetic on what you entered: log 100 kg where you lifted 10 and every total after it is
wrong, and that is not a defect. **They do not cover a figure that is wrong because our
software is wrong.** If FitPulse adds up correctly entered sets incorrectly, loses a session
you saved, charts data you did not enter, or converts units wrongly, that is a failure of
clause 13.1, and your remedies under 13.1, section 14 and your consumer law are unaffected.
Tell us at the address in section 1 and we will fix it.

13.6 **FitPulse is supplied free of charge today.** There is no subscription, no in-app
purchase and no advertising, and clause 13.1(b) is read against what a free personal training
log is expected to do. If we introduce a paid plan: it will be optional, it will be priced
before you buy anything, clause 16.1(e) governs the change, and clause 13.1(b) will then be
read against what you actually paid for. **We will not put a feature you already rely on
behind a payment without treating it as a material reduction under clause 10.3** — with the
30 days' notice, and your right to export and leave, that clause carries.

## 14. Our liability to you

Read this section together with section 2.4. It allocates risk; it does not remove rights
the law gives you.

14.1 We are liable to you for loss you suffer that is a **foreseeable** result of our
breaking this contract or failing to use reasonable care and skill. Loss is foreseeable if
it is obvious that it will happen, or if we both knew it might happen when you accepted
these Terms.

14.2 **We do not exclude or limit our liability in any way for:**

&nbsp;&nbsp;(a) death or personal injury caused by our negligence;
&nbsp;&nbsp;(b) fraud or fraudulent misrepresentation;
&nbsp;&nbsp;(c) gross negligence or wilful misconduct;
&nbsp;&nbsp;(d) any breach of your mandatory statutory rights as a consumer, including any
right relating to the conformity of digital content or services;
&nbsp;&nbsp;(e) our obligations under applicable data protection law; or
&nbsp;&nbsp;(f) anything else that cannot lawfully be excluded or limited.

14.3 **Subject to 14.2**, we are not liable for:

&nbsp;&nbsp;(a) loss that was not foreseeable when you accepted these Terms;
&nbsp;&nbsp;(b) loss of profit, revenue, business, business opportunity, or anticipated
saving;
&nbsp;&nbsp;(c) loss arising from your use of the Service for any business or commercial
purpose — FitPulse is supplied for personal use only;
&nbsp;&nbsp;(d) loss arising from your failure to follow section 9 (health and safety) or to
obtain medical advice;
&nbsp;&nbsp;(e) loss arising from Your Data being incorrect because of what you entered.

Each sub-clause of 14.3 is independent. If one is held unenforceable, the others continue to
apply.

14.4 **Cap.** Subject to 14.2, our total liability to you for all claims arising out of or in
connection with this agreement in any 12-month period is limited to the greater of:

&nbsp;&nbsp;(a) the total amount you paid us for the Service in the 12 months before the
event giving rise to the claim; and
&nbsp;&nbsp;(b) **EUR 100**.

**In plain terms: FitPulse is free of charge today (clause 13.6), so limb (a) is nil and the
cap is EUR 100.** Limb (a) is there for the paid plan that clause 16.1(e) allows us to
introduce one day: if that happens, the cap rises with what you actually paid, and we do not
have to rewrite this section to make that work. Note what the cap does **not** reach — by
clause 14.2 it does not apply to death or personal injury, to fraud, to gross negligence, to
your mandatory consumer rights, or to our obligations under data protection law.

14.5 **Step-down.** If a court or other competent authority holds that clause 14.4 is
unenforceable in whole or in part, our liability will instead be limited to the lowest
amount, and to the greatest extent, that is enforceable under the applicable law. If clause
14.3 is held unenforceable in whole or in part, clause 14.4 continues to apply
independently, and vice versa.

14.6 **Data loss.** Subject to 14.2, we are not liable for loss or corruption of Your Data to
the extent it results from your failure to keep your own export under clause 11.2, or from
data that had not yet synced to our servers under clause 11.3. We remain liable for loss
caused by our own failure to take the measures described in clause 11.1.

14.7 **Reconciliation between your devices.** Subject to 14.2, we are not liable for data
lost because the reconciliation rules in clause 11.8 operated as described there — for
example the later of two edits to the same session replacing the earlier one. This applies
only where those rules worked as stated: if the app loses data in some other way, or fails to
do what clause 11.8 says it does, clause 14.7 does not apply and clause 13.1 does.

## 15. Your responsibility to us

15.1 If you break section 7 (Acceptable use) **deliberately or negligently** and that causes
us direct loss — for example a third-party claim against us arising from your unlawful use of
the Service, or costs of restoring the Service after you attacked it — you are responsible
for that loss.

15.2 Clause 15.1 is limited to **direct loss that was reasonably foreseeable**, does not
extend to loss caused wholly or partly by us, and does not apply where you were acting as a
consumer and the loss arose from ordinary use of the Service. We will notify you promptly of
any claim we intend to rely on and give you a reasonable opportunity to respond.

## 16. Changes to these Terms

16.1 We may change these Terms **only** for one or more of the following reasons, which we
will state when we notify you:

&nbsp;&nbsp;(a) to comply with a change in law, regulation, regulatory guidance, or a court
or regulator's decision;
&nbsp;&nbsp;(b) to reflect a change we have made to the Service under section 10;
&nbsp;&nbsp;(c) to reflect a change in the terms imposed on us by a platform, payment
provider or infrastructure provider we depend on;
&nbsp;&nbsp;(d) to correct an error, ambiguity or inconsistency;
&nbsp;&nbsp;(e) to introduce a paid plan or change how one works, which will never change the
price of a plan you have already bought without your agreement;
&nbsp;&nbsp;(f) to improve the clarity or fairness of these Terms in your favour;
&nbsp;&nbsp;(g) to address a security or fraud risk.

16.2 **Notice.** For any change that is not purely clerical, we will tell you at least
**30 days** before it takes effect. The notice will state the effective date, summarise what
is changing in plain language, and link to the full new version and to a marked-up
comparison against the current one.

We give that notice **in the app**, where it appears whenever you open FitPulse during the
notice period, **and by email** to your registered address where we are able to send one. The
in-app notice is the one we can always perform, so it is the one this clause relies on; email
is in addition to it, not instead of it. Clause 19.10 governs a notice that does not reach
you, and clause 16.3 asks for your acceptance of a material change in the app rather than by
email for the same reason.

16.3 **Material changes require your acceptance.** For changes to sections 8, 9, 12, 13, 14,
17 or to any pricing, we will ask you to accept the new version in the app. If you do not
accept, you may continue using the current version of the Service until the effective date,
after which we may close your account under **clause 12.5(b)** — and you may export Your
Data at any time before and during that period.

16.4 For any other change, continuing to use FitPulse after the effective date means you
accept it. If you do not want to accept it, you may close your account at any time before
the effective date at no cost.

16.5 Every previous version of these Terms is kept in the project's Git history. Email us at
the address in section 1 and we will send you any earlier version.

## 17. Governing law and where disputes are heard

<!-- internal:start -->
*Drafting note, not part of the published agreement: the country is now set to **Latvia**,
confirmed as the controller's place of establishment, and § 20.3's "working day" follows it.
Two follow-ups this does NOT resolve: (1) TERMS-RATIONALE.md § 3 still analyses **Spanish**
law (LSSI-CE Art. 10 and a Spanish ADR body) from an earlier draft — that analysis is now
pointed at the wrong jurisdiction and needs redoing against Latvian law, in particular the
Latvian Information Society Services Law and the Consumer Rights Protection Centre (PTAC)
as the § 18.2 ADR route. (2) § 18.2 currently refers generically to "the consumer authority
in your country of residence", which is correct but vague for Latvian users; naming PTAC
would be better. Neither blocks publication; both should be done before relying on § 17.*
<!-- internal:end -->

17.1 These Terms are governed by the law of **Latvia**.

17.2 **If you are a consumer resident in the EEA or the United Kingdom**, clause 17.1 does
not deprive you of the protection of the mandatory law of your country of residence, and you
may bring proceedings in the courts of your country of residence or in the courts of
**Latvia**. We may bring proceedings against you only in the courts of your country of
residence.

17.3 **If you are not a consumer** — that is, if you use FitPulse for business purposes —
the courts of **Latvia** have exclusive jurisdiction.

17.4 **If you are a consumer resident outside the EEA and the UK**, clause 17.3 does not
apply to you. We are a single individual established in Latvia with no entity anywhere else,
so Latvia is where we would bring or defend a claim, and clause 17.1 chooses Latvian law for
that purpose. But we do not ask you to give up a protection your own
law does not let you give up: where the mandatory consumer law of your country of residence
gives you the right to bring a claim locally, or applies its own rules to this agreement,
that right and those rules prevail over this section. Schedule B.3 says the same thing for
readers in the United States.

<!-- internal:start -->
*Drafting note, not part of the published agreement: a US arbitration + class-waiver module
would slot in here as a new 17.4, renumbering "Talk to us first" to 17.5. Include it only on
legal advice, and never apply it to EEA/UK consumers — Annex point (q) of Directive 93/13
treats compulsory consumer arbitration as the textbook unfair term. See TERMS-RATIONALE.md
§4.3 for what such a clause needs to contain.*
<!-- internal:end -->

17.5 **Talk to us first.** Before starting any formal proceedings, please contact us at
**smalkaisk@gmail.com** and give us **30 days** to resolve the matter. This does not stop you
from going to court, and does not affect any limitation period.

## 18. Complaints

18.1 Send complaints to **smalkaisk@gmail.com**. We will acknowledge within **10 working
days** and give a substantive reply within **30 days**.

18.2 If you are not satisfied, you may refer the matter to the consumer authority or
competent alternative dispute resolution body in your country of residence. Because we are
established in Latvia, you may also complain to the **Consumer Rights Protection Centre
(Patērētāju tiesību aizsardzības centrs, "PTAC")**, which supervises us. Schedule B, part
B.1 explains the route for cross-border complaints inside the EEA.

<!-- internal:start -->
*Drafting note, not part of the published agreement: PTAC is named because we are
established in Latvia — an EEA consumer may go to their own national authority instead,
which is why 18.2 offers both. Do **not** reference the EU ODR platform anywhere: it was
shut down on 20 July 2025, and pointing consumers at a dead redress mechanism can itself be
a misleading commercial practice. Schedule B.1 names ECC-Net instead, which is the live
route for cross-border EEA disputes.*
<!-- internal:end -->

18.3 Nothing in this section prevents you from going to court.

## 19. General

19.1 **Severability.** If any provision, or part of a provision, of these Terms is held
invalid, unlawful or unenforceable, it is severed and the rest continues in full force. Where
possible the severed provision is to be read down to the extent needed to make it valid
rather than removed entirely.

19.2 **No waiver.** If we do not enforce a right under these Terms, or delay in doing so,
that is not a waiver of that right and does not prevent us from enforcing it later.

19.3 **Entire agreement.** These Terms, the Privacy Policy and any feature-specific terms you
accept are the entire agreement between us about the Service, and replace any earlier
statement or agreement about it. This clause does not exclude liability for fraud or
fraudulent misrepresentation, and does not exclude any statement we made that you reasonably
relied on when deciding to use the Service.

19.4 **Assignment.** You may not transfer your rights or obligations under these Terms. We
may transfer ours to another organisation as part of a merger, acquisition or restructuring,
**provided** the transfer does not reduce the protections you have under these Terms or
under law. We will tell you at least **30 days** before any such transfer and you may close
your account at any time.

19.5 **Notices.** We will send notices to the email address on your account; you must keep it
current. A notice by email is treated as received 24 hours after it is sent, unless we
receive a delivery failure. You send us notices to **smalkaisk@gmail.com**.

19.6 **Events outside our control.** We are not liable for failure or delay in performing
our obligations caused by an event outside our reasonable control, including power or
internet failure, failure of a third-party infrastructure provider, natural disaster, war,
terrorism, civil disorder, epidemic, industrial action, or government action. We will tell
you and will resume as soon as reasonably possible. If the event continues for more than
**30 days**, either of us may end this agreement.

19.7 **Third parties.** Except as stated in Schedule A, no one other than you and us has any
right to enforce these Terms.

19.8 **Survival.** Sections 1, 2.2, 2.4, 6.2, 6.5, 8.1–8.3, 8.5–8.9, 9, 11.2, 12.6, 12.7,
13.2, 13.3, 14, 15, 17, 18, 19 and 20, and Schedule B, survive termination of this agreement
for any reason.

Clauses 2.2, 8.5 and 11.2 are in that list for a reason worth stating. The clauses that
matter most after you leave are the ones about what was deleted and what was kept (12.6 and
12.7), and those are data protection matters — so the rule that the Privacy Policy governs
them (8.5, and the exception in 2.2(a)) has to outlive the agreement too, or you would be
arguing about retention under clauses that survived against a hierarchy that did not.
Clause 11.2 survives because clause 14.6 allocates risk by reference to it.

19.9 **Language.** These Terms are provided in **English**.

<!-- internal:start -->
*Drafting note, not part of the published agreement: if you also publish a translation,
state which language version governs, and note that a consumer may rely on the version in
the language in which the Service was marketed to them.*
<!-- internal:end -->

19.10 **When a notice does not reach you.** Email is imperfect: filters divert it, mailboxes
fill up, and providers reject messages. Clause 19.5 still applies, and keeping your address
current under clause 5.1 still matters, but it does not work as a trap:

&nbsp;&nbsp;(a) if you are expecting something from us and it has not arrived, check your
spam or junk folder — a message we send is not always a message your provider shows you;
&nbsp;&nbsp;(b) where we receive a delivery failure, or otherwise have reason to believe an
important notice did not reach you, we will make a reasonable further attempt. An in-app
notice is our usual second route;
&nbsp;&nbsp;(c) the deemed-receipt rule in 19.5 — received 24 hours after sending — does not
apply to a notice we know was not delivered;
&nbsp;&nbsp;(d) acceptance of a material change under clause 16.3 is asked for **in the app**,
not by email, so an email you never saw cannot by itself cost you the chance to consider one;
&nbsp;&nbsp;(e) **we will not close your account under clause 12.5(b) for failing to accept a
change we know you were never told about.**

If the address on your account is no longer yours and we cannot reach you at all, we may
treat notices as given after doing (b) — there is nothing else we can do, and clause 5.6
explains why an unreachable address is a problem for you as well as for us.

19.11 **Export and deletion during an event outside our control.** Clause 19.6 excuses delay
in performing our obligations; it is not a way to hold on to your data. If an event under
19.6 stops export or deletion from working, we will treat restoring both as a priority, tell
you that they are unavailable and for how long as soon as we can, and honour a request sent
by email to the address in section 1 as soon as we are able to act on it. Clause 19.6 does
not extend a statutory deadline for a data protection request — those are set by law and by
the [Privacy Policy](/privacy.html), not by this contract. If an event under 19.6 ends this
agreement, we will not delete Your Data during the notice period unless you ask us to, and we
will make export available if we are able to.

## 20. Definitions and interpretation

20.1 **"Includes", "including" and "for example"** introduce examples that do **not** limit
the meaning of the words they follow. The general words are not restricted by the specific
examples, whether or not the examples are of the same kind.

20.2 **"Written" and "in writing"** include email.

20.3 **"Working day"** means a day other than a Saturday, Sunday or public holiday in
**Latvia**.

20.4 **"Your Data"** has the meaning in clause 8.1.

20.5 Headings are for convenience and do not affect interpretation. The singular includes the
plural and vice versa. A reference to a law includes that law as amended or replaced.

20.6 Because these Terms were drafted by us and not individually negotiated with you, **any
genuine ambiguity is to be interpreted in your favour.**

20.7 **Terms defined where they are used.** Several expressions are defined in the clause
that uses them rather than here, so the definition sits with the obligation it shapes:
**commercial use** and **personal, non-commercial** in clause 6.4; **disproportionate load**
in clause 7.4; **anonymous** and **aggregated** in clause 8.8; **material reduction** in
clause 10.6; **reasonable advance notice** of maintenance in clause 10.7; and the
requirements FitPulse needs in order to run in clause 13.4. Each of those definitions governs
wherever the expression appears in these Terms.

---

## Schedule A — Additional terms for App Store and Google Play

These terms apply only if you obtained FitPulse through the Apple App Store or Google Play,
and only in relation to that copy. Where they conflict with the main Terms, this Schedule
governs for that copy.

**A.1 Agreement is with us, not the store.** These Terms are between you and us. Apple Inc.
and Google LLC are not parties to them. These Terms must not be inconsistent with the Apple
Media Services Terms and Conditions, and in the event of conflict those terms prevail in
respect of your relationship with Apple.

**A.2 Scope of licence.** Your licence under section 6 is limited to using FitPulse on any
Apple-branded product that you own or control, as permitted by the Usage Rules in the Apple
Media Services Terms and Conditions, including via Family Sharing or volume purchasing where
applicable.

**A.3 Maintenance and support.** We are solely responsible for providing maintenance and
support for FitPulse. Apple has no obligation whatsoever to furnish any maintenance or
support services.

**A.4 Warranty.** We are solely responsible for any product warranties, whether express or
implied by law, to the extent they are not effectively disclaimed. If FitPulse fails to
conform to any applicable warranty, you may notify Apple and Apple will refund the purchase
price (if any); to the maximum extent permitted by law Apple has no other warranty
obligation, and any other claims, losses, liabilities, damages, costs or expenses
attributable to a failure to conform to a warranty are our sole responsibility.

**A.5 Product claims.** We, not Apple, are responsible for addressing any claim by you or a
third party relating to FitPulse or your possession and use of it, including product
liability claims, any claim that FitPulse fails to conform to a legal or regulatory
requirement, and claims arising under consumer protection, privacy or similar legislation,
including in connection with FitPulse's use of the HealthKit or HomeKit frameworks if
applicable.

**A.6 Intellectual property claims.** In the event of a third-party claim that FitPulse or
your possession and use of it infringes that third party's intellectual property rights, we,
not Apple, are solely responsible for the investigation, defence, settlement and discharge of
that claim.

**A.7 Legal compliance.** You represent and warrant that you are not located in a country
subject to a US Government embargo or designated by the US Government as a
"terrorist supporting" country, and that you are not listed on any US Government list of
prohibited or restricted parties.

**A.8 Developer name and address.** Our name, address and contact details are in section 1.

**A.9 Third-party terms.** You must comply with any applicable third-party terms of agreement
when using FitPulse.

**A.10 Third-party beneficiary.** You acknowledge and agree that Apple, and Apple's
subsidiaries, are third-party beneficiaries of these Terms, and that upon your acceptance
Apple will have the right (and will be deemed to have accepted the right) to enforce these
Terms against you as a third-party beneficiary.

**A.11 Google Play.** If you obtained FitPulse through Google Play, your use is also subject
to the Google Play Terms of Service, and Google is not a party to these Terms and has no
responsibility for FitPulse.

---

## Schedule B — Terms that depend on where you live

Consumer protection is national law, so a single set of terms cannot be equally accurate
everywhere. This Schedule collects the differences in one place. Read the part for where you
live; the rest does not apply to you.

**How this Schedule works.** Where a part of it modifies a clause of the main Terms, it says
so and it governs for that region. Where it only confirms a right you already have by law, it
says that too — confirming a statutory right does not create it, and not listing one does not
remove it. Clause 2.4 sits above everything here: mandatory consumer law in your country
wins over any clause of these Terms, including this Schedule.

### B.1 If you live in the European Economic Area

**B.1.1 Your law and your courts.** Clause 17.1 chooses Latvian law, but under clause 17.2
that choice cannot deprive you of the protection of the mandatory consumer law of your own
country, and you may sue in your own courts. We may sue you only in your own courts.

**B.1.2 Conformity of digital services.** Under Directive (EU) 2019/770 as implemented where
you live, what we supply must be as described and fit for its purpose, and you have remedies
if it is not. Clause 13.1 sets out what we promise; clauses 13.2 and 14 do not, and are not
intended to, reduce those statutory remedies below what the Directive requires.

**B.1.3 Withdrawal.** FitPulse is supplied free of charge, so there is no payment and nothing
to refund. If we ever introduce a paid plan, the statutory 14-day right of withdrawal will be
presented to you at the point of purchase, together with the express request and
acknowledgement the law requires before immediately-supplied digital content can begin.

**B.1.4 Complaints across borders.** Section 18 applies. For a cross-border dispute with a
trader in another EEA country, the **European Consumer Centres Network (ECC-Net)** is the
route to use; your national ECC will handle it. We do not refer you to the EU Online Dispute
Resolution platform because it was shut down on 20 July 2025.

**B.1.5 Interpretation.** Clause 20.6 applies with full force here: these Terms were drafted
by us and not negotiated with you, so genuine ambiguity is read in your favour.

### B.2 If you live in the United Kingdom

**B.2.1 Your law and your courts.** Clause 17.2 covers you in the same way as an EEA
consumer: the choice of Latvian law does not remove the protection of mandatory UK consumer
law, you may sue in the UK courts, and we may sue you only there.

**B.2.2 Consumer Rights Act 2015.** Where that Act applies to what we supply you, nothing in
these Terms reduces the rights it gives you. That expressly includes section 46: if defective
digital content we supply damages your device or other digital content, and we have not
exercised reasonable care and skill, you may be entitled to a repair or to compensation —
and clause 14 does not limit that.

**B.2.3 Unfair terms.** Any term of these Terms that would be unfair under Part 2 of the
Consumer Rights Act 2015 does not bind you, and the rest continues to apply (clause 19.1).

**B.2.4 Complaints.** Section 18 applies. You may also contact the consumer advice service in
the UK, and nothing in section 17 or 18 stops you bringing a claim in the UK courts.

### B.3 If you live in the United States

**B.3.1 No arbitration clause, and no class-action waiver.** We have deliberately not
included either. You keep whatever right you have to bring a claim in court, individually or
as part of a class. If we ever propose to add an arbitration clause, it would be a change to
section 17 — which clause 16.3 says we cannot apply to you without asking you to accept it
first, and which you could refuse.

**B.3.2 Jurisdiction, stated honestly.** The exclusive-jurisdiction clause in 17.3 applies to
business users, **not to you as a consumer** — clause 17.4 says so expressly. We are a single
individual established in Latvia with no US entity, so Latvia is where we would bring or
defend a claim; that does not, and cannot, waive a right your state law gives you that cannot
be waived by contract, and where your state law lets you sue locally, you may.

**B.3.3 Your health data.** Body weight and training history are health data under US law as
well as EU law. The [Privacy Policy](/privacy.html) sets out how we handle it, and we are
subject to the FTC's Health Breach Notification Rule, which requires us to notify you and the
FTC if it is ever disclosed without your authorisation.

**B.3.4 California.** You may exercise the rights described in the Privacy Policy, and we do
not sell or share your personal information — so there is nothing to opt out of, though we
honour a Global Privacy Control signal regardless. As a courtesy notice: California users of
an electronic service may direct a complaint to the Complaint Assistance Unit of the Division
of Consumer Services of the California Department of Consumer Affairs, contactable through
the Department's website.

**B.3.5 Washington State.** Our [Consumer Health Data Privacy notice](/consumer-health-data-privacy.html)
is a separate document as the My Health My Data Act requires, and it sets out your rights,
our response times and how to appeal a refusal.

### B.4 If you live anywhere else

Clause 2.4 still applies: any mandatory consumer protection in your country overrides any
clause of these Terms that conflicts with it. Sections 17 and 18 apply as written, and we
will always answer a complaint sent to the address in section 1.

<!-- internal:start -->
*Drafting notes for this Schedule, not part of the published agreement:*

1. *Nothing here invents a right or narrows one — every part either confirms a statutory
   right or points at the operative clause in the main Terms. That is deliberate: a schedule
   that restates rights in its own words creates a second, slightly different version of the
   same promise, which is exactly the drift LEGAL-LIABILITY-AUDIT.md was written about.*
2. *B.3.4 is written as a courtesy notice rather than a Cal. Civ. Code § 1789.3 notice.
   § 1789.3 requires the unit's name, address and telephone number, and it applies to services
   supplied for a charge — FitPulse is free, so it is arguably out of scope. If a paid plan
   ever ships, replace B.3.4 with the full statutory notice and verify the address and phone
   against the current Department of Consumer Affairs listing before publishing them.*
3. *B.2.2 is limited to "where that Act applies" on purpose. Most Consumer Rights Act 2015
   digital-content rights attach to content supplied for a price; section 46 (damage to the
   consumer's device) is the one that reaches free digital content, which is why it is the
   one named.*
4. *If a US arbitration module is ever added on legal advice, B.3.1 must be rewritten in the
   same commit — leaving it saying "no arbitration clause" while section 17 contains one
   would be a direct contradiction between two parts of the same contract.*
<!-- internal:end -->

---

*End of Terms of Service, version 1.2.*
