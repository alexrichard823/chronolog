import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-gray-900 sm:py-16">
      <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-950">← Chronolog</Link>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Effective August 28, 2026</p>

      <div className="mt-10 space-y-8 leading-7 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-950">What Chronolog is</h2>
          <p className="mt-2">Chronolog is a private family-history service. Family archives are intended to be accessible only to people who have been granted membership in that archive.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Information we process</h2>
          <p className="mt-2">We process account information such as your email address and authentication data, plus information you or other family members choose to add to an archive. Archive content can include names, dates, biographies, relationships, stories, events, photographs, audio, video, documents, and information about living or deceased relatives.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">How information is used</h2>
          <p className="mt-2">We use this information to authenticate users, provide private family archives, display connected family-history records, deliver invitations and account emails, enforce permissions, maintain security, and operate and improve the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Sharing and service providers</h2>
          <p className="mt-2">Chronolog does not make family archives public by default. We use infrastructure providers to operate the service, including hosting, database/storage, authentication, and transactional-email providers. These providers process information only as needed to provide their services to Chronolog. We may also disclose information when required by law or to protect the security and integrity of the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Family-member responsibility</h2>
          <p className="mt-2">Archive members are responsible for having an appropriate basis to add information about other people, especially living relatives and children. Do not upload highly sensitive information that is not necessary for preserving the family story.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Retention and deletion</h2>
          <p className="mt-2">Content is retained while the relevant account or family archive remains active, subject to operational backups and security logs. Owners can delete an archive using the controls provided in the product. Some information may remain temporarily in backups or logs until those systems rotate or are purged.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Security</h2>
          <p className="mt-2">Chronolog uses access controls and private storage designed to keep one family&apos;s archive separate from another. No online service can guarantee absolute security, so users should use strong, unique passwords and protect access to their email accounts.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-950">Pilot status</h2>
          <p className="mt-2">Chronolog is currently an early-stage service. Features, retention practices, and this policy may change as the product develops. Material changes will be reflected by updating the effective date on this page.</p>
        </section>
      </div>
    </main>
  );
}
