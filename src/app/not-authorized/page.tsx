"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

export default function NotAuthorizedPage() {
  useEffect(() => {
  toast.dismiss();
}, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-6">
      <h1 className="text-4xl font-bold text-red-500 mb-4">403 - Unauthorized</h1>
      <p className="text-gray-600 mb-6">
        You are not allowed to access this panel. If you believe this is a mistake,
        contact your admin.
      </p>
      <Link
        href="/cafe-admin/login"
        className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Back to Café Login
      </Link>
    </div>
  );
}
