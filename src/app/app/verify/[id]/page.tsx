import { notFound, redirect } from "next/navigation";
import { getCurrentUser, DEFAULT_USER } from "@/server/auth";
import { getVerificationBundle } from "@/server/queries";
import { ReportView, type ReportData } from "@/components/report-view";

export const dynamic = "force-dynamic";

export default async function VerificationReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = (await getCurrentUser()) ?? DEFAULT_USER;
  const { id } = await params;

  const bundle = await getVerificationBundle(user.id, id);
  if (!bundle) notFound();

  if (bundle.verification.status === "analyzing") {
    redirect(`/app/verify/${id}/analyze`);
  }

  const v = bundle.verification;
  const data: ReportData = {
    verification: {
      id: v.id,
      productName: v.productName,
      productCategory: v.productCategory,
      listingUrl: v.listingUrl,
      sellerDescription: v.sellerDescription,
      additionalDetails: v.additionalDetails,
      status: v.status,
      errorMessage: v.errorMessage,
      createdAt: v.createdAt.toISOString(),
    },
    analysis: bundle.analysis
      ? {
          modelUsed: bundle.analysis.modelUsed,
          durationMs: bundle.analysis.durationMs,
          createdAt: bundle.analysis.createdAt.toISOString(),
          productOverview: bundle.analysis.productOverview,
          extractedClaims: bundle.analysis.extractedClaims,
          visualObservations: bundle.analysis.visualObservations,
          comparisons: bundle.analysis.comparisons,
          discrepancies: bundle.analysis.discrepancies,
          unverifiableClaims: bundle.analysis.unverifiableClaims,
          followUpQuestions: bundle.analysis.followUpQuestions,
          overallAssessment: bundle.analysis.overallAssessment,
        }
      : null,
    images: bundle.images,
    messages: bundle.messages,
  };

  return <ReportView data={data} />;
}
