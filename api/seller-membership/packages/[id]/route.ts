/**
 * PUT    /api/seller-membership/packages/:id  → update package (admin)
 * DELETE /api/seller-membership/packages/:id  → delete package (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveUser } from "@/lib/session";
import { updatePackage, deletePackage } from "../../../../models/MembershipPackage";

export const dynamic = "force-dynamic";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    try {
        const caller = await resolveUser(req);
        if (!caller || caller.userType !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, price, type, productLimit, productId, icon, description, isActive, position } = body;

        const updateData: Record<string, any> = {};
        if (name !== undefined) {
            updateData.name = name;
            updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        }
        if (price !== undefined)       updateData.price = Number(price);
        if (type !== undefined)        updateData.type = type;
        if (productLimit !== undefined) updateData.productLimit = Number(productLimit);
        if (productId !== undefined)   updateData.productId = productId;
        if (icon !== undefined)        updateData.icon = icon;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined)    updateData.isActive = isActive;
        if (position !== undefined)    updateData.position = Number(position);

        await updatePackage(id, updateData);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Seller membership package PUT error:", error);
        return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    try {
        const caller = await resolveUser(req);
        if (!caller || caller.userType !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        await deletePackage(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Seller membership DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
    }
}
