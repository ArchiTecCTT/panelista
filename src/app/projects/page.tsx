"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query, startAfter, where, type QueryConstraint, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIES } from "@/lib/domain";
import { CATEGORY_LABELS } from "@/lib/i18n";
import type { Project } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import { ProjectCard } from "@/components/cards";
import { Empty, Spinner } from "@/components/ui";

const PAGE = 24;

export default function ProjectsPage() {
  const { t, user } = useApp();
  const [cat, setCat] = useState("");
  const [items, setItems] = useState<Project[] | null>(null);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);

  const load = useCallback(
    async (after: QueryDocumentSnapshot | null) => {
      const c: QueryConstraint[] = [where("status", "==", "open")];
      if (cat) c.push(where("categories", "array-contains", cat));
      c.push(orderBy("createdAt", "desc"), limit(PAGE));
      if (after) c.push(startAfter(after));
      const snap = await getDocs(query(collection(db, "projects"), ...c));
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
      setItems((prev) => (after && prev ? [...prev, ...rows] : rows));
      setCursor(snap.docs.at(-1) ?? null);
      setMore(snap.size === PAGE);
    },
    [cat],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the loading state while a new filter loads
    setItems(null);
    load(null).catch(() => setItems([]));
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("projectsTitle")}</h1>
        <Link href={user ? "/me/projects/new" : "/login?next=%2Fme%2Fprojects%2Fnew"} className="btn-primary">
          {t("ctaPost")}
        </Link>
      </div>
      <select className="input sm:max-w-[220px]" value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t("allCategories")}>
        <option value="">{t("allCategories")}</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty img="empty-projects" text={t("noProjects")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
      {more && (
        <button className="btn-ghost mx-auto" onClick={() => load(cursor)}>
          {t("loadMore")}
        </button>
      )}
    </div>
  );
}
