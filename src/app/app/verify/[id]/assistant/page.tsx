import { notFound, redirect } from "next/navigation";
import { getCurrentUser, DEFAULT_USER } from "@/server/auth";
import { getVerificationBundle } from "@/server/queries";
import { AssistantView } from "@/components/assistant-view";

export const dynamic = "force-dynamic";

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = (await getCurrentUser()) ?? DEFAULT_USER;
  const { id } = await params;

  const bundle = await getVerificationBundle(user.id, id);
  if (!bundle) notFound();
  if (!bundle.analysis || bundle.verification.status !== "completed") {
    redirect(`/app/verify/${id}`);
  }

  const oa = bundle.analysis.overallAssessment;
  return (
    <AssistantView
      verificationId={id}
      productName={bundle.verification.productName}
      headline={oa.headline}
      counts={{
        supported: oa.supportedCount,
        discrepancy: oa.discrepancyCount,
        unverifiable: oa.unverifiableCount,
      }}
      topDiscrepancies={bundle.analysis.discrepancies
        .slice(0, 3)
        .map((d) => d.claim)}
      initialMessages={bundle.messages}
    />
  );
}
