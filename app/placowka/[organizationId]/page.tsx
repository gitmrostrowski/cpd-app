import OrganizationPanelClient from "./OrganizationPanelClient";

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationPanelPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationPanelClient organizationId={organizationId} />;
}
