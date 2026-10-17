"use client";
import Link from "next/link";
import { useApp } from "@/components/app-provider";

export default function Home() {
  const { t, user } = useApp();
  const steps = [
    ["how1T", "how1"],
    ["how2T", "how2"],
    ["how3T", "how3"],
  ] as const;
  return (
    <div className="flex flex-col gap-14 py-4">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <span className="chip w-fit">{t("freeNote")}</span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t("heroTitle")}</h1>
          <p className="text-lg text-muted">{t("heroSub")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/evaluators" className="btn-primary px-5 py-3 text-base">
              {t("ctaFind")}
            </Link>
            <Link href={user ? "/me?tab=profile&role=evaluator" : "/login?next=%2Fme%3Ftab%3Dprofile%26role%3Devaluator"} className="btn-ghost px-5 py-3 text-base">
              {t("ctaBe")}
            </Link>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/hero.svg" alt="" width={560} height={420} className="mx-auto w-full max-w-lg" />
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="mb-5 text-2xl font-bold">
          {t("howTitle")}
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="card flex flex-col gap-2 p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
              <h3 className="font-bold">{t(title)}</h3>
              <p className="text-sm text-muted">{t(body)}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5">
          <Link href={user ? "/me/projects/new" : "/login?next=%2Fme%2Fprojects%2Fnew"} className="btn-primary">
            {t("ctaPost")}
          </Link>
        </div>
      </section>

      <section className="card grid items-center gap-6 bg-brand p-6 text-white md:grid-cols-[1fr_auto] md:p-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{t("proTitle")}</h2>
          <p className="text-white/85">{t("proSub")}</p>
        </div>
        <Link href={user ? "/me?tab=profile&role=evaluator" : "/login?next=%2Fme%3Ftab%3Dprofile%26role%3Devaluator"} className="btn bg-white px-5 py-3 text-base text-brand-dark hover:bg-brand-soft">
          {t("ctaBe")}
        </Link>
      </section>
    </div>
  );
}
