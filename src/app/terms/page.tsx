import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-gray-900 sm:py-16">
      <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-950">← Chronolog</Link>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Terms of Use</h1>
      <p className="mt-2 text-sm text-gray-500">Effective August 28, 2026</p>

      <div className="mt-10 space-y-8 leading-7 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Using Chronolog</h2>
          <p className="mt-2">Chronolog provides private tools for organizing and preserving family history. You may use the service only for lawful purposes and in a way that respects the privacy and rights of other people.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Accounts and access</h2>
          <p className="mt-2">You are responsible for your account credentials and activity performed through your account. Family archive access is controlled by archive roles and invitations. Do not attempt to access archives or information you have not been authorized to use.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Your content</h2>
          <p className="mt-2">You and your family retain ownership of content you add to Chronolog. By uploading or entering content, you give Chronolog permission to store, process, reproduce, and display it as needed to operate the service for authorized archive members. You are responsible for ensuring you have the right to contribute that content.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Living relatives and sensitive information</h2>
          <p className="mt-2">Use care when documenting living people, children, medical details, financial information, government identifiers, or other sensitive information. Chronolog is designed for family history, not as a secure vault for secrets or regulated records.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Acceptable use</h2>
          <p className="mt-2">Do not use Chronolog to violate law, infringe intellectual-property or privacy rights, harass others, distribute malware, probe or bypass security controls, overload the service, or upload content you are not authorized to possess or share.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Archive management and deletion</h2>
          <p className="mt-2">Archive Owners control membership and destructive archive actions. Deleting an archive can permanently remove family-history content from the active service. Users should keep independent copies of irreplaceable original media and documents.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Pilot service and availability</h2>
          <p className="mt-2">Chronolog is currently an early-stage product and may change, experience interruptions, or contain defects. The service is not a guaranteed archival preservation or backup service. Important originals should also be preserved independently.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Changes</h2>
          <p className="mt-2">These terms may be updated as Chronolog develops. Material changes will be reflected by updating the effective date on this page. Continued use after changes means you accept the updated terms.</p>
        </section>
      </div>
    </main>
  );
}
