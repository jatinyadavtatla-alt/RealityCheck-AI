import { getCurrentUser, DEFAULT_USER } from "@/server/auth";
import { getAiConfigStatus } from "@/server/env";
import { SettingsView } from "@/components/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = (await getCurrentUser()) ?? DEFAULT_USER;
  const ai = getAiConfigStatus();

  return (
    <SettingsView
      user={{
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      }}
      ai={{
        configured: ai.configured,
        model: ai.model,
        modelRecognized: ai.modelRecognized,
      }}
    />
  );
}
