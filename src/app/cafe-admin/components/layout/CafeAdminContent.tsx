
import * as React from "react";

export function CafeAdminContent({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto w-full max-w-7xl space-y-4">{children}</div>
        </main>
    );
}
