import { Button, Field, Input, Select } from "../ui/index.jsx";

/**
 * Shared filter strip for the history screens.
 *
 * The base select only offers the bases the signed-in user may filter by, which
 * the dashboard endpoint already scopes. Hiding the others avoids a filter that
 * silently returns nothing.
 */

// Only these are real filters. The screen state also carries pagination, the
// option lists for the selects and any extra status dropdown, and rendering
// those as summary chips would leak implementation detail into the UI.
const CHIP_KEYS = ["baseId", "equipmentTypeId", "dateFrom", "dateTo", "status", "reason", "role", "search"];

const CHIP_LABELS = {
  baseId: "Base",
  equipmentTypeId: "Equipment",
  dateFrom: "From",
  dateTo: "To",
  status: "Status",
  reason: "Reason",
  role: "Role",
  search: "Search",
};

export function FilterBar({ filters, onChange, onReset, children, busy, baseOptions, equipmentOptions }) {
  // A filter chip should name what was selected. Base and equipment filters hold
  // ids, so they are resolved back to their label rather than showing a number.
  const chipValue = (key, value) => {
    if (key === "baseId") return baseOptions?.find((b) => String(b.id) === String(value))?.name ?? value;
    if (key === "equipmentTypeId") return equipmentOptions?.find((e) => String(e.id) === String(value))?.name ?? value;
    return String(value);
  };

  const update = (key) => (event) => {
    const value = event.target.value;
    onChange({ ...filters, [key]: value === "" ? "" : value });
  };

  const activeChips = CHIP_KEYS.filter((key) => {
    const value = filters[key];
    return value !== "" && value !== undefined && value !== null;
  });

  const { baseId, equipmentTypeId, dateFrom, dateTo } = filters;

  return (
    <div className="filter-bar">
      {children}

      {baseOptions?.length ? (
        <Field label="Base" id="filter-base">
          <Select id="filter-base" value={baseId || ""} onChange={update("baseId")}>
            <option value="">All accessible bases</option>
            {baseOptions.map((base) => (
              <option key={base.id} value={base.id}>
                {base.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {equipmentOptions?.length ? (
        <Field label="Equipment type" id="filter-equipment">
          <Select
            id="filter-equipment"
            value={equipmentTypeId || ""}
            onChange={update("equipmentTypeId")}
          >
            <option value="">All equipment</option>
            {equipmentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="From" id="filter-from">
        <Input id="filter-from" type="date" value={dateFrom || ""} onChange={update("dateFrom")} />
      </Field>

      <Field label="To" id="filter-to">
        <Input id="filter-to" type="date" value={dateTo || ""} onChange={update("dateTo")} />
      </Field>

      <div className="filter-actions">
        <Button variant="secondary" onClick={onReset} disabled={busy}>
          Reset
        </Button>
      </div>

      {activeChips.length > 0 ? (
        <div className="chip-row" style={{ width: "100%" }}>
          {activeChips.map((key) => (
            <span className="chip" key={key}>
              {CHIP_LABELS[key] || key}: {chipValue(key, filters[key])}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
