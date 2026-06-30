/**
 * GET /api/seller-membership/members
 * Admin-only — returns all seller memberships with user + package info.
 */

import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/session";
import { getAllMemberships } from "../../../models/SellerMembership";
import { getAllPackages } from "../../../models/MembershipPackage";
import connectDB from "@/lib/mongodb";
import User from "@/models/Users";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
    try {
        const caller = await resolveUser();
        if (!caller || caller.userType !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const [memberships, packages] = await Promise.all([
            getAllMemberships(),
            getAllPackages(),
        ]);

        // Fetch user names
        const userIds = [...new Set(memberships.map((m) => m.userId))];
        await connectDB();
        const users = userIds.length > 0
            ? await User.find({ _id: { $in: userIds } }).lean() as any[]
            : [];
        const userMap = new Map(users.map((u: any) => [String(u._id), {
            name: String(u.name ?? ""),
            email: String(u.email ?? ""),
            image: String(u.image ?? ""),
        }]));

        const pkgMap = new Map(packages.map((p) => [p._id, p]));

        const enriched = memberships.map((m) => ({
            ...m,
            userName: userMap.get(m.userId)?.name ?? "",
            userEmail: userMap.get(m.userId)?.email ?? "",
            userImage: userMap.get(m.userId)?.image ?? "",
            packageName: pkgMap.get(m.packageId)?.name ?? "",
            packageType: pkgMap.get(m.packageId)?.type ?? "",
        }));

        return NextResponse.json({ members: enriched });
    } catch (error) {
        console.error("Seller membership members GET error:", error);
        return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }
}
