/**
 * MembershipPackage — defines a membership tier sellers can purchase.
 *
 * Each package has:
 *   - A price (0 = free)
 *   - A type: one-time, monthly, or yearly
 *   - A product upload limit
 *   - An optional linked product ID (the product to buy for activation)
 */

import mongoose, { Schema, type Document } from "mongoose";
import connectDB from "@/lib/mongodb";

export interface IMembershipPackage extends Document {
    name:        string;
    slug:        string;
    price:       number;
    type:        "one-time" | "monthly" | "yearly";
    productLimit: number;
    productId:   string;   // Post._id of the product to purchase ("" for free)
    icon:        string;   // Iconify icon name
    description: string;
    isActive:    boolean;
    position:    number;
    createdAt:   Date;
    updatedAt:   Date;
}

const MembershipPackageSchema = new Schema<IMembershipPackage>(
    {
        name:         { type: String, required: true },
        slug:         { type: String, required: true, unique: true },
        price:        { type: Number, default: 0 },
        type:         { type: String, enum: ["one-time", "monthly", "yearly"], default: "monthly" },
        productLimit: { type: Number, default: 10 },
        productId:    { type: String, default: "" },
        icon:         { type: String, default: "solar:crown-bold" },
        description:  { type: String, default: "" },
        isActive:     { type: Boolean, default: true },
        position:     { type: Number, default: 0 },
    },
    { timestamps: true, collection: "membership_packages" }
);

function getModel() {
    return (mongoose.models.MembershipPackage as mongoose.Model<IMembershipPackage>) ||
        mongoose.model<IMembershipPackage>("MembershipPackage", MembershipPackageSchema);
}

export async function getAllPackages(): Promise<any[]> {
    await connectDB();
    const docs = await getModel().find({}).sort({ position: 1, createdAt: -1 }).lean() as any[];
    return docs.map((d) => ({
        _id:          String(d._id),
        name:         String(d.name ?? ""),
        slug:         String(d.slug ?? ""),
        price:        d.price ?? 0,
        type:         String(d.type ?? "monthly"),
        productLimit: d.productLimit ?? 10,
        productId:    String(d.productId ?? ""),
        icon:         String(d.icon ?? "solar:crown-bold"),
        description:  String(d.description ?? ""),
        isActive:     d.isActive !== false,
        position:     d.position ?? 0,
    }));
}

export async function getActivePackages(): Promise<any[]> {
    const all = await getAllPackages();
    return all.filter((p) => p.isActive);
}

export async function getPackageById(id: string): Promise<any | null> {
    await connectDB();
    const d = await getModel().findById(id).lean() as any;
    if (!d) return null;
    return {
        _id:          String(d._id),
        name:         String(d.name ?? ""),
        slug:         String(d.slug ?? ""),
        price:        d.price ?? 0,
        type:         String(d.type ?? "monthly"),
        productLimit: d.productLimit ?? 10,
        productId:    String(d.productId ?? ""),
        icon:         String(d.icon ?? "solar:crown-bold"),
        description:  String(d.description ?? ""),
        isActive:     d.isActive !== false,
        position:     d.position ?? 0,
    };
}

export async function createPackage(data: Partial<IMembershipPackage>) {
    await connectDB();
    const doc = await getModel().create(data);
    return { _id: String((doc as any)._id) };
}

export async function updatePackage(id: string, data: Partial<IMembershipPackage>) {
    await connectDB();
    await getModel().findByIdAndUpdate(id, { $set: data }, { new: true });
}

export async function deletePackage(id: string) {
    await connectDB();
    await getModel().findByIdAndDelete(id);
}

export default getModel;
