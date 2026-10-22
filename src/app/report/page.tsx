import { Suspense } from 'react';
import { PageShell } from '@/components/motion';
import { ReportForm } from '@/components/report/report-form';

export const metadata = { title: 'Report a product — LabelCheck' };

export default function ReportPage() {
  return (
    <PageShell>
      <Suspense>
        <ReportForm />
      </Suspense>
    </PageShell>
  );
}
