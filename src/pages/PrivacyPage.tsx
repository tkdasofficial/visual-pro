import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Privacy Policy</h1>
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Introduction</h2>
          <p>Avzio respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how Visual Pro collects, uses, and protects user data.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Information We Collect</h2>
          <p>Account Information: Full Name, Email Address, Password (securely encrypted). Usage Data: Prompts entered, generated images, generation history, feature usage statistics. Technical Data: IP address, device type, browser type, log data.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. How We Use Your Information</h2>
          <p>We use your data to provide platform functionality, authenticate users, improve AI performance, prevent fraud and abuse, send important service notifications, and process payments. We do NOT sell personal data to third parties.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Data Storage & Security</h2>
          <p>Passwords are encrypted. Secure authentication tokens are used. Data is stored on secure servers. Access to data is restricted to authorized systems only.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. User Rights</h2>
          <p>Users may request access to their data, request correction of incorrect data, request deletion of their account, and withdraw consent for certain data usage.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Children's Privacy</h2>
          <p>Visual Pro is not intended for children under 13. We do not knowingly collect data from minors.</p>
        </section>
      </div>
      <p className="mt-12 text-xs text-muted-foreground">Visual Pro © 2026 Avzio. All rights reserved.</p>
    </div>
  );
}
