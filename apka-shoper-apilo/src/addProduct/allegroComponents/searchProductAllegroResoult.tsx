// components/AllegroSearchResults.tsx
import React from "react";
import { Button } from "@mui/material";

interface AllegroSearchResultsProps {
    showSearchresult: boolean;
    searchResult: any;
    selectedProductId: string | null;
    setShowSearchresult: (value: boolean) => void;
    handleSelectAllegroProduct: (product: any) => void;
}

const AllegroSearchResults: React.FC<AllegroSearchResultsProps> = ({
    showSearchresult,
    searchResult,
    selectedProductId,
    setShowSearchresult,
    handleSelectAllegroProduct
}) => {
    if (!showSearchresult) return null;

    return (
        <div style={{
            zIndex: '100',
            top: '50px',
            left: '35%',
            position: 'fixed',
            maxHeight: '700px',
            overflowY: 'auto',
            width: '700px',
            backgroundColor: '#fff',
            color: '#333',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px'
        }}>
            <Button
                style={{
                    position: "fixed",
                    color: "#c21d1d",
                    backgroundColor: "#e8c7c7",
                    marginTop: "5px",
                    marginLeft: "640px",
                    borderRadius: "50%",
                    width: "45px",
                    height: "45px",
                    minWidth: "45px",
                    fontSize: '20px',
                    fontWeight: 'bold'
                }}
                onClick={() => setShowSearchresult(false)}
            >
                ✕
            </Button>

            {!searchResult ? (
                <p className="text-gray-500">Brak wyników.</p>
            ) : (
                <>
                    {searchResult.products?.map((product: any) => (
                        <div
                            key={product.id}
                            style={{
                                borderBottom: '1px darkgray solid',
                                fontSize: '0.7rem',
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: '1rem', color: '#1078e0' }}>{product.name}</h3>
                                <p className="text-sm mt-2">
                                    Kategoria: {product.category?.path?.map((p: any) => p.name).join(' > ') || 'brak'}
                                </p>

                                {product.parameters?.length > 0 && (
                                    <>
                                        <ul>
                                            {product.parameters
                                                .filter((param: any) => param.options?.identifiesProduct === true)
                                                .map((param: any, idx: number) => {
                                                    const value =
                                                        param.valuesLabels?.join(', ') ||
                                                        param.values?.join(', ') ||
                                                        (param.rangeValue?.from && param.rangeValue?.to
                                                            ? `${param.rangeValue.from} - ${param.rangeValue.to}`
                                                            : 'brak danych');

                                                    return (
                                                        <li key={`true-${idx}`} style={{ fontSize: '0.8rem' }}>
                                                            <b>{param.name}: {value}</b>
                                                            {param.unit && !value.includes(param.unit) ? ` ${param.unit}` : ''}
                                                        </li>
                                                    );
                                                })}
                                        </ul>

                                        <ul>
                                            {product.parameters
                                                .filter((param: any) => param.options?.identifiesProduct === false)
                                                .map((param: any, idx: number) => {
                                                    const value =
                                                        param.valuesLabels?.join(', ') ||
                                                        param.values?.join(', ') ||
                                                        (param.rangeValue?.from && param.rangeValue?.to
                                                            ? `${param.rangeValue.from} - ${param.rangeValue.to}`
                                                            : 'brak danych');

                                                    return (
                                                        <li key={`false-${idx}`}>
                                                            {param.name}: {value}
                                                            {param.unit && !value.includes(param.unit) ? ` ${param.unit}` : ''}
                                                        </li>
                                                    );
                                                })}
                                        </ul>
                                    </>
                                )}

                                <Button
                                    className="mt-2"
                                    onClick={() => {
                                        setShowSearchresult(false);
                                        handleSelectAllegroProduct(product);
                                    }}
                                >
                                    wybierz
                                </Button>

                                {selectedProductId === product.id && (
                                    <p>✅ Wybrano ten produkt</p>
                                )}
                                <p>{selectedProductId}</p>
                            </div>

                            {product.images?.[0]?.url && (
                                <img
                                    src={product.images[0].url}
                                    alt={product.name}
                                    style={{ height: '200px', padding: '20px' }}
                                />
                            )}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default AllegroSearchResults;
