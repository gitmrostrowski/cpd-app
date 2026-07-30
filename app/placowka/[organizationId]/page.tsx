import OrganizationPanelClient from "./OrganizationPanelClient";

type Props = {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ joined?: string }>;
};

export default async function OrganizationPanelPage({
  params,
  searchParams,
}: Props) {
  const { organizationId } = await params;
  const { joined } = await searchParams;
  return (
    <OrganizationPanelClient
      organizationId={organizationId}
      showJoinedNotice={joined === "1"}
    />
  );
}
