'use client';

import { use } from 'react';

import { DashboardLayout } from '@/components/admin';
import { EditorLoadingScreen, EditorPageHeader } from '@/components/editor';
import { useEditorAuth } from '@/hooks/useEditorAuth';
import { getEditorNavSections } from '@/lib/navigation';

import { SignboardWorkspace } from './components';

export default function SignboardGeneratorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const { staff, authLoading, handleLogout } = useEditorAuth(lang);

  if (authLoading) {
    return <EditorLoadingScreen message="Loading signboard generator..." />;
  }

  return (
    <DashboardLayout
      lang={lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com.np'}
      navSections={getEditorNavSections(lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <SignboardWorkspace
        header={
          <EditorPageHeader
            title="Signboard Generator"
            description="Create a print-ready shop signboard in any size. Only the shop name, URL and dimensions change — the branding is fixed."
            lang={lang}
          />
        }
      />
    </DashboardLayout>
  );
}
