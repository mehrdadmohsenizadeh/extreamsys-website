export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center container-padding">
      <div className="text-center space-y-8 animate-slide-up">
        {/* Logo placeholder - will be replaced with actual logo */}
        <div className="flex justify-center mb-8">
          <div className="text-6xl font-bold text-gradient">
            ExtreamSys
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-balance">
          Enterprise IT Infrastructure
          <br />
          <span className="text-gradient">Done Right</span>
        </h1>

        <p className="text-xl text-muted max-w-2xl mx-auto text-balance">
          San Diego&apos;s trusted partner for managed IT services, network engineering,
          and cybersecurity solutions.
        </p>

        <div className="flex gap-4 justify-center pt-8">
          <button className="btn-primary">
            Get Started
          </button>
          <button className="btn-secondary">
            View Services
          </button>
        </div>

        <div className="pt-16 text-sm text-muted">
          Phase 1: Architecture & Security Baseline ✓
        </div>
      </div>
    </main>
  );
}
