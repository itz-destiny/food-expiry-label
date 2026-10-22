import { Suspense } from 'react';
import { PageShell } from '@/components/motion';
import { VerifyWorkspace } from '@/components/verify/verify-workspace';

export const metadata = { title: 'Verify a product — LabelCheck' };

export default function VerifyPage() {
  return (
    <PageShell>
      <Suspense>
        <VerifyWorkspace />
      </Suspense>
    </PageShell>
  );
}
