# Neff Paving Documentation

This is the official documentation site for the Neff Paving system, built with Next.js and Fumadocs.

## Getting Started

Run the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open http://localhost:3000 with your browser to see the result.

## Project Structure

- `content/docs/` - All documentation content in MDX format
- `lib/source.ts` - Content source adapter using Fumadocs loader
- `app/` - Next.js app directory with pages and layouts

| Route                 | Description                                       |
| --------------------- | ------------------------------------------------- |
| `app/`                | Landing page                                      |
| `app/docs/`           | Documentation layout and dynamic pages           |
| `content/docs/`       | MDX documentation files                          |

## Documentation Sections

- **System Overview** - Architecture and components
- **API Documentation** - REST API endpoints and examples
- **Deployment** - Vercel deployment guide
- **Security** - Best practices and guidelines

## Building for Production

```bash
npm run build
```

## Deployment

The documentation is designed to be deployed on Vercel. See the deployment guide in the documentation for detailed instructions.

## Contributing

To add or update documentation:

1. Edit MDX files in `content/docs/`
2. Update `meta.json` files to adjust navigation
3. Run `npm run dev` to preview changes
4. Build and test before deploying

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Fumadocs](https://fumadocs.vercel.app)
