"use client";

import { useState, useTransition } from "react";
import { MONTHS } from "@/lib/format.ts";
import { KINDS } from "@/lib/kinds.ts";
import type { Role, Status } from "@/lib/validators.ts";
import type { FormState } from "../../actions.ts";
import { Field, input, primary, secondary } from "../../ui.tsx";
import { type EditableImage, ImagesEditor } from "./ImagesEditor.tsx";

export type PlaceFormValues = {
  name: string;
  slug: string;
  state: string;
  city: string;
  kind: string;
  categories: string[];
  shortDescription: string;
  description: string;
  history: string;
  bestMonths: number[];
  bestTimeNote: string;
  fee: { indian?: number; foreigner?: number; child?: number; note: string };
  timings: { hours: string; closedOn: string };
  lat?: number;
  lng?: number;
  address: string;
  highlights: string;
  images: EditableImage[];
  isFeatured: boolean;
  isHiddenGem: boolean;
  sources: string;
};

type Option = { slug: string; name: string };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-sm border border-border bg-background p-5">
      <legend className="px-1 text-lg font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

export function PlaceForm({
  initial,
  states,
  cities,
  categories,
  role,
  status,
  uploads,
  action,
}: {
  initial: PlaceFormValues;
  states: Option[];
  cities: (Option & { state: string })[];
  categories: Option[];
  role: Role;
  status: Status | null; // null for a new place
  uploads: boolean;
  action: (prev: FormState, form: FormData) => Promise<FormState>;
}) {
  const [result, setResult] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(initial.state);
  const [shortDescription, setShortDescription] = useState(initial.shortDescription);
  const [coords, setCoords] = useState({ lat: initial.lat, lng: initial.lng });
  const locked = role === "editor" && status === "published";
  const d = 0.02;
  const hasCoords =
    coords.lat !== undefined && coords.lng !== undefined && !Number.isNaN(coords.lat) && !Number.isNaN(coords.lng);

  return (
    <form
      // Submitted through a transition rather than the `action` prop, so a validation error doesn't reset the fields.
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(async () => {
          const res = await action(null, form);
          setResult(res);
          if (res) window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }}
      className="flex flex-col gap-6"
    >
      {result?.error && (
        <div
          role="alert"
          className="rounded border border-red-700/30 bg-red-700/10 px-4 py-3 text-sm text-red-800"
        >
          <p className="font-medium">{result.error}</p>
          {result.issues && (
            <ul className="mt-2 list-disc pl-5">
              {result.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <fieldset disabled={locked || pending} className="flex flex-col gap-6">
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="place-name" label="Name">
              <input
                id="place-name"
                name="name"
                defaultValue={initial.name}
                required
                maxLength={120}
                className={input}
              />
            </Field>
            <Field
              id="place-slug"
              label="Web address"
              help={
                <>
                  /places/<em>this-part</em>. Lowercase letters, numbers and hyphens.
                </>
              }
            >
              <input
                id="place-slug"
                name="slug"
                defaultValue={initial.slug}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="Made from the name if left blank"
                aria-describedby="place-slug-help"
                className={input}
              />
            </Field>
            <Field id="place-state" label="State">
              <select
                id="place-state"
                name="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className={input}
              >
                <option value="">Choose a state</option>
                {states.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="place-city" label="City" help={<>Missing a city? Add it under Cities.</>}>
              <select
                id="place-city"
                aria-describedby="place-city-help"
                key={state}
                name="city"
                defaultValue={state === initial.state ? initial.city : ""}
                required
                className={input}
              >
                <option value="">{state ? "Choose a city" : "Choose a state first"}</option>
                {cities
                  .filter((c) => c.state === state)
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <Field id="place-kind" label="Type of place" help={<>Used to browse, e.g. Forts in Maharashtra.</>}>
            <select id="place-kind" name="kind" defaultValue={initial.kind} required aria-describedby="place-kind-help" className={input}>
              <option value="">Choose a type</option>
              {Object.entries(KINDS).map(([slug, k]) => (
                <option key={slug} value={slug}>
                  {k.one}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium">Categories</p>
            <div className="flex flex-wrap gap-4">
              {categories.map((c) => (
                <label key={c.slug} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="categories"
                    value={c.slug}
                    defaultChecked={initial.categories.includes(c.slug)}
                    className="size-4 accent-brand"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={initial.isFeatured}
                className="size-4 accent-brand"
              />
              Featured on the home page
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isHiddenGem"
                defaultChecked={initial.isHiddenGem}
                className="size-4 accent-brand"
              />
              Hidden gem
            </label>
          </div>
        </Section>

        <Section title="Content">
          <Field
            id="place-shortDescription"
            label="Short description"
            help={<>{shortDescription.length}/160. Shown on cards and in search results.</>}
          >
            <textarea
              id="place-shortDescription"
              aria-describedby="place-shortDescription-help"
              name="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              required
              maxLength={160}
              rows={2}
              className={input}
            />
          </Field>
          <Field id="place-description" label="Description" help={<>Leave a blank line between paragraphs.</>}>
            <textarea
              id="place-description"
              aria-describedby="place-description-help"
              name="description"
              defaultValue={initial.description}
              required
              maxLength={5000}
              rows={8}
              className={input}
            />
          </Field>
          <Field id="place-history" label="History">
            <textarea
              id="place-history"
              name="history"
              defaultValue={initial.history}
              maxLength={5000}
              rows={5}
              className={input}
            />
          </Field>
          <Field id="place-highlights" label="Highlights">
            <textarea
              id="place-highlights"
              name="highlights"
              defaultValue={initial.highlights}
              rows={4}
              placeholder="One per line, up to 10"
              className={input}
            />
          </Field>
        </Section>

        <Section title="Visit info">
          <div>
            <p className="mb-2 text-sm font-medium">Best months to visit</p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
              {MONTHS.map((m, i) => (
                <label key={m} className="flex flex-col items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    name="bestMonths"
                    value={i + 1}
                    defaultChecked={initial.bestMonths.includes(i + 1)}
                    className="size-4 accent-brand"
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <Field id="place-bestTimeNote" label="Best time note">
            <input
              id="place-bestTimeNote"
              name="bestTimeNote"
              defaultValue={initial.bestTimeNote}
              maxLength={200}
              placeholder="e.g. Oct–Mar; avoid the summer heat"
              className={input}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="place-timings-hours" label="Opening hours">
              <input
                id="place-timings-hours"
                name="timings.hours"
                defaultValue={initial.timings.hours}
                maxLength={120}
                placeholder="e.g. 6 am – 6 pm"
                className={input}
              />
            </Field>
            <Field id="place-timings-closedOn" label="Closed on">
              <input
                id="place-timings-closedOn"
                name="timings.closedOn"
                defaultValue={initial.timings.closedOn}
                maxLength={60}
                placeholder="e.g. Fridays"
                className={input}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["indian", "foreigner", "child"] as const).map((k) => (
              <Field
                key={k}
                id={`place-fee-${k}`}
                label={`Fee: ${k === "indian" ? "Indian visitors" : k === "foreigner" ? "foreign visitors" : "children"} (₹)`}
              >
                <input
                  id={`place-fee-${k}`}
                  type="number"
                  min={0}
                  step={1}
                  name={`fee.${k}`}
                  defaultValue={initial.fee[k]}
                  className={input}
                />
              </Field>
            ))}
          </div>
          <Field id="place-fee-note" label="Fee note">
            <input
              id="place-fee-note"
              name="fee.note"
              defaultValue={initial.fee.note}
              maxLength={200}
              placeholder="e.g. Free on Fridays; camera ₹25"
              className={input}
            />
          </Field>
        </Section>

        <Section title="Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="place-lat" label="Latitude">
              <input
                id="place-lat"
                type="number"
                name="lat"
                step="any"
                min={6}
                max={37.5}
                required
                defaultValue={initial.lat}
                onBlur={(e) => setCoords((c) => ({ ...c, lat: e.target.valueAsNumber }))}
                className={input}
              />
            </Field>
            <Field id="place-lng" label="Longitude">
              <input
                id="place-lng"
                type="number"
                name="lng"
                step="any"
                min={68}
                max={97.5}
                required
                defaultValue={initial.lng}
                onBlur={(e) => setCoords((c) => ({ ...c, lng: e.target.valueAsNumber }))}
                className={input}
              />
            </Field>
          </div>
          <Field id="place-address" label="Address">
            <input
              id="place-address"
              name="address"
              defaultValue={initial.address}
              required
              maxLength={300}
              className={input}
            />
          </Field>
          {hasCoords ? (
            <iframe
              title="Map preview of the pin"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng! - d},${coords.lat! - d},${coords.lng! + d},${coords.lat! + d}&layer=mapnik&marker=${coords.lat},${coords.lng}`}
              className="aspect-[16/9] w-full rounded-sm border border-border"
            />
          ) : (
            <p className="text-sm text-muted">Enter coordinates to preview the pin.</p>
          )}
          <p className="text-xs text-muted">
            To find coordinates, right-click the spot on{" "}
            <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline">
              OpenStreetMap
            </a>{" "}
            and choose &ldquo;Show address&rdquo;.
          </p>
        </Section>

        <Section title="Photos">
          <ImagesEditor initial={initial.images} uploads={uploads} />
        </Section>

        <Section title="Sources">
          <Field
            id="place-sources"
            label="Where the facts come from"
            help={<>At least one source is needed before a place can be published.</>}
          >
            <textarea
              id="place-sources"
              aria-describedby="place-sources-help"
              name="sources"
              defaultValue={initial.sources}
              rows={4}
              placeholder="One per line: Title | https://…"
              className={`${input} font-mono`}
            />
          </Field>
        </Section>
      </fieldset>

      {locked ? (
        <p className="text-sm text-muted">This place is live. Ask an admin to unpublish it if it needs changes.</p>
      ) : (
        <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border bg-background py-4">
          {role === "admin" ? (
            <>
              {status !== "published" && (
                <button type="submit" name="intent" value="publish" disabled={pending} className={primary}>
                  Save and publish
                </button>
              )}
              <button
                type="submit"
                name="intent"
                value="save"
                disabled={pending}
                className={status === "published" ? primary : secondary}
              >
                {status === "published" ? "Save changes" : "Save"}
              </button>
            </>
          ) : (
            <>
              {status !== "review" && (
                <button type="submit" name="intent" value="review" disabled={pending} className={primary}>
                  Submit for review
                </button>
              )}
              <button type="submit" name="intent" value="save" disabled={pending} className={secondary}>
                {status === "review" ? "Save" : "Save draft"}
              </button>
            </>
          )}
          {pending && (
            <span role="status" className="self-center text-sm text-muted">
              Saving…
            </span>
          )}
        </div>
      )}
    </form>
  );
}
