"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, User, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";
import { useCafeUser } from "@/hooks/useCafeUser";

export default function SettingsPage() {
    const { user, loading } = useCafeUser(["cafe_admin"]);

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Profile fields
    const [profileName, setProfileName] = useState("");
    const [profileUsername, setProfileUsername] = useState("");
    const [profileEmail, setProfileEmail] = useState("");

    // Password fields
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
        queryKey: ["cafe-users", user?.cafe_id],
        enabled: !!user?.cafe_id,
        queryFn: async () => {
            const res = await api.get(`/admin/cafe/${user!.cafe_id}/users`);
            return res.data?.data ?? [];
        },
    });

    // ── UPDATE PROFILE DETAILS ──
    const updateProfile = useMutation({
        mutationFn: async ({
            userId,
            user_name,
            login_user_name,
            user_email,
        }: {
            userId: string;
            user_name: string;
            login_user_name: string;
            user_email: string;
        }) => {
            return api.patch(`/cafes/users/${userId}`, {
                user_name: user_name || undefined,
                login_user_name: login_user_name || undefined,
                user_email: user_email || undefined,
            });
        },
        onSuccess: (_, vars) => {
            const name = users.find((u: any) => u.user_id === vars.userId)?.user_name ?? "User";
            toast.success(`Profile updated for ${name}`);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to update profile");
        },
    });

    // ── UPDATE PASSWORD ──
    const updatePassword = useMutation({
        mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
            return api.patch(`/cafes/users/${userId}/password`, { new_password: password });
        },
        onSuccess: (_, { userId }) => {
            const name = users.find((u: any) => u.user_id === userId)?.user_name ?? "User";
            toast.success(`Password updated for ${name}`);
            setNewPassword("");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to update password");
        },
    });

    const handleSelectUser = (u: any) => {
        const already = selectedUserId === u.user_id;
        setSelectedUserId(already ? null : u.user_id);
        setNewPassword("");
        if (!already) {
            setProfileName(u.user_name ?? "");
            setProfileUsername(u.login_user_name ?? "");
            setProfileEmail(u.user_email ?? "");
        }
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) return;
        if (profileName && profileName.length < 4) {
            toast.error("Name must be at least 4 characters");
            return;
        }
        if (profileUsername && profileUsername.length < 4) {
            toast.error("Username must be at least 4 characters");
            return;
        }
        updateProfile.mutate({
            userId: selectedUserId,
            user_name: profileName,
            login_user_name: profileUsername,
            user_email: profileEmail,
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !newPassword) return;
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        updatePassword.mutate({ userId: selectedUserId, password: newPassword });
    };

    if (loading || usersLoading) return <p className="text-center mt-10">Loading...</p>;
    if (!user) return null;

    const selectedUser = users.find((u: any) => u.user_id === selectedUserId);

    return (
        <div className="max-w-2xl mx-auto p-6 md:p-10 space-y-8">
            <div>
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage café user accounts — only accessible by admins
                </p>
            </div>

            <Separator />

            {/* ── USER LIST ── */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Select a user</Label>
                <div className="space-y-2">
                    {users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No users found for this café.</p>
                    ) : (
                        users.map((u: any) => {
                            const isSelected = selectedUserId === u.user_id;
                            return (
                                <button
                                    key={u.user_id}
                                    type="button"
                                    onClick={() => handleSelectUser(u)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                                        isSelected
                                            ? "border-black bg-muted"
                                            : "border-border hover:bg-muted/50"
                                    }`}
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>
                                            {u.user_name?.[0]?.toUpperCase() ?? "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{u.user_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            @{u.login_user_name ?? "—"} ·{" "}
                                            <span className="capitalize">{u.user_role?.replace("_", " ")}</span>
                                        </p>
                                    </div>
                                    {isSelected && <User className="w-4 h-4 text-muted-foreground" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {selectedUser && (
                <>
                    {/* ── UPDATE PROFILE DETAILS ── */}
                    <Separator />
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                Update profile for{" "}
                                <span className="font-semibold">{selectedUser.user_name}</span>
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="profile_name">Name</Label>
                            <Input
                                id="profile_name"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="Display name (min. 4 chars)"
                                autoComplete="off"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="login_username">Login Username</Label>
                            <Input
                                id="login_username"
                                value={profileUsername}
                                onChange={(e) => setProfileUsername(e.target.value)}
                                placeholder="Login username (min. 4 chars)"
                                autoComplete="off"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="profile_email">Email</Label>
                            <Input
                                id="profile_email"
                                type="email"
                                value={profileEmail}
                                onChange={(e) => setProfileEmail(e.target.value)}
                                placeholder="user@example.com"
                                autoComplete="off"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="w-full"
                        >
                            {updateProfile.isPending ? "Saving..." : "Save Profile Changes"}
                        </Button>
                    </form>

                    {/* ── UPDATE PASSWORD ── */}
                    <Separator />
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <KeyRound className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                Update password for{" "}
                                <span className="font-semibold">{selectedUser.user_name}</span>
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="new_password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={!newPassword || updatePassword.isPending}
                            className="w-full"
                        >
                            {updatePassword.isPending ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}
