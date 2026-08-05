# Supabase setup for password auth

One-time dashboard setup so the login, signup, password-reset, and change-password
flows work. **Step 1** is required to make the email links work and **Step 4** is required
before launch — the published privacy policy describes those settings as facts. Steps 2–3
are choices/polish.

Your project: **`dhxsamkaqszffajcwuzn`**
Dashboard home: https://supabase.com/dashboard/project/dhxsamkaqszffajcwuzn

You run the app locally at **`http://localhost:5173`** (Vite's default port — the URL
`npm run dev` prints). Everything below uses that URL. If you ever change the port,
update these to match.

---

## Step 1 — Set the auth URLs (required for reset & signup-confirm emails)

**Why:** When Supabase emails a password-reset or signup-confirmation link, that link
carries a "come back to this URL" value (`http://localhost:5173`). Supabase only honors
it if the URL is on an allow-list; otherwise it silently falls back to the **Site URL**
(which defaults to `http://localhost:3000`, where nothing is running — so the link looks
broken). This has nothing to do with owning a domain — it's just "which local URL is the
app open at."

**Sign-in, signup, and change-password do NOT use this** — they work regardless. This
step only affects the two flows that send an email link.

### Where
Dashboard → left sidebar **Authentication** → **URL Configuration**
Direct link: https://supabase.com/dashboard/project/dhxsamkaqszffajcwuzn/auth/url-configuration

### What to do
1. **Site URL** — set it to:
   ```
   http://localhost:5173
   ```
2. **Redirect URLs** — click **Add URL** and add:
   ```
   http://localhost:5173/**
   ```
   (The `/**` wildcard covers any path the link returns to.)
3. Click **Save**.

That's the whole required step. If a reset link ever lands on a blank/not-running page
instead of the "Set a new password" screen, it means this URL doesn't match the port
you opened the app at — come back here and fix it.

---

## Step 2 — Decide on email confirmation (a choice, not required)

**Why:** Controls what happens the instant someone creates an account.

- **ON (current setting):** after signup, the app shows a "Check your inbox" panel and
  the user must click a confirmation email before they can sign in.
- **OFF:** signup logs the user straight in — no email, no waiting.

The app code handles **both** — you don't need to change any code either way. For a
personal app used by you and one other person, **OFF is more convenient**; leave it ON if
you want to verify email addresses are real.

### Where
Dashboard → **Authentication** → **Providers** → click **Email**
Direct link: https://supabase.com/dashboard/project/dhxsamkaqszffajcwuzn/auth/providers

### What to do
- Find the **Confirm email** toggle.
- Turn it **off** for instant signup, or leave it **on** to require confirmation.
- **Save**.

> Note: turning it off does **not** affect your two existing accounts — they're already
> confirmed. It only changes how *new* signups behave.

---

## Step 3 — (Optional) Tidy the email templates

**Why:** You switched away from magic links, so the live templates are now **Confirm
signup** and **Reset password**. The defaults work fine — this is only if you want the
wording/branding to say "FitPulse".

### Where
Dashboard → **Authentication** → **Emails** (or **Email Templates**)
Direct link: https://supabase.com/dashboard/project/dhxsamkaqszffajcwuzn/auth/templates

### What to do
- Glance at **Confirm signup** and **Reset password**; edit the subject/body copy if you
  like. Leave the `{{ .ConfirmationURL }}` placeholder in place — that's the actual link.

---

## Quick test after setup

1. `npm run dev`, open `http://localhost:5173`.
2. **Sign in** with your existing account (works immediately — no dashboard dependency).
3. **Forgot password?** → enter your email → open the email → the link should land on the
   app's **Set a new password** screen (this is the flow Step 1 fixes).
4. **Settings → Account → Change password** → set a new one → sign out and back in with it.

If step 3 lands anywhere other than the reset screen, re-check **Step 1** — the URL/port
don't match.

---

## Step 4 — Password and email-change settings (REQUIRED before launch)

**Why it is no longer optional:** `legal/PRIVACY.md` § 8 now tells users, in the published
policy, that new passwords must be at least 10 characters and are checked against known
breached-password lists, and § 9 tells them an email change is confirmed from both the old
and the new address. Those are statements of fact about the running service. **Until these
three settings are set, the published policy is inaccurate** — and under FTC Act § 5 and
the equivalent EU rules an inaccurate privacy statement is itself the violation, in the one
section a regulator reads first.

The app enforces the length client-side (`MIN_PASSWORD = 10`), but the client is not the
gate — a request straight to the API is. The server has to agree.

### Where
Dashboard → **Authentication** → **Sign In / Providers** → **Passwords**
Direct link: https://supabase.com/dashboard/project/dhxsamkaqszffajcwuzn/auth/providers

### What to do

1. **Leaked password protection** — turn it **on**. It checks new passwords against
   HaveIBeenPwned. Free, and the highest-value control available on this plan: multi-factor
   authentication is a paid feature and is deliberately **not** claimed anywhere in the
   published documents, so this is the control that carries § 8.
2. **Minimum password length** — set to **10**, matching `MIN_PASSWORD` in
   [src/gym-tracker-app.tsx](src/gym-tracker-app.tsx). If you change one, change both.
3. **Secure email change** — confirm it is **on** (Authentication → **Emails**). With it on,
   an email change sends a confirmation link to the old **and** the new address and only
   commits when both are followed. With it off, a single confirmation on the new address is
   enough, which would make § 9's promise false and would let anyone with a borrowed
   unlocked device move the account to their own inbox.

Existing accounts with shorter passwords keep working — sign-in is deliberately not
length-checked, so raising the minimum cannot lock anyone out of their own account. The new
floor applies to sign-ups, password changes and resets.

### Verify

Re-run the security advisor after saving; `auth_leaked_password_protection` should no
longer appear. Then record the date in `compliance/DECISIONS-AND-ASSESSMENTS.md` § 5, which
tracks the other pre-launch facts that the published documents depend on.
