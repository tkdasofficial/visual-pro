import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Terms & Conditions</h1>
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Introduction</h2>
          <p>Welcome to Visual Pro, a digital AI-powered image generation platform operated by Avzio. By accessing or using Visual Pro, you agree to comply with and be legally bound by these Terms & Conditions.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Eligibility</h2>
          <p>To use Visual Pro, you must be at least 13 years old, provide accurate registration information, and not use the platform for unlawful purposes. Avzio reserves the right to suspend or terminate accounts that violate these conditions.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. Account Responsibility</h2>
          <p>Users are responsible for maintaining the confidentiality of their login credentials.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Platform Usage Rules</h2>
          <p>Users agree not to generate illegal, harmful, violent, explicit, or abusive content; create copyrighted material without proper rights; attempt to reverse engineer or exploit the system; use automation or bots to abuse generation limits; or resell access to the platform without permission.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. AI-Generated Content</h2>
          <p>AI outputs may not always be accurate. Generated content may resemble existing works. Users are responsible for reviewing content before commercial use. Avzio does not guarantee uniqueness of generated images.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Intellectual Property</h2>
          <p>The Visual Pro system, interface, branding, and technology are owned by Avzio. Users retain ownership of images they generate.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">7. Limitation of Liability</h2>
          <p>Avzio is not liable for loss of data, business losses, indirect or consequential damages, or misuse of generated content. Users use Visual Pro at their own risk.</p>
        </section>
      </div>
      <p className="mt-12 text-xs text-muted-foreground">Visual Pro © 2026 Avzio. All rights reserved.</p>
    </div>
  );
}
