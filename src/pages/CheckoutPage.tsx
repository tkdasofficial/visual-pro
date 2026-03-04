import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, CheckCircle, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const planInfo: Record<string, { name: string; price: string; dbKey: string; features: string[] }> = {
  starter: {
    name: "Starter Plan",
    price: "₹499/month",
    dbKey: "starter",
    features: ["50 daily credits", "3-day image storage", "All features", "Priority processing"],
  },
  pro: {
    name: "Pro Plan",
    price: "₹999/month",
    dbKey: "pro",
    features: ["200 daily credits", "7-day storage", "API access", "Unlimited characters", "Priority support"],
  },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planKey = params.get("plan") || "starter";
  const plan = planInfo[planKey] || planInfo.starter;
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(profile?.whatsapp_number || "");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank_transfer">("upi");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fullName.trim() || !email.trim() || !phone.trim() || !transactionId.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("payment_requests").insert({
      user_id: user.id,
      selected_plan: plan.dbKey as any,
      full_name: fullName.trim(),
      email: email.trim(),
      whatsapp_number: phone.trim(),
      transaction_id: transactionId.trim(),
      payment_method: paymentMethod as any,
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
        <p className="text-sm text-muted-foreground">Your {plan.name} subscription request has been submitted. Our team will review and activate your plan shortly.</p>
        <button onClick={() => navigate("/create")} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Back to Create</button>
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
          <label className="mb-1.5 block text-sm font-medium text-foreground">WhatsApp Number *</label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="+91 XXXXX XXXXX" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Payment Method *</label>
          <div className="flex gap-2">
            {(["upi", "bank_transfer"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${paymentMethod === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
                {m === "upi" ? "UPI" : "Bank Transfer"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Transaction ID *</label>
          <input required value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Your payment transaction ID" />
        </div>
        <button type="submit" disabled={submitting || !fullName.trim() || !email.trim() || !phone.trim() || !transactionId.trim()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
          {submitting ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <CreditCard className="h-3.5 w-3.5" />}
          {submitting ? "Submitting..." : "Submit Subscription Request"}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">Our admin team will review your request and activate your plan.</p>
      </form>
    </div>
  );
}
