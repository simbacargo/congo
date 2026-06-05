"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Check, RefreshCw, Zap, Shield, Globe, Smartphone, CreditCard, Bitcoin, ChevronRight, Utensils, Droplets, GraduationCap, Stethoscope } from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";

const presets = [10, 25, 50, 100, 250, 500];

const causes = [
  { id: "food", icon: Utensils, label: "Food Programs", iconBg: "bg-brand-green/10", iconColor: "text-brand-green", description: "$25 feeds a family for a week" },
  { id: "water", icon: Droplets, label: "Clean Water", iconBg: "bg-brand-gold/10", iconColor: "text-brand-gold", description: "$100 contributes to a borehole" },
  { id: "education", icon: GraduationCap, label: "Education", iconBg: "bg-brand-green/10", iconColor: "text-brand-green", description: "$50 funds a month of school" },
  { id: "medical", icon: Stethoscope, label: "Medical Aid", iconBg: "bg-brand-gold/10", iconColor: "text-brand-gold", description: "$30 covers basic medical care" },
  { id: "general", icon: Heart, label: "Where Needed Most", iconBg: "bg-brand-green/10", iconColor: "text-brand-green", description: "Directed where impact is greatest" },
];

const impactCalculator: Record<number, string[]> = {
  10: ["10 nutritious meals for children", "3 days of clean water for a family"],
  25: ["25 meals + school supplies for 1 child", "1 week of food security for a family"],
  50: ["50 meals + 1 month school fees", "2 weeks of water access"],
  100: ["100 meals + school term for 1 child", "Partial contribution to a borehole"],
  250: ["250 meals + full school year support", "Significant borehole contribution"],
  500: ["500 meals + 2 children's full year", "Major well construction contribution"],
};

