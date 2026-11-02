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
import { isAdditionalFeaturesName } from "../additionalFeatures";

const CATEGORY_COLORS: Record<string, string> = {
  "różne": "rgb(56 55 77)",
  "Złącza i komunikacja": "rgb(55 77 57)",
  "GPU": "rgb(77 67 55)",
  "Pamięć RAM": "rgb(77 55 55)",
  "Procesor": "rgb(55 60 77)",
  "Dysk": "rgb(55 72 77)",
  "Parametry obudowy": "rgb(56 55 77)",
  "AIO": "rgb(68 77 55)",
};


// --- Kategorie i przypisane atrybuty ---
const CATEGORY_MAP: Record<string, string[]> = {
  "różne": [
    "Napęd",
    "System operacyjny",
    "Model",
    "Moc zasilacza (W)",
    "Moduł wifi",
    "Stan wizualny",
    "uwagi",
    "Dodatkowe cechy",
    "W zestawie"
  ],
  "Złącza i komunikacja": [
    "Złącza zewnętrzne płyty głównej",
    "Komunikacja",
    "Złącza karty graficznej",
    "Złącza obudowy",
  ],
  "GPU": [
    "Opis karty graficznej",
    "Typ karty graficznej",
    "Karta Graficzna",
  ],
  "Pamięć RAM": ["Wielkość pamięci RAM", "Typ Pamięci"],
  "Procesor": [
    "Seria procesora",
    "Model procesora",
    "Taktowanie maksymalne procesora (GHz)",
    "Taktowanie bazowe procesora (GHz)",
    "Liczba wątków procesora",
    "Liczba rdzeni procesora",
  ],
  "Dysk": ["Typ dysku twardego", "Pojemność dysku (GB)"],

  "Parametry obudowy": ["typ obudowy", "Kolor", "Głębokość", "Szerokość produktu", "Wysokość"],
  "AIO": [
    "Podstawka AIO",
    "Przekątna ekranu",
    "Rozdzielczość",
    "Częstotliwość odświeżania",
    "Ekran dotykowy",
    "Mikrofon",

    "Rodzaj panelu",
    "Kamera",
  ],
};

const norm = (s?: string) => (s ?? "").trim();
const normKey = (s?: string) => norm(s).toLowerCase();
const PRODUCT_SAFETY_PRODUCER_KEYS = new Set([
  "product safety producer",
  "producent bezpieczeństwa produktu",
  "producent bezpieczenstwa produktu",
]);

interface AttributeFormProps {
  attributeList: any[];
  control: any;
  register: any;
  loading: boolean;
}

export const AttributeForm: React.FC<AttributeFormProps> = ({
  attributeList,
  control,
  register,
  loading,
}) => {
  // --- renderowanie pojedynczego atrybutu ---
  const renderAttribute = (attribute: any) => {
    const isProductSafetyProducer = PRODUCT_SAFETY_PRODUCER_KEYS.has(
      normKey(attribute?.name)
    );

    if (isProductSafetyProducer) {
      // SELECT (wymuszony pojedynczy wybór, natywny select bez czyszczenia)
      return (
        <Controller
          key={attribute.attribute_id}
          name={`attribute_${attribute.attribute_id}`}
          control={control}
          render={({ field }) => (
            <TextField
              name={field.name}
              select
              fullWidth
              label={attribute.name}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              inputRef={field.ref}
              SelectProps={{ native: true }}
            >
              <option value="" />
              {(attribute.options ?? []).map((option: any) => (
                <option key={option.option_id} value={option.value ?? ""}>
                  {option.value}
                </option>
              ))}
            </TextField>
          )}
        />
      );
    }

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
                name={field.name}
                labelId={`select-${attribute.attribute_id}-label`}
                id={`select-${attribute.attribute_id}`}
                label={attribute.name}
                value={(attribute.options ?? []).some((option: any) => String(option.value ?? "") === String(field.value ?? "")) ? field.value : ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
              >
                {(attribute.options ?? []).map((option: any) => (
                  <MenuItem key={option.option_id} value={option.value ?? ""}>
                    {option.value}
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
                  name={field.name}
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
      const isAdditionalFeatures = isAdditionalFeaturesName(attribute.name);
      if (isAdditionalFeatures) {
        return (
          <Controller
            key={attribute.attribute_id}
            name={`attribute_${attribute.attribute_id}`}
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                name={field.name}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                slotProps={{ inputLabel: { shrink: true } }}
                label={attribute.name}
                variant="outlined"
                multiline
                minRows={3}
                helperText="Jedna cecha w wierszu. Trafią do opisu Shopera i Allegro."
                fullWidth
              />
            )}
          />
        );
      }
      return (
        <TextField
          slotProps={{ inputLabel: { shrink: true } }}
          key={attribute.attribute_id}
          label={attribute.name}
          variant="outlined"
          fullWidth
          {...register(`attribute_${attribute.attribute_id}`)}
        />
      );
    }

    return null;
  };

  // --- grupowanie atrybutów ---
  const grouped: Record<string, any[]> = {};
  Object.keys(CATEGORY_MAP).forEach((k) => (grouped[k] = []));
  const uncategorized: any[] = [];

  (attributeList ?? []).forEach((attr: any) => {
    const attrName = norm(attr.name);
    let placed = false;

    for (const [category, names] of Object.entries(CATEGORY_MAP)) {
      if (names.map(norm).includes(attrName)) {
        grouped[category].push(attr);
        placed = true;
        break;
      }
    }

    if (!placed) {
      uncategorized.push(attr);
    }
  });

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
              {attrs.map((a) => renderAttribute(a))}
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
};
