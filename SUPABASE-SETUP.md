# Supabase setup for password auth

One-time dashboard setup so the login, signup, password-reset, and change-password
flows work. Only **Step 1** is strictly required; Steps 2–3 are choices/polish.

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

## Optional, not enabled

Supabase's **leaked-password protection** (checks new passwords against known breaches) is
currently **off** by your choice. If you ever want it: **Authentication → Sign In / Providers
→ Passwords** and enable "leaked password protection". It's the only item Supabase's
security advisor currently flags, and it's purely optional.