export default function DonatePage() {
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedCause, setSelectedCause] = useState("general");
  const [isRecurring, setIsRecurring] = useState(false);
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  const displayAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const impact = impactCalculator[displayAmount] || impactCalculator[50];

  return (
    <div className="bg-navy min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-gold/5 blur-[80px] animate-blob" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="mb-5">
              <Badge variant="green">Give Today</Badge>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="font-jakarta font-extrabold text-5xl sm:text-6xl text-warm-white mb-4 tracking-tight">
              Your donation,{" "}
              <span className="gradient-text">their future</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-muted text-lg">
              100% of your donation reaches beneficiaries. Zero platform fees for donors.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-8"
              >
                {/* Form — 3 cols */}
                <div className="lg:col-span-3 space-y-5">
                  {/* Recurring toggle */}
                  <div className="glass rounded-2xl p-5 border border-white/8">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsRecurring(false)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${!isRecurring ? "bg-brand-green text-navy" : "text-muted hover:text-warm-white"}`}
                      >
                        One Time
                      </button>
                      <button
                        onClick={() => setIsRecurring(true)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${isRecurring ? "bg-brand-green text-navy" : "text-muted hover:text-warm-white"}`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Monthly
                      </button>
                    </div>
                    {isRecurring && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-xs text-brand-green mt-3 flex items-center gap-1.5"
                      >
                        <Zap className="w-3 h-3" />
                        Monthly donors get a real-time impact report. Cancel anytime.
                      </motion.p>
                    )}
                  </div>

                  {/* Amount Presets */}
                  <div className="glass rounded-2xl p-6 border border-white/8">
                    <h3 className="font-jakarta font-semibold text-sm text-warm-white mb-4">Select Amount (USD)</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {presets.map((p) => (
                        <button
                          key={p}
                          onClick={() => { setAmount(p); setCustomAmount(""); }}
                          className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${amount === p && !customAmount ? "bg-brand-green text-navy shadow-lg shadow-brand-green/25" : "bg-white/5 text-muted hover:bg-white/10 hover:text-warm-white"}`}
                        >
                          ${p}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                      <input
                        type="number"
                        placeholder="Custom amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Cause Selection */}
                  <div className="glass rounded-2xl p-6 border border-white/8">
                    <h3 className="font-jakarta font-semibold text-sm text-warm-white mb-4">Choose a Cause</h3>
                    <div className="space-y-2">
                      {causes.map((cause) => (
                        <button
                          key={cause.id}
                          onClick={() => setSelectedCause(cause.id)}
                          className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200 text-left ${selectedCause === cause.id ? "bg-brand-green/10 border border-brand-green/30" : "bg-white/3 border border-white/5 hover:bg-white/7"}`}
                        >
                          <div className={`w-10 h-10 rounded-xl ${cause.iconBg} flex items-center justify-center shrink-0`}>
                            <cause.icon className={`w-5 h-5 ${cause.iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-warm-white">{cause.label}</p>
                            <p className="text-xs text-muted">{cause.description}</p>
                          </div>
                          {selectedCause === cause.id && <Check className="w-4 h-4 text-brand-green shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="glass rounded-2xl p-6 border border-white/8">
                    <h3 className="font-jakarta font-semibold text-sm text-warm-white mb-4">Payment Method</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { icon: CreditCard, label: "Card", active: true },
                        { icon: Smartphone, label: "M-Pesa", active: false },
                        { icon: Bitcoin, label: "Crypto", active: false },
                      ].map((method) => (
                        <button
                          key={method.label}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${method.active ? "border-brand-green/40 bg-brand-green/8" : "border-white/8 bg-white/3 hover:bg-white/7"}`}
                        >
                          <method.icon className={`w-5 h-5 ${method.active ? "text-brand-green" : "text-muted"}`} />
                          <span className={`text-xs font-medium ${method.active ? "text-brand-green" : "text-muted"}`}>{method.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <input type="text" placeholder="Card number" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="MM / YY" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                        <input type="text" placeholder="CVC" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                      </div>
                      <input type="text" placeholder="Full name on card" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSuccess(true)}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-brand-green hover:bg-brand-green-light text-navy font-bold text-base rounded-2xl transition-all shadow-xl hover:shadow-brand-green/30 animate-glow"
                  >
                    <Heart className="w-5 h-5" />
                    Donate ${displayAmount}{isRecurring ? "/mo" : ""} Now
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                  <p className="text-center text-xs text-muted flex items-center justify-center gap-1.5">
                    <Shield className="w-3 h-3 text-brand-green" />
                    Secured by 256-bit SSL encryption. Receipts emailed instantly.
                  </p>
                </div>

                {/* Sidebar — 2 cols */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Impact preview */}
                  <div className="glass rounded-2xl p-6 border border-brand-green/20">
                    <h3 className="font-jakarta font-semibold text-sm text-warm-white mb-4">
                      Your ${displayAmount} impact
                    </h3>
                    <div className="space-y-3">
                      {impact.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                          <p className="text-sm text-muted">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trust indicators */}
                  <div className="glass rounded-2xl p-6 border border-white/8 space-y-4">
                    {[
                      { icon: Shield, text: "100% funds reach beneficiaries", color: "text-brand-green" },
                      { icon: Globe, text: "Operating in 7 African nations", color: "text-brand-gold" },
                      { icon: Check, text: "Registered NGO — Tanzania", color: "text-brand-green" },
                      { icon: Zap, text: "Real-time tracking via your dashboard", color: "text-brand-gold" },
                    ].map(({ icon: Icon, text, color }) => (
                      <div key={text} className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${color} shrink-0`} />
                        <p className="text-sm text-muted">{text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent donors */}
                  <div className="glass rounded-2xl p-6 border border-white/8">
                    <h3 className="font-jakarta font-semibold text-sm text-warm-white mb-4">Recent Donors</h3>
                    <div className="space-y-3">
                      {["Amina K. — $50", "David M. — $100", "Grace O. — $25", "Emmanuel T. — $250"].map((d) => (
                        <div key={d} className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-green/20 flex items-center justify-center text-xs font-bold text-brand-green">
                            {d[0]}
                          </div>
                          <span className="text-sm text-muted">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-24 h-24 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center mx-auto mb-8 animate-glow">
                  <Check className="w-12 h-12 text-brand-green" />
                </div>
                <h2 className="font-jakarta font-extrabold text-4xl text-warm-white mb-4">
                  Thank you! 🎉
                </h2>
                <p className="text-muted text-lg mb-8 max-w-md mx-auto">
                  Your ${displayAmount} donation is already working. A receipt has been sent to your email, and you can track your impact in real-time.
                </p>
                <button
                  onClick={() => { setSuccess(false); setAmount(50); setCustomAmount(""); }}
                  className="px-8 py-3 bg-brand-green hover:bg-brand-green-light text-navy font-semibold rounded-xl transition-all"
                >
                  Donate Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
