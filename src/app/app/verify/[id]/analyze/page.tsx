import { notFound, redirect } from "next/navigation";
import { getCurrentUser, DEFAULT_USER } from "@/server/auth";
import { getVerificationBundle } from "@/server/queries";
import { AnalyzeView } from "@/components/analyze-view";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = (await getCurrentUser()) ?? DEFAULT_USER;
  const { id } = await params;

  const bundle = await getVerificationBundle(user.id, id);
  if (!bundle) notFound();

  if (bundle.analysis && bundle.verification.status === "completed") {
    redirect(`/app/verify/${id}`);
  }

  return (
    <AnalyzeView
      verificationId={id}
      productName={bundle.verification.productName}
      previousError={
        bundle.verification.status === "failed"
          ? bundle.verification.errorMessage
          : null
      }
    />
  );
}
