"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  ArrowLeft,
  Phone,
  User,
  MapPin,
  Banknote,
  CreditCard,
  CircleSlash,
  MessageSquare,
} from "lucide-react";
import type { BasketItem } from "@/hooks/use-epos-store";
import type {
  Order,
  OrderType,
  CustomerDetails,
  PaymentStatus,
  PaymentMethod,
} from "@/lib/menu-data";
import { cn } from "@/lib/utils";
import type { DeliveryCharge } from "@/components/epos/settings-panel";


interface AddressResult {
  id: string;
  line1: string;
  line2?: string | null;
  line3?: string | null;
  city?: string | null;
  postcode?: string | null;
  label: string;
}
function calcLineTotal(entry: BasketItem): number {
  const base = entry.item.price + (entry.selectedVariation?.priceModifier ?? 0);
  const addOnsTotal = entry.addOns.reduce(
    (sum, a) => sum + a.addOn.price * a.quantity,
    0,
  );
  const customAddOnsTotal = entry.customAddOns.reduce(
    (sum, c) => sum + c.price,
    0,
  );
  return (base + addOnsTotal + customAddOnsTotal) * entry.quantity;
}

type CheckoutPageProps = {
  basket: BasketItem[];
  basketTotal: number;
  orders: Order[];
  deliveryCharges: DeliveryCharge[];
  onPlaceOrder: (
    orderType: OrderType,
    customer: CustomerDetails,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod,
    orderComment?: string,
    totalOverride?: number,
  ) => Promise<void> | void;
  onBack: () => void;
};

function normalizePhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : phone.trim().toLowerCase();
}

function normalizePostcode(value?: string): string {
  if (!value) return "";
  return value.replace(/\s+/g, "").toUpperCase();
}

function isCompleteUkPostcode(value?: string): boolean {
  const normalized = normalizePostcode(value);
  if (!normalized) return false;
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(normalized);
}

function debounce(fn: Function, delay: number) {
  let timeout: NodeJS.Timeout;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const orderTypes: {
  id: OrderType;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: "instore",
    label: "In-Store",
    icon: UtensilsCrossed,
    description: "Eating in the restaurant",
  },
  {
    id: "collection",
    label: "Collection",
    icon: ShoppingBag,
    description: "Customer picks up order",
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: Truck,
    description: "Deliver to customer address",
  },
];

