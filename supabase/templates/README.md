# Auth email templates

Dark emails in the board's look. Each file holds an English and a Portuguese version; the Portuguese one is sent when the user signed up from `/pt` (the login form stores `locale` in `user_metadata`), English otherwise.

Paste each file into Supabase: **Authentication > Emails > Templates**, in the template below, and set its subject.

| File | Template | Subject |
| --- | --- | --- |
| `confirm-signup.html` | Confirm signup | `{{ if eq .Data.locale "pt" }}Confirme seu e-mail · Board Lógica{{ else }}Confirm your email · Logic Board{{ end }}` |
| `reset-password.html` | Reset password | `{{ if eq .Data.locale "pt" }}Redefina sua senha · Board Lógica{{ else }}Reset your password · Logic Board{{ end }}` |
| `magic-link.html` | Magic link | `{{ if eq .Data.locale "pt" }}Seu link de acesso · Board Lógica{{ else }}Your sign-in link · Logic Board{{ end }}` |
| `change-email.html` | Change email address | `{{ if eq .Data.locale "pt" }}Confirme seu novo e-mail · Board Lógica{{ else }}Confirm your new email · Logic Board{{ end }}` |
