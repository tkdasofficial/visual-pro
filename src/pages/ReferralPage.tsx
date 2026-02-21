import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, Gift, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function ReferralPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/invite/${profile?.referral_code || ""}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Referral link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-lg p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Referral Program</h1>
        <p className="text-sm text-muted-foreground">Invite friends and earn bonus credits</p>
      </div>

      {/* Hero card */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center space-y-3">
        <Gift className="mx-auto h-10 w-10 text-accent" />
        <h2 className="text-base font-semibold text-foreground">Share & Earn</h2>
        <p className="text-sm text-muted-foreground">
          Both you and your friend receive <strong className="text-foreground">10 bonus credits</strong> when they sign up using your link.
        </p>
      </div>

      {/* Link */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Referral Link</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralLink}
            className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium text-foreground">How It Works</h3>
        {[
          { step: "1", text: "Share your referral link with friends" },
          { step: "2", text: "They sign up using your link" },
          { step: "3", text: "Both accounts receive 10 bonus credits" },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {item.step}
            </span>
            <p className="text-sm text-muted-foreground pt-0.5">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
