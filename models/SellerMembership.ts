/**
 * SellerMembership — tracks which membership a seller has purchased.
 *
 * One active membership per seller. When a membership product order is
 * delivered, a record is created/updated here. The membership expires
 * after (quantity × type duration):
 *   - one-time: never expires
 *   - monthly: quantity months
 *   - yearly: quantity years
 */

import mongoose, { Schema, type Document } from "mongoose";
import connectDB from "@/lib/mongodb";

export interface ISellerMembership extends Document {
    userId:        string;  // Seller User._id
    packageId:     string;  // MembershipPackage._id
    orderNumber:   string;  // The order that activated this
    quantity:      number;  // Ordered quantity → determines duration
    status:        "active" | "expired" | "cancelled";
    activatedAt:   Date;
    expiresAt:     Date | null;  // null = never (one-time)
    productCount:  number;  // Products uploaded under this membership
    createdAt:     Date;
    updatedAt:     Date;
}

const SellerMembershipSchema = new Schema<ISellerMembership>(
    {
        userId:       { type: String, required: true, index: true },
        packageId:    { type: String, required: true },
        orderNumber:  { type: String, default: "" },
        quantity:     { type: Number, default: 1 },
        status:       { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
        activatedAt:  { type: Date, default: Date.now },
        expiresAt:    { type: Date, default: null },
        productCount: { type: Number, default: 0 },
    },
    { timestamps: true, collection: "seller_memberships" }
);

function getModel() {
    return (mongoose.models.SellerMembership as mongoose.Model<ISellerMembership>) ||
        mongoose.model<ISellerMembership>("SellerMembership", SellerMembershipSchema);
}

/** Get the current (active or latest) membership for a seller */
export async function getMembershipForUser(userId: string): Promise<any | null> {
    await connectDB();
    const doc = await getModel().findOne({ userId }).sort({ createdAt: -1 }).lean() as any;
    if (!doc) return null;

    // Auto-expire if past expiry
    if (doc.status === "active" && doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
        await getModel().updateOne({ _id: doc._id }, { $set: { status: "expired" } });
        doc.status = "expired";
    }

    return {
        _id:          String(doc._id),
        userId:       String(doc.userId ?? ""),
        packageId:    String(doc.packageId ?? ""),
        orderNumber:  String(doc.orderNumber ?? ""),
        quantity:     doc.quantity ?? 1,
        status:       String(doc.status ?? "expired"),
        activatedAt:  doc.activatedAt instanceof Date ? doc.activatedAt.toISOString() : String(doc.activatedAt ?? ""),
        expiresAt:    doc.expiresAt instanceof Date ? doc.expiresAt.toISOString() : null,
        productCount: doc.productCount ?? 0,
    };
}

/** Get all memberships for admin view */
export async function getAllMemberships(): Promise<any[]> {
    await connectDB();
    const docs = await getModel().find({}).sort({ createdAt: -1 }).lean() as any[];
    return docs.map((d) => ({
        _id:          String(d._id),
        userId:       String(d.userId ?? ""),
        packageId:    String(d.packageId ?? ""),
        orderNumber:  String(d.orderNumber ?? ""),
        quantity:     d.quantity ?? 1,
        status:       String(d.status ?? ""),
        activatedAt:  d.activatedAt instanceof Date ? d.activatedAt.toISOString() : String(d.activatedAt ?? ""),
        expiresAt:    d.expiresAt instanceof Date ? d.expiresAt.toISOString() : null,
        productCount: d.productCount ?? 0,
    }));
}

/** Activate or renew a membership for a seller */
export async function activateMembership(
    userId: string,
    packageId: string,
    orderNumber: string,
    quantity: number,
    type: "one-time" | "monthly" | "yearly"
) {
    await connectDB();
    const now = new Date();
    let expiresAt: Date | null = null;

    if (type === "monthly") {
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + quantity);
    } else if (type === "yearly") {
        expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + quantity);
    }
    // one-time: expiresAt stays null

    const existing = await getModel().findOne({ userId, status: "active" }).lean() as any;

    if (existing) {
        // Extend from current expiry (or now if no expiry)
        const base = existing.expiresAt ? new Date(existing.expiresAt) : now;
        if (type !== "one-time" && expiresAt) {
            // Extend from existing expiry
            const extended = new Date(base);
            if (type === "monthly") extended.setMonth(extended.getMonth() + quantity);
            else if (type === "yearly") extended.setFullYear(extended.getFullYear() + quantity);
            expiresAt = extended;
        }

        await getModel().updateOne(
            { _id: existing._id },
            { $set: { status: "active", expiresAt, orderNumber, packageId, quantity } }
        );
    } else {
        await getModel().create({
            userId,
            packageId,
            orderNumber,
            quantity,
            status: "active",
            activatedAt: now,
            expiresAt,
            productCount: 0,
        });
    }
}

/** Increment product count */
export async function incrementProductCount(userId: string) {
    await connectDB();
    await getModel().updateOne(
        { userId, status: "active" },
        { $inc: { productCount: 1 } }
    );
}

/** Decrement product count */
export async function decrementProductCount(userId: string) {
    await connectDB();
    await getModel().updateOne(
        { userId, status: "active" },
        { $inc: { productCount: -1 } }
    );
}

/** Check if seller can upload more products */
export async function canUpload(userId: string, productLimit: number): Promise<boolean> {
    const membership = await getMembershipForUser(userId);
    if (!membership || membership.status !== "active") return false;
    return membership.productCount < productLimit;
}

export default getModel;
