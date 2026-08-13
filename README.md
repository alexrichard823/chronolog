# Chronolog

Chronolog is a private, collaborative family-history and storytelling application built with Next.js and Supabase.

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000).

## Supabase authentication configuration

Set these environment variables locally and in the stable production deployment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
```

`NEXT_PUBLIC_SITE_URL` may be omitted during local development, where it defaults to `http://localhost:3000`. It is required for production builds and must be the stable production origin. Do not set it to an arbitrary Vercel preview URL.

In the Supabase dashboard:

1. Enable the Email provider and require email confirmation.
2. Set the production Site URL to the stable HTTPS production origin.
3. Allow only the following authentication callback URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.example/auth/callback`
4. Set the minimum password length to 12 characters so backend enforcement matches the application.
5. Review authentication rate limits and enable compromised-password protection when available.

The browser uses only the publishable key. A Supabase service-role key is not required and must not be exposed to this application.

## Deferred production configuration

- Configure a custom SMTP provider and branded confirmation/password-reset templates before production launch.
- Google and Apple authentication are outside A-01 and remain deferred.
- Authentication is intentionally unsupported on arbitrary Vercel preview origins for now.

## Verification

```bash
npm run lint
npm run build
git diff --check
```
