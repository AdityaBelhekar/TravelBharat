import { Field, input } from "../../ui.tsx";

type City = { name: string; slug: string; overview?: string | null; history?: string | null; isHub?: boolean | null; lat?: number; lng?: number };

// Shared fields for adding and editing a city.
export function CityFields({ city }: { city?: City }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city-name" label="Name">
          <input id="city-name" name="name" defaultValue={city?.name} required maxLength={80} className={input} />
        </Field>
        <Field id="city-slug" label="Web address">
          <input
            id="city-slug"
            name="slug"
            defaultValue={city?.slug}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="Made from the name if left blank"
            className={input}
          />
        </Field>
        <Field id="city-lat" label="Latitude">
          <input
            id="city-lat"
            name="lat"
            type="number"
            step="any"
            min={6}
            max={37.5}
            defaultValue={city?.lat}
            required
            className={input}
          />
        </Field>
        <Field id="city-lng" label="Longitude">
          <input
            id="city-lng"
            name="lng"
            type="number"
            step="any"
            min={68}
            max={97.5}
            defaultValue={city?.lng}
            required
            className={input}
          />
        </Field>
      </div>
      <Field id="city-overview" label="Overview">
        <textarea
          id="city-overview"
          name="overview"
          defaultValue={city?.overview ?? ""}
          required
          maxLength={1500}
          rows={4}
          className={input}
        />
      </Field>
      <Field id="city-history" label="History" help={<>Optional. Shown on the city page.</>}>
        <textarea
          id="city-history"
          name="history"
          defaultValue={city?.history ?? ""}
          maxLength={3000}
          rows={5}
          aria-describedby="city-history-help"
          className={input}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isHub" defaultChecked={Boolean(city?.isHub)} className="size-4 accent-brand" />
        Big city: list weekend getaways from here on its page
      </label>
    </>
  );
}
