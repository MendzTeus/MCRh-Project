import type { ReactNode } from 'react';
import { AdminLoadState, AdminPageHeader, AdminShell } from '../components/admin/AdminShell';
import { ADMIN_NAV_ITEMS, type AdminNavId } from '../components/admin/adminNavigation';
import { useAdminAuth } from '../components/admin/AdminAuthContext';
import { ContentEditor } from '../components/admin/content/ContentEditor';
import { AvailabilityTab } from '../components/admin/sections/AvailabilitySection';
import { CollectorTab } from '../components/admin/sections/CollectorSection';
import { ImagesTab } from '../components/admin/sections/ImagesSection';
import { PhotosTab } from '../components/admin/sections/PhotosSection';
import { PropertiesTab } from '../components/admin/sections/PropertiesSection';
import { useApi } from '../hooks/useAdminApi';
import { useAdminProperties, useAdminSite, useAdminUnits } from '../hooks/useAdminData';

function useAdminPageApi() {
  const { token, logout } = useAdminAuth();
  return useApi(token, logout);
}

function SectionPage({ id, title, description, children }: { id: AdminNavId; title: string; description?: string; children: ReactNode }) {
  return (
    <AdminShell navItems={ADMIN_NAV_ITEMS} activeId={id} breadcrumbs={[{ label: 'Admin' }, { label: title }]}>
      <AdminPageHeader title={title} description={description} />
      {children}
    </AdminShell>
  );
}

export function AdminContentPage() {
  const api = useAdminPageApi();
  const { site, loaded, error, reload, saveContent } = useAdminSite(api);
  return (
    <SectionPage id="content" title="Textos do site" description="Todos os textos das páginas públicas, organizados por página.">
      <AdminLoadState loaded={loaded} error={error} onRetry={reload}>
        <ContentEditor content={site.content} onSave={saveContent} />
      </AdminLoadState>
    </SectionPage>
  );
}

export function AdminImagesPage() {
  const api = useAdminPageApi();
  const { site, loaded, error, reload, onImageChanged } = useAdminSite(api);
  return (
    <SectionPage id="images" title="Imagens das páginas" description="Fotos de capa e de destaque das páginas públicas.">
      <AdminLoadState loaded={loaded} error={error} onRetry={reload}>
        <ImagesTab site={site} api={api} onImageChanged={onImageChanged} />
      </AdminLoadState>
    </SectionPage>
  );
}

export function AdminPropertiesPage() {
  const api = useAdminPageApi();
  const props = useAdminProperties(api);
  return (
    <SectionPage id="properties" title="Prédios e coleções"
      description="Nome, descrição, amenidades, distâncias, galeria e ordem dos apartamentos de cada prédio.">
      <AdminLoadState loaded={props.loaded} error={props.error} onRetry={props.reload}>
        <PropertiesTab
          properties={props.properties}
          api={api}
          onPropertyChanged={props.replaceProperty}
        />
      </AdminLoadState>
    </SectionPage>
  );
}

export function AdminPhotosPage() {
  const api = useAdminPageApi();
  const { units, loaded, error, reload } = useAdminUnits(api);
  return (
    <SectionPage id="photos" title="Fotos dos apartamentos" description="Envie, ordene, categorize e esconda as fotos de cada apartamento.">
      <AdminLoadState loaded={loaded} error={error} onRetry={reload}>
        <PhotosTab units={units} api={api} onChanged={reload} />
      </AdminLoadState>
    </SectionPage>
  );
}

export function AdminAvailabilityPage() {
  const api = useAdminPageApi();
  return (
    <SectionPage id="availability" title="Disponibilidade" description="Sincronização dos calendários (iCal) do Airbnb e do VRBO.">
      <AvailabilityTab api={api} />
    </SectionPage>
  );
}

export function AdminCollectorPage() {
  return (
    <SectionPage id="collector" title="Coletor de avaliações" description="Ferramenta para copiar avaliações do Airbnb e importá-las em Avaliações.">
      <CollectorTab />
    </SectionPage>
  );
}
