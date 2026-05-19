import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center fade-up">
      <div className="text-center max-w-md">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <span className="absolute inset-0 bg-aurora rounded-full opacity-80" aria-hidden />
          <span
            className="relative w-full h-full rounded-full flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))" }}
          >
            <Compass size={32} />
          </span>
        </div>
        <h2 className="text-[32px] font-semibold tracking-tight">404</h2>
        <p className="text-[14px] text-muted mt-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn btn-primary btn-sm mt-6 inline-flex">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
