import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import { getSettings } from "@/lib/settings";

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold gs-text-gradient">Terms & conditions</h1>
        <p className="mt-4 whitespace-pre-line text-[var(--ink)]">{s.termsText}</p>
      </main>
      <Footer />
    </>
  );
}
