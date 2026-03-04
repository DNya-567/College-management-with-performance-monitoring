// 404 page — shown when no route matches.
// Must NOT contain API calls or auth logic.
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-6">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="mb-2 text-6xl font-bold text-[#0052FF]">404</p>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">
        Page not found
      </h2>
      <p className="mb-6 text-sm text-slate-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/login"
        className="inline-block rounded-full bg-[#0052FF] px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
      >
        Go to Login
      </Link>
    </div>
  </div>
);

export default NotFound;

