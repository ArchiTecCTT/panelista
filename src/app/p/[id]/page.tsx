import type { Metadata } from "next";
import { publicDoc } from "@/lib/meta";
import { ProjectView } from "./view";

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await publicDoc(`projects/${id}`);
  if (!p) return {};
  const description = `${p.course} · ${p.school}. Needs ${p.needed} evaluators (${p.acceptedCount} found). ${String(p.abstract).slice(0, 140)}`;
  return { title: p.title, description, openGraph: { title: `Evaluate "${p.title}" on Panelista`, description } };
}

export default async function Page({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  return <ProjectView id={id} />;
}
