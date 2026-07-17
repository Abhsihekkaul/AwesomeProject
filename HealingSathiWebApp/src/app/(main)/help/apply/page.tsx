"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";

type Application = {
  id: string;
  fullName: string;
  specialty: string;
  status: "pending" | "approved" | "rejected";
};

/** "Join as a consultant" (the app's BecomeConsultantScreen) + review status. */
export default function ApplyPage() {
  const { isAuthenticated } = useAuth();

  const { data: application, refresh } = useLiveData<Application | null>(
    ["my-application"],
    async () => resourcesApi.getMyConsultantApplication(),
    null,
    { emptyData: null },
  );

  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [credentials, setCredentials] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!fullName.trim() || !specialty.trim() || !credentials.trim()) {
      setError("Name, specialty and credentials are required");
      return;
    }
    if (!isAuthenticated) {
      setError("Demo mode can't apply — sign in first");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await resourcesApi.applyAsConsultant({
        fullName: fullName.trim(),
        specialty: specialty.trim(),
        credentials: credentials.trim(),
        licenseNumber: licenseNumber.trim() || undefined,
        yearsExperience: Number(yearsExperience) || 0,
        bio: bio.trim() || undefined,
      });
      refresh();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't submit the application"));
    } finally {
      setBusy(false);
    }
  };

  if (application && application.status !== "rejected") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card p-8 text-center">
        <h1 className="text-heading font-bold text-ink">
          {application.status === "approved" ? "You're approved! 🎉" : "Application under review"}
        </h1>
        <p className="mt-2 text-step text-muted">
          {application.status === "approved"
            ? "Your consultant profile is live in Psychological Help."
            : `Our medical team is reviewing ${application.fullName}'s ${application.specialty} application — you'll get a notification either way (usually 3–5 days).`}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-heading font-bold text-ink">Join as a consultant</h1>
      <p className="text-step text-muted">
        Licensed professionals only — every application is reviewed by the medical team before a
        profile goes live.
      </p>
      {application?.status === "rejected" ? (
        <p className="rounded-xl bg-light-orange px-4 py-2 text-step font-medium text-warning">
          Your previous application wasn&apos;t approved — you&apos;re welcome to reapply with updated details.
        </p>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-line bg-card p-5">
        {error ? <p className="text-step font-medium text-danger">{error}</p> : null}
        <Field label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. ..." />
        <Field label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Clinical Psychologist" />
        <Field label="Credentials" value={credentials} onChange={(e) => setCredentials(e.target.value)} placeholder="Degrees / certifications" />
        <Field label="License number (optional)" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
        <Field label="Years of experience" type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="0" />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Short bio (optional)</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full resize-y rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </label>
        <Button onClick={submit} disabled={busy}>
          {busy ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </div>
  );
}
