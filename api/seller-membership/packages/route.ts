/**
 * GET  /api/seller-membership/packages          → list all packages (admin)
 * POST /api/seller-membership/packages          → create package (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveUser } from "@/lib/session";
import { getAllPackages, createPackage } from "../../../models/MembershipPackage";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
    try {
        const packages = await getAllPackages();
        return NextResponse.json({ packages });
    } catch (error) {
        console.error("Seller membership packages GET error:", error);
        return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
    }
}

export async function POST(req: NextRequest): Promise<Response> {
    try {
        const caller = await resolveUser(req);
        if (!caller || caller.userType !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { name, price, type, productLimit, productId, icon, description, isActive, position } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        const result = await createPackage({
            name,
            slug,
            price: Number(price) || 0,
            type: type || "monthly",
            productLimit: Number(productLimit) || 10,
            productId: productId || "",
            icon: icon || "solar:crown-bold",
            description: description || "",
            isActive: isActive !== false,
            position: Number(position) || 0,
        });

        return NextResponse.json({ success: true, _id: result._id });
    } catch (error) {
        console.error("Seller membership packages POST error:", error);
        return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
    }
}
