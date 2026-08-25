AutomateApply is a Next.js MVP for authenticated job discovery, resume tailoring, and a review-only application tracker.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local setup

1. Configure `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor. It creates the data tables, RLS policies, and private `resumes` bucket.
3. Configure an OpenAI-compatible AI provider. OpenRouter works by setting `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1` and `OPENROUTER_API_KEY`; optionally set `AI_MODEL` to an available free model. Together is used as a fallback when configured.

Jobs are loaded from Jobicy’s no-key remote-jobs API. “Add to review” records a job in your private tracker; it does not submit anything to a third-party job board.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
