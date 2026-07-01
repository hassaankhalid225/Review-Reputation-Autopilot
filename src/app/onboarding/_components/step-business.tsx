"use client";

import { Field } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { BUSINESS_CATEGORIES } from "@/core/config/constants";

export interface BusinessDraft {
  name: string;
  category: string;
  city: string;
}

export function StepBusiness({ value, onChange }: { value: BusinessDraft; onChange: (v: BusinessDraft) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Tell us about your business</h2>
        <p className="text-sm text-text-secondary">This personalizes your AI replies and review requests.</p>
      </div>

      <Field label="Business name" required>
        <Input
          placeholder="e.g. Spice Route Restaurant"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          autoFocus
        />
      </Field>

      <Field label="Category" required>
        <Select value={value.category} onValueChange={(category) => onChange({ ...value, category })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="City" hint="Helps with local context.">
        <Input
          placeholder="e.g. Lahore"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
        />
      </Field>
    </div>
  );
}
