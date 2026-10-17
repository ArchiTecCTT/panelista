"use client";
import { Suspense } from "react";
import { useApp } from "@/components/app-provider";
import { RequireProfile } from "@/components/guard";
import { ProjectForm } from "@/components/project-form";

function Inner() {
  const { t } = useApp();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("ctaPost")}</h1>
      <ProjectForm />
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense>
      <RequireProfile>
        <Inner />
      </RequireProfile>
    </Suspense>
  );
}
