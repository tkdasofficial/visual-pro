import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const plans = [
  {
    key: "explorer",
    name: "Explorer",
    price: "Free",
    period: "forever",
    features: ["5 daily credits", "Basic generation features", "24-hour image storage", "Community support"],
  },
  {
    key: "starter",
    name: "Starter",
    price: "₹499",
    period: "/month",
    popular: true,
    features: ["50 daily credits", "All generation features", "3-day image storage", "Priority processing", "Character engine"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹999",
    period: "/month",
    features: ["200 daily credits", "All features + API access", "7-day image storage", "Priority support", "Unlimited characters", "Advanced analytics"],
  },
];

export default function PlansPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const currentPlan = profile?.plan || "explorer";

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="text-center space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Plans & Pricing</h1>
        <p className="text-sm text-muted-foreground">Choose the plan that fits your creative needs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          return (
            <div key={plan.key} className={`relative rounded-xl border p-5 space-y-4 ${plan.popular ? "border-accent bg-accent/5 shadow-sm" : "border-border bg-card"}`}>
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[10px] font-semibold text-accent-foreground">Most Popular</span>
              )}
              <div>
                <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button disabled className="w-full rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground">Current Plan</button>
              ) : plan.key === "explorer" ? null : (
                <button onClick={() => navigate(`/checkout?plan=${plan.key}`)} className="w-full rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
                  Get {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-6 text-center space-y-3">
        <Crown className="mx-auto h-8 w-8 text-accent" />
        <h3 className="text-base font-semibold text-foreground">Enterprise</h3>
        <p className="text-sm text-muted-foreground">Custom credits, storage duration, and dedicated support for your team</p>
        <button onClick={() => navigate("/support")} className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90">
          Contact Us
        </button>
      </div>
    </div>
  );
}
