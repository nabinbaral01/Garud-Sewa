import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import { getSettings } from "@/lib/settings";

export default async function HelpPage() {
  const s = await getSettings();
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold gs-text-gradient">Help center</h1>
        <p className="mt-4 whitespace-pre-line text-[var(--ink)]">{s.helpText}</p>
        <div className="mt-6 gs-card p-5 text-sm">
          <div>Email: {s.contactEmail}</div>
          <div>Phone: {s.contactPhone}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
