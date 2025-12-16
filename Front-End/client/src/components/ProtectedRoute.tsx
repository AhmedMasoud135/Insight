import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!token) setBlocked(true);
  }, [token]);

  if (!token && blocked) {
    return (
      <>
        {children}

        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8 max-w-md w-[90%] text-center animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-3">
              Access Denied
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-6">
              You must be logged in to access this page or perform this action.
            </p>

            <div className="flex justify-center gap-4">
              <a
                href="/login"
                className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition text-sm"
              >
                Login
              </a>
              <a
                href="/signup"
                className="px-5 py-2 rounded-xl bg-black text-white hover:opacity-80 transition text-sm"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
