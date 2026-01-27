"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { setToken } from "@/lib/auth";
import Image from "next/image";
import { IMAGES } from "../../../public/assets";

export default function CafeAdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        login_user_name: "",
        password_hash: "",
    });

    // ---------- Validation ----------
    const validateForm = () => {
        if (!form.login_user_name.trim()) {
            toast.error("Username is required");
            return false;
        }
        if (!form.password_hash.trim()) {
            toast.error("Password is required");
            return false;
        }
        return true;
    };

    // ---------- Submit Handler ----------
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            const res = await api.post("/cafes/login", form);
            const user = res.data?.data?.user;
            const accessToken = res.data?.data?.token;

            if (!user || !accessToken) {
                toast.error("Login failed", { description: "Invalid credentials" });
                return;
            }

            setToken(accessToken);
            toast.success("Login successful!");

            if (user.user_role === "cafe_admin") {
                router.push("/dashboard");
            } else if (user.user_role === "cafe_staff") {
                router.push("/dashboard/cafe/redeem");
            } else {
                toast.error("Unauthorized Role", {
                    description: "You do not have access to this panel.",
                });
            }
        } catch (err: any) {
            toast.error("Login failed", {
                description: err.response?.data?.message || "Invalid credentials",
            });
        } finally {
            setLoading(false);
        }
    };

    // ---------- UI ----------
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
            <Image src={IMAGES.krown} width={100} height={100} alt="krown" />

            <Card className="w-full max-w-sm mt-4 p-4">
                <CardContent className="space-y-5">
                    <AnimatePresence mode="wait">
                        <motion.form
                            key="password"
                            onSubmit={handlePasswordLogin}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-5"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="login_user_name">Username</Label>
                                <Input
                                    id="login_user_name"
                                    value={form.login_user_name}
                                    onChange={(e) =>
                                        setForm({ ...form, login_user_name: e.target.value })
                                    }
                                    placeholder="Enter username"
                                />
                            </div>

                            <div className="space-y-2 relative">
                                <Label htmlFor="password_hash">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password_hash"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password_hash}
                                        onChange={(e) =>
                                            setForm({ ...form, password_hash: e.target.value })
                                        }
                                        placeholder="Enter password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full font-semibold">
                                {loading ? "Logging in..." : "Login"}
                            </Button>
                        </motion.form>
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
}
