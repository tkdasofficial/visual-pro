import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const planInfo: Record<string, { name: string; price: string; features: string[] }> = {
  pro: {
    name: "Pro Plan",
    price: "$25/month",
    features: ["100 daily credits", "3-day image storage", "All features", "Priority processing"],
  },
  business: {
    name: "Business Plan",
    price: "$50/month",
    features: ["200 daily credits", "7-day storage", "API access", "Team collaboration", "Priority support"],
  },
  enterprise: {
    name: "Enterprise Plan",
    price: "Custom",
    features: ["Unlimited credits", "Custom storage", "Dedicated support", "Custom integrations"],
  },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planKey = params.get("plan") || "pro";
  const plan = planInfo[planKey] || planInfo.pro;
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fullName.trim() || !email.trim() || !transactionId.trim()) return;
    setSubmitting(true);

    const selectedPlan = planKey === "pro" ? "pro" : planKey === "business" ? "starter" : "explorer";

    const { error } = await supabase.from("payment_requests").insert({
      user_id: user.id,
      selected_plan: selectedPlan as any,
      full_name: fullName.trim(),
      email: email.trim(),
      whatsapp_number: phone.trim() || "N/A",
      transaction_id: transactionId.trim(),
      payment_method: "upi" as any,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to submit request. Please try again.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Request Submitted", description: "Our team will review your request shortly." });
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center p-6 py-20 text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold text-foreground">Request Submitted!</h2>
        <p className="text-sm text-muted-foreground">
          Your {plan.name} subscription request has been submitted. Our admin team will review it and get back to you shortly.
        </p>
        <button onClick={() => navigate("/create")} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Back to Create
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-4 sm:p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Subscribe to {plan.name}</h1>
        <p className="text-sm text-muted-foreground">Complete your details to upgrade</p>
      </div>

      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{plan.name}</span>
          <span className="text-sm font-bold text-accent">{plan.price}</span>
        </div>
        <ul className="space-y-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 shrink-0 text-accent" /> {f}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name *</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Your full name" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Email *</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">WhatsApp Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="+1 (555) 000-0000" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Transaction ID *</label>
          <input required value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Your payment transaction ID" />
        </div>
        <button type="submit" disabled={submitting || !fullName.trim() || !email.trim() || !transactionId.trim()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
          {submitting ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <CreditCard className="h-3.5 w-3.5" />}
          {submitting ? "Submitting..." : "Submit Subscription Request"}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">Our admin team will review your request and process payment manually.</p>
      </form>
    </div>
  );
}
