import React from "react";
import {
  Box,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { Controller } from "react-hook-form";

const CATEGORY_COLORS: Record<string, string> = {
  "różne": "rgb(56 55 77)",
  "Złącza i komunikacja": "rgb(55 77 57)",
  "GPU": "rgb(77 67 55)",
  "Pamięć RAM": "rgb(77 55 55)",
  "Procesor": "rgb(55 60 77)",
  "Dysk": "rgb(55 72 77)",
  "Parametry obudowy": "rgb(56 55 77)",
  "Wygląd wizualny": "rgb(68 77 55)",
  "podstawowe": "rgb(68 77 55)",
  "Klawiatura": "rgb(68 77 55)",
};


// --- Kategorie i przypisane atrybuty ---
const CATEGORY_MAP: Record<string, string[]> = {
  "podstawowe": [
    "Stan",
    "Typ",
    "Model",
    "Kolor",
    "Libre Office",
    "Informacja o Windows 11",
  ],

  "Procesor": [
    "Seria procesora",
    "Model procesora",
    "Procesor",
    "Rdzenie",
    "Wątki",
    "Taktowanie",
    "Taktowanie_TURBO",
  ],

  "Pamięć RAM": ["Wielkość pamięci RAM", "Typ pamięci RAM"],

  "GPU": [
    "Opis karty graficznej",
    "Rodzaj karty graficznej",
    "Karta Graficzna",
  ],

  "Dysk": ["Pojemność dysku (GB)", "Pojemność dysku", "Typ dysku twardego",],


  "Klawiatura": [
    "Układ klawiatury",
    "Klawiatura",
    "Dodatkowy opis klawiatury",

  ],
  "Wygląd wizualny": [
    "Stan wizualny",
    "Stan matrycy",
    "Wielkość matrycy",
    "Powłoka matrycy",
    "Rozdzielczość (px)",
    "Częstotliwość odświeżania",
    "Ekran dotykowy",
    "Mikrofon",

    "Rodzaj panelu",
    "Dodatkowy opis matrycy",
    "Dodatkowy opis obudowy",
    "bez opisu obudowy",
    "bez opisu matrycy",
  ],


  "Złącza i komunikacja": [
    "USB 2.0",
    "USB 3.0",
    "USB C",
    "Thunderbolt",
    "minijack 3,5 mm (audio)",
    "HDMI",
    "LAN",
    "Czytnik kart pamięci",
    "DisplayPort",
    "D-Sub (VGA)",
    "Złącze dokowania",
    "mini HDMI",
    "mini DisplayPort",
    "Kamera",
    "WiFi",
    "modem 4G",
    "Bluetooth",
    "Typ napędu",

    "eSATA",
    "DisplayPort",










    "Blokada Kensington Lock"
  ],





  "Parametry obudowy": [
    "typ obudowy",
    "Kolor",
    "Głębokość",
    "Szerokość produktu",
    "Wysokość",
  ],

};

const norm = (s?: string) => (s ?? "").trim();
const normKey = (s?: string) => norm(s).toLowerCase();
const SHOPER_OPTION_PREFIX = "__shoper_option__:";

const isVisualConditionAttribute = (attribute: any) => normKey(attribute?.name) === normKey("Stan wizualny");

const getVisualConditionOptionLabel = (option: any, duplicateIndex: number, duplicateCount: number) => {
  const value = String(option?.value ?? "");
  if (duplicateCount < 2) return value;
  if (value === "Dobry") return duplicateIndex === 0 ? "Dobry kat 2" : "Dobry";
  if (value === "Bardzo dobry") return duplicateIndex === 0 ? "Bardzo dobry" : "Bardzo dobry kat 2";
  return duplicateIndex === 0 ? value : `${value} kat ${duplicateIndex + 1}`;
};

const getSelectOptionValue = (attribute: any, option: any, duplicateCount: number) => {
  if (!isVisualConditionAttribute(attribute) || duplicateCount < 2) return option.value ?? "";
  return `${SHOPER_OPTION_PREFIX}${option.option_id}`;
};

interface AttributeFormProps {
  attributeList: any[];
  control: any;
  register: any;
  loading: boolean;
  textAttributeHandlers?: Record<string, (value: string) => void>;
}

export const LaptopAttributeForm: React.FC<AttributeFormProps> = React.memo(({
  attributeList,
  control,
  register,
  loading,
  textAttributeHandlers,
}) => {
  // --- renderowanie pojedynczego atrybutu ---
  const renderAttribute = (attribute: any) => {
    if (attribute.type == "2") {
      // SELECT
      return (
        <FormControl key={attribute.attribute_id} fullWidth>
          <InputLabel id={`select-${attribute.attribute_id}-label`}>
            {attribute.name}
          </InputLabel>
          <Controller
            name={`attribute_${attribute.attribute_id}`}
            control={control}
            render={({ field }) => (
              <Select
                labelId={`select-${attribute.attribute_id}-label`}
                id={`select-${attribute.attribute_id}`}
                label={attribute.name}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
              >
                {(() => {
                  const baseOptions = attribute.options ?? [];
                  const selectedValue = field.value ?? "";
                  const normalizedSelected = String(selectedValue);
                  const valueCounts = baseOptions.reduce((acc: Record<string, number>, opt: any) => {
                    const value = String(opt.value ?? "");
                    acc[value] = (acc[value] ?? 0) + 1;
                    return acc;
                  }, {});
                  const seenValues: Record<string, number> = {};
                  const mappedOptions = baseOptions.map((opt: any) => {
                    const value = String(opt.value ?? "");
                    const duplicateIndex = seenValues[value] ?? 0;
                    seenValues[value] = duplicateIndex + 1;
                    const duplicateCount = valueCounts[value] ?? 0;
                    return {
                      ...opt,
                      label: getVisualConditionOptionLabel(opt, duplicateIndex, duplicateCount),
                      selectValue: getSelectOptionValue(attribute, opt, duplicateCount),
                    };
                  });
                  const optionValues = new Set(
                    mappedOptions.map((opt: any) => String(opt.selectValue ?? ""))
                  );
                  const extraOption =
                    normalizedSelected && !optionValues.has(normalizedSelected)
                      ? [{ option_id: "__custom__", value: normalizedSelected, label: normalizedSelected, selectValue: normalizedSelected }]
                      : [];
                  return [...extraOption, ...mappedOptions];
                })().map((option: any) => (
                  <MenuItem key={option.option_id} value={option.selectValue ?? ""}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>
      );
    }

    if (attribute.type == "1") {
      // CHECKBOX
      return (
        <Controller
          key={attribute.attribute_id}
          name={`attribute_${attribute.attribute_id}`}
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                />
              }
              label={attribute.name}
            />
          )}
        />
      );
    }

    if (attribute.type == "0") {
      // TEXT
      const onBlurHandler = textAttributeHandlers?.[normKey(attribute.name)];
      return (
        <TextField
          slotProps={{ inputLabel: { shrink: true } }}
          key={attribute.attribute_id}
          label={attribute.name}
          variant="outlined"
          type="text"
          fullWidth
          {...register(
            `attribute_${attribute.attribute_id}`,
            onBlurHandler
              ? { onBlur: (e: React.FocusEvent<HTMLInputElement>) => onBlurHandler(e.target.value) }
              : undefined
          )}
        />
      );
    }

    return null;
  };

  // --- grupowanie atrybutów ---
  const { grouped, uncategorized } = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};
    Object.keys(CATEGORY_MAP).forEach((k) => (grouped[k] = []));
    const uncategorized: any[] = [];

    const uniqueAttributes = (() => {
      const byId = new Map<number, any>();
      (attributeList ?? []).forEach((attr: any) => {
        const id = Number(attr?.attribute_id);
        if (!Number.isFinite(id)) return;
        if (!byId.has(id)) {
          byId.set(id, attr);
        }
      });
      return Array.from(byId.values());
    })();

    uniqueAttributes.forEach((attr: any) => {
      const attrName = normKey(attr.name);
      let placed = false;

      for (const [category, names] of Object.entries(CATEGORY_MAP)) {
        if (names.map(normKey).includes(attrName)) {
          grouped[category].push(attr);
          placed = true;
          break;
        }
      }

      if (!placed) {
        uncategorized.push(attr);
      }
    });

    for (const [category, attrs] of Object.entries(grouped)) {
      const order = (CATEGORY_MAP[category] || []).map(normKey);

      grouped[category] = [...attrs].sort((a, b) => {
        const aIndex = order.indexOf(normKey(a.name));
        const bIndex = order.indexOf(normKey(b.name));

        // jeśli coś nie jest w CATEGORY_MAP, wrzucamy na koniec
        return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
          (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
      });
    }

    return { grouped, uncategorized };
  }, [attributeList]);

  // --- render kategorii ---
  return !loading ? (
    <Stack spacing={3}>
      {Object.entries(grouped).map(([category, attrs]) =>
        attrs.length ? (
          <Box
            key={category}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
              borderLeft: `6px solid ${CATEGORY_COLORS[category] ?? "#111"}`,
              backgroundColor: "rgba(20, 23, 33, 0.55)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              padding: { xs: 2, md: 2.5 },
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {category}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {attrs.length} pól
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
                "& .MuiFormControl-root, & .MuiTextField-root": {
                  width: "100%",
                },
                "& .MuiInputBase-root": {
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: 1,
                },
              }}
            >
              {(() => {
                if (category !== "Wygląd wizualny") {
                  return attrs.map((a) => renderAttribute(a));
                }

                const caseKey = normKey("Dodatkowy opis obudowy");
                const matrixKey = normKey("Dodatkowy opis matrycy");
                const caseAttr = attrs.find((a) => normKey(a.name) === caseKey);
                const matrixAttr = attrs.find((a) => normKey(a.name) === matrixKey);
                const mainAttrs = attrs.filter(
                  (a) => normKey(a.name) !== caseKey && normKey(a.name) !== matrixKey
                );

                return (
                  <>
                    {mainAttrs.map((a) => renderAttribute(a))}
                    {(caseAttr || matrixAttr) && (
                      <>
                        <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                              gap: 2,
                              "& .MuiFormControl-root, & .MuiTextField-root": {
                                width: "100%",
                              },
                            }}
                          >
                            {caseAttr ? renderAttribute(caseAttr) : <Box />}
                            {matrixAttr ? renderAttribute(matrixAttr) : <Box />}
                          </Box>
                        </Box>
                      </>
                    )}
                  </>
                );
              })()}
            </Box>
          </Box>
        ) : null
      )}

      {uncategorized.length ? (
        <Box
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(20, 23, 33, 0.4)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            padding: { xs: 2, md: 2.5 },
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Inne
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {uncategorized.length} pól
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: 2,
              "& .MuiFormControl-root, & .MuiTextField-root": {
                width: "100%",
              },
              "& .MuiInputBase-root": {
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 1,
              },
            }}
          >
            {uncategorized.map((a) => renderAttribute(a))}
          </Box>
        </Box>
      ) : null}
    </Stack>
  ) : null;
});

LaptopAttributeForm.displayName = "LaptopAttributeForm";