export function CheckoutPage({
  basket,
  basketTotal,
  orders,
  deliveryCharges,
  onPlaceOrder,
  onBack,
}: CheckoutPageProps) {
  const [orderType, setOrderType] = useState<OrderType>("instore");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [orderComment, setOrderComment] = useState("");
  const [lastAutofilledPhone, setLastAutofilledPhone] = useState("");
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressLookupError, setAddressLookupError] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [lastLookupPostcode, setLastLookupPostcode] = useState("");

  const normalizedPostcode = normalizePostcode(postcode);
  const matchedDeliveryCharge = [...deliveryCharges]
    .sort((a, b) => b.postcodePrefix.length - a.postcodePrefix.length)
    .find((entry) =>
      normalizedPostcode.startsWith(normalizePostcode(entry.postcodePrefix)),
    );
  const deliveryCharge =
    orderType === "delivery" ? (matchedDeliveryCharge?.charge ?? 0) : 0;
  const finalTotal = basketTotal + deliveryCharge;

  const canSubmit = (() => {
    if (paymentStatus === "paid" && !paymentMethod) return false;
    if (orderType === "instore") return name.trim().length > 0;
    if (orderType === "collection")
      return name.trim().length > 0 && phone.trim().length > 0;
    if (orderType === "delivery")
      return (
        phone.trim().length > 0 &&
        addressLine1.trim().length > 0 &&
        city.trim().length > 0 &&
        postcode.trim().length > 0
      );
    return false;
  })();

  const lookupPostcode = useCallback(async (postcode: string) => {
    if (!isCompleteUkPostcode(postcode)) {
      setAddresses([]);
      setSelectedAddressId("");
      setAddressLookupError("");
      return;
    }

    const normalized = normalizePostcode(postcode);
    if (normalized === lastLookupPostcode && addresses.length > 0) return;

    try {
      setIsLoadingAddresses(true);
      setAddressLookupError("");
      setLastLookupPostcode(normalized);

      const res = await fetch(
        `/api/postcode-lookup?postcode=${encodeURIComponent(normalized)}`,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Address lookup failed");
      }

      const data = await res.json();
      const results: AddressResult[] = (data.addresses || []).map((a: any) => ({
        id: a.id,
        line1: a.line1 ?? "",
        line2: a.line2 ?? null,
        line3: a.line3 ?? null,
        city: a.city ?? null,
        postcode: a.postcode ?? normalized,
        label: a.label ?? a.line1 ?? "Address",
      }));

      setAddresses(results);
      setSelectedAddressId("");
      if (results.length === 0) {
        setAddressLookupError("No addresses found for that postcode.");
      }
    } catch (err) {
      console.error("Address lookup failed:", err);
      setAddresses([]);
      setSelectedAddressId("");
      setAddressLookupError("Address lookup failed. Please try again.");
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [addresses.length, lastLookupPostcode]);
  const debouncedLookup = useMemo(
    () => debounce((value: string) => lookupPostcode(value), 400),
    [lookupPostcode],
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const customer: CustomerDetails = {};
    if (orderType === "instore") {
      customer.name = name.trim();
    } else if (orderType === "collection") {
      customer.name = name.trim();
      customer.phone = phone.trim();
    } else {
      if (name.trim()) customer.name = name.trim();
      customer.phone = phone.trim();
      customer.addressLine1 = addressLine1.trim();
      if (addressLine2.trim()) customer.addressLine2 = addressLine2.trim();
      customer.city = city.trim();
      customer.postcode = postcode.trim();
    }
    await onPlaceOrder(
      orderType,
      customer,
      paymentStatus,
      paymentMethod,
      orderComment.trim() || undefined,
      finalTotal,
    );
  };

  const maybeAutofillFromPhone = (phoneValue: string) => {
    const normalized = normalizePhone(phoneValue);
    if (!normalized || normalized === lastAutofilledPhone) return;

    const matches = orders
      .filter((o) => normalizePhone(o.customer.phone) === normalized)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const latest = matches[0];
    if (!latest) return;

    if (latest.customer.name) setName(latest.customer.name);
    if (latest.customer.addressLine1)
      setAddressLine1(latest.customer.addressLine1);
    setAddressLine2(latest.customer.addressLine2 ?? "");
    setCity(latest.customer.city ?? "");
    setPostcode(latest.customer.postcode ?? "");
    setLastAutofilledPhone(normalized);
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-3 gap-4 p-4 lg:p-6">
      {/* Left 2/3 - Order Type & Customer Details */}
      <div className="col-span-2 flex min-h-0 flex-col gap-6 overflow-y-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </button>

        {/* Order Type Selection */}
        <div className="sticky top-0 z-20 bg-background pb-3">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Order Type
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {orderTypes.map((type) => {
              const Icon = type.icon;
              const isActive = orderType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setOrderType(type.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all",
                    isActive
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-muted-foreground/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p
                      className={cn(
                        "text-sm font-bold leading-tight",
                        isActive ? "text-primary" : "text-card-foreground",
                      )}
                    >
                      {type.label}
                    </p>
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Details Form */}
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Customer Details
          </h2>
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <User className="h-4 w-4 text-muted-foreground" />
                Name
                {orderType === "delivery" && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer name"
                className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {(orderType === "collection" || orderType === "delivery") && (
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPhone(value);
                    maybeAutofillFromPhone(value);
                  }}
                  placeholder="Phone number"
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {orderType === "delivery" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-card-foreground">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPostcode(value);
                      setSelectedAddressId("");
                      setAddressLookupError("");
                      debouncedLookup(value);
                    }}
                    placeholder="Postcode"
                    className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {isLoadingAddresses && (
                    <p className="text-xs text-muted-foreground">
                      Looking up addresses...
                    </p>
                  )}
                  {addressLookupError && (
                    <p className="text-xs text-destructive">
                      {addressLookupError}
                    </p>
                  )}
                  {addresses.length > 0 && (
                    <select
                      className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={selectedAddressId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setSelectedAddressId(selectedId);
                        const selected = addresses.find(
                          (a) => a.id === selectedId,
                        );
                        if (!selected) return;
                        setAddressLine1(selected.line1);
                        const line2 = [selected.line2, selected.line3]
                          .filter(Boolean)
                          .join(", ");
                        setAddressLine2(line2);
                        setCity(selected.city ?? "");
                        if (selected.postcode) setPostcode(selected.postcode);
                      }}
                    >
                      <option value="">Select address</option>
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {selectedAddressId && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="House number and street"
                        className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                        Address Line 2
                        <span className="text-xs font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Flat, apartment, unit, etc."
                        className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-card-foreground">
                        City / Town
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City or town"
                        className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Payment
          </h2>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPaymentStatus("unpaid");
                  setPaymentMethod(null);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all",
                  paymentStatus === "unpaid"
                    ? "border-destructive bg-destructive/10"
                    : "border-border bg-card hover:border-muted-foreground/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    paymentStatus === "unpaid"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  <CircleSlash className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-sm font-bold",
                    paymentStatus === "unpaid"
                      ? "text-destructive"
                      : "text-card-foreground",
                  )}
                >
                  Not Paid
                </span>
              </button>

              <button
                onClick={() => setPaymentStatus("paid")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all",
                  paymentStatus === "paid"
                    ? "border-[oklch(0.65_0.2_145)] bg-[oklch(0.65_0.2_145)]/10"
                    : "border-border bg-card hover:border-muted-foreground/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    paymentStatus === "paid"
                      ? "bg-[oklch(0.65_0.2_145)] text-[oklch(0.13_0_0)]"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Banknote className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-sm font-bold",
                    paymentStatus === "paid"
                      ? "text-[oklch(0.65_0.2_145)]"
                      : "text-card-foreground",
                  )}
                >
                  Paid
                </span>
              </button>
            </div>

            {paymentStatus === "paid" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all",
                    paymentMethod === "cash"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:border-muted-foreground/30",
                  )}
                >
                  <Banknote
                    className={cn(
                      "h-5 w-5",
                      paymentMethod === "cash"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-bold",
                      paymentMethod === "cash"
                        ? "text-primary"
                        : "text-card-foreground",
                    )}
                  >
                    Cash
                  </span>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all",
                    paymentMethod === "card"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:border-muted-foreground/30",
                  )}
                >
                  <CreditCard
                    className={cn(
                      "h-5 w-5",
                      paymentMethod === "card"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-bold",
                      paymentMethod === "card"
                        ? "text-primary"
                        : "text-card-foreground",
                    )}
                  >
                    Card
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Order Notes */}
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            <MessageSquare className="inline h-4 w-4 mr-1.5" />
            Order Notes
          </h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <textarea
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              placeholder={
                orderType === "delivery"
                  ? "Delivery instructions, e.g. Leave at door, ring doorbell..."
                  : "Any special instructions for this order..."
              }
              rows={3}
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Confirm button */}
        <div className="sticky bottom-0 z-20 bg-background pt-3">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl bg-primary py-4 text-base font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {"Confirm & Place Order - £"}
            {finalTotal.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Right 1/3 - Order Summary */}
      <div className="col-span-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="shrink-0 flex items-center gap-2 border-b border-border px-4 py-3">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
              Order Summary
            </h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <div className="flex flex-col gap-2">
              {basket.map((entry) => {
                const unitPrice =
                  entry.item.price +
                  (entry.selectedVariation?.priceModifier ?? 0);
                const lineTotal = calcLineTotal(entry);
                return (
                  <div
                    key={entry.id}
                    className="rounded-lg bg-secondary/50 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {entry.quantity}x {entry.item.name}
                          {entry.selectedVariation && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({entry.selectedVariation.name})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {"£"}
                          {unitPrice.toFixed(2)} each
                        </p>
                      </div>
                      <span className="ml-2 text-sm font-bold text-primary">
                        {"£"}
                        {lineTotal.toFixed(2)}
                      </span>
                    </div>
                    {/* Add-ons, custom add-ons, and comment */}
                    {(entry.addOns.length > 0 ||
                      entry.customAddOns.length > 0 ||
                      entry.comment) && (
                      <div className="mt-1.5 flex flex-col gap-0.5">
                        {entry.addOns.map((a) => (
                          <p
                            key={a.addOn.id}
                            className="text-[11px] text-primary"
                          >
                            + {a.addOn.name} ({"£"}
                            {a.addOn.price.toFixed(2)})
                          </p>
                        ))}
                        {entry.customAddOns.map((ca, i) => (
                          <p key={i} className="text-[11px] text-primary">
                            + {ca.name}
                            {ca.price > 0 && (
                              <>
                                {" "}
                                ({"£"}
                                {ca.price.toFixed(2)})
                              </>
                            )}
                          </p>
                        ))}
                        {entry.comment && (
                          <p className="text-[11px] text-muted-foreground italic">
                            {'"'}
                            {entry.comment}
                            {'"'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto shrink-0 border-t border-border bg-card px-4 py-4">
            {orderType === "delivery" && (
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  Delivery Charge
                </span>
                <span className="font-semibold text-card-foreground">
                  {"£"}
                  {deliveryCharge.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </span>
              <span className="text-2xl font-bold text-card-foreground">
                {"£"}
                {finalTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
