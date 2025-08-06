import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { pageTree } from '@/lib/source';

export default function RootDocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: 'Neff Paving Docs',
      }}
      sidebar={{
        banner: (
          <div className="p-2 text-sm text-muted-foreground">
            v1.0.0 - Latest
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
