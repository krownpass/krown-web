"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatIST } from "@/lib/fornateDate";

export function RedeemTable({ data }: { data: any[] }) {
    if (!data?.length)
        return (
            <p className="text-center text-gray-500 py-10">
                No redeems found for this cafe.
            </p>
        );

    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <Table className="min-w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-gray-600 font-semibold">Initiater Role</TableHead>
                        <TableHead className="text-gray-600 font-semibold">User</TableHead>
                        <TableHead className="text-gray-600 font-semibold">Mobile</TableHead>
                        <TableHead className="text-gray-600 font-semibold">Item</TableHead>
                        <TableHead className="text-gray-600 font-semibold">Status</TableHead>
                        <TableHead className="text-gray-600 font-semibold">Intiated Date</TableHead>

                        <TableHead className="text-gray-600 ont-semibold">Confirmed Date</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.map((r) => (
                        <TableRow key={r.redeem_id} className="hover:bg-gray-50 transition">
                            <TableCell className="font-medium text-black">{r.initiater_role}</TableCell>
                            <TableCell className="text-gray-800">{r.user_name}</TableCell>
                            <TableCell className="text-gray-700">{r.user_mobile_no}</TableCell>
                            <TableCell className="text-gray-700">{r.item_name}</TableCell>
                            <TableCell>
                                {r.is_redeemed ? (
                                    <Badge className="bg-green-100 text-green-700 border border-green-200">
                                        Confirmed
                                    </Badge>
                                ) : (
                                    <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">
                                        Initiated
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">

                                {formatIST(r.created_at)}
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">
                                {r.is_redeemed ? formatIST(r.updated_at) : "--"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
