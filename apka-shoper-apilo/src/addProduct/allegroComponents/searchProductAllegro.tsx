// components/AllegroProductSearch.tsx
import React from "react";
import { FormControlLabel, Checkbox, TextField, Button } from "@mui/material";
import { UseFormRegister } from "react-hook-form";

interface AllegroProductSearchProps {
    register: UseFormRegister<any>;
    searchName: string;
    setSearchName: (val: string) => void;
    handleSearch: () => void;
}

const AllegroProductSearch: React.FC<AllegroProductSearchProps> = ({
    register,
    searchName,
    setSearchName,
    handleSearch
}) => {
    return (
        <div
            style={{
                borderRadius: "5px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                padding: "20px",
                backgroundColor: "rgb(55, 61, 77)",
            }}
        >
            <FormControlLabel
                control={<Checkbox defaultChecked {...register("connectProductAllegro")} />}
                label="Połącz z produktem allegro"
            />
            <div style={{ display: "flex", gap: "10px" }}>
                <TextField
                    variant="filled"
                    size="small"
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Wyszukaj produkt allegro"
                    fullWidth
                />
                <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                >
                    Szukaj
                </Button>
            </div>
        </div>
    );
};

export default AllegroProductSearch;
