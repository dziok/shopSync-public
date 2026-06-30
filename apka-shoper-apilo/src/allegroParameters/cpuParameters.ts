export const cpuParameters =
    [
        {
            "id": "11323",
            "name": "Stan",
            "type": "dictionary",
            "required": true,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": true,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": false,
                "customValuesEnabled": false
            },
            "dictionary": [
                {
                    "id": "11323_1",
                    "value": "Nowy",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_2",
                    "value": "Używany",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_238066",
                    "value": "Po zwrocie",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_1223453",
                    "value": "Na części",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_238070",
                    "value": "Niepełny komplet",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_246514",
                    "value": "Nowy z defektem",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_238058",
                    "value": "Powystawowy",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_238062",
                    "value": "Uszkodzony",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_246534",
                    "value": "Odnowiony przez producenta",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_246538",
                    "value": "Odnowiony przez sprzedawcę",
                    "dependsOnValueIds": []
                },
                {
                    "id": "11323_1223636",
                    "value": "Przepakowany",
                    "dependsOnValueIds": []
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "248914",
            "name": "Producent",
            "type": "dictionary",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": true,
                "ambiguousValueId": "248914_961942",
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": true
            },
            "dictionary": [
                {
                    "id": "248914_1986115",
                    "value": "AMD",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1705029",
                    "value": "Apple",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1986662",
                    "value": "Chengdu",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1986677",
                    "value": "Cisco",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1971942",
                    "value": "Dell",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1938186",
                    "value": "EMC",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1022886",
                    "value": "HP",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1987544",
                    "value": "IBM",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1987632",
                    "value": "Intel",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1987925",
                    "value": "Lenovo",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1988003",
                    "value": "Lzbkstore",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1988308",
                    "value": "NewMoo",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_1988882",
                    "value": "Satel",
                    "dependsOnValueIds": []
                },
                {
                    "id": "248914_961942",
                    "value": "inny",
                    "dependsOnValueIds": []
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "219805",
            "name": "Model procesora",
            "type": "string",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "minLength": 1,
                "maxLength": 40,
                "allowedNumberOfValues": 1
            }
        },
        {
            "id": "206182",
            "name": "Seria",
            "type": "dictionary",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": "206182_855105",
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": true
            },
            "dictionary": [
                {
                    "id": "206182_1647161",
                    "value": "AMD A10",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647165",
                    "value": "AMD A4",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647164",
                    "value": "AMD A6",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647167",
                    "value": "AMD A8",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226338",
                    "value": "AMD APU",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226346",
                    "value": "AMD Athlon",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_2005883",
                    "value": "AMD Athlon Gold 7220U",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647169",
                    "value": "AMD Athlon X2",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647162",
                    "value": "AMD Athlon X4",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647173",
                    "value": "AMD Embedded G-Series",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647172",
                    "value": "AMD Embedded R-Series",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226334",
                    "value": "AMD FX",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647166",
                    "value": "AMD Kaveri",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647171",
                    "value": "AMD Opteron",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226342",
                    "value": "AMD Phenom",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647159",
                    "value": "AMD Phenom II",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647160",
                    "value": "AMD Richland",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647163",
                    "value": "AMD Ryzen",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226330",
                    "value": "AMD Ryzen 3",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226326",
                    "value": "AMD Ryzen 5",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1943477",
                    "value": "AMD Ryzen 5 7520U",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934657",
                    "value": "AMD Ryzen 5 PRO 8540U",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226322",
                    "value": "AMD Ryzen 7",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_2012715",
                    "value": "AMD Ryzen 7 5700X",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934655",
                    "value": "AMD Ryzen 7 7435HS",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934364",
                    "value": "AMD Ryzen 7 7730U",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934653",
                    "value": "AMD Ryzen 7 7735HS",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934648",
                    "value": "AMD Ryzen 7 7745HX",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934651",
                    "value": "AMD Ryzen 7 7840HS",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934659",
                    "value": "AMD Ryzen 7 PRO 8840U",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_524901",
                    "value": "AMD Ryzen 9",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226318",
                    "value": "AMD Ryzen Threadripper",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647170",
                    "value": "AMD Sempron",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647168",
                    "value": "AMD Trinity",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647174",
                    "value": "Apple M",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934687",
                    "value": "Core 7",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934647",
                    "value": "i7-13705H",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647158",
                    "value": "Intel Atom",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226302",
                    "value": "Intel Celeron",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226298",
                    "value": "Intel Core 2",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647154",
                    "value": "Intel Core 2 Duo",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647153",
                    "value": "Intel Core 2 Quad",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226294",
                    "value": "Intel Core i3",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1999191",
                    "value": "Intel Core i3-1315U",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226290",
                    "value": "Intel Core i5",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_2009136",
                    "value": "Intel Core i5-1240U",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226286",
                    "value": "Intel Core i7",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934363",
                    "value": "Intel Core i7-1355U",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1934362",
                    "value": "Intel Core i7-1365U",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_2009134",
                    "value": "Intel Core i7-13850HX",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226282",
                    "value": "Intel Core i9",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647152",
                    "value": "Intel Core m3",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1925677",
                    "value": "Intel Core Ultra 5",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1925678",
                    "value": "Intel Core Ultra 7",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1925679",
                    "value": "Intel Core Ultra 9",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_2026916",
                    "value": "Intel N-series",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226306",
                    "value": "Intel Pentium",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_226310",
                    "value": "Intel Xeon",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647155",
                    "value": "Intel Xeon E3",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647156",
                    "value": "Intel Xeon E5",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_1647157",
                    "value": "Intel Xeon E7",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206182_855105",
                    "value": "inna",
                    "dependsOnValueIds": []
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "249393",
            "name": "Generacja procesora",
            "type": "dictionary",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": {
                "parametersWithValue": [
                    {
                        "id": "206182",
                        "oneOfValueIds": [
                            "206182_226286",
                            "206182_226318",
                            "206182_226330",
                            "206182_524901",
                            "206182_226282",
                            "206182_226290",
                            "206182_226326",
                            "206182_226294",
                            "206182_226322"
                        ]
                    }
                ]
            },
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": "206182",
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "dictionary": [
                {
                    "id": "249393_1188962",
                    "value": "1",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226318",
                        "206182_226330",
                        "206182_524901",
                        "206182_226282",
                        "206182_226290",
                        "206182_226326",
                        "206182_226294",
                        "206182_226322"
                    ]
                },
                {
                    "id": "249393_1188963",
                    "value": "2",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226318",
                        "206182_226330",
                        "206182_524901",
                        "206182_226282",
                        "206182_226290",
                        "206182_226326",
                        "206182_226294",
                        "206182_226322"
                    ]
                },
                {
                    "id": "249393_1188964",
                    "value": "3",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226318",
                        "206182_226330",
                        "206182_524901",
                        "206182_226282",
                        "206182_226290",
                        "206182_226326",
                        "206182_226294",
                        "206182_226322"
                    ]
                },
                {
                    "id": "249393_1188965",
                    "value": "4",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226318",
                        "206182_226330",
                        "206182_524901",
                        "206182_226282",
                        "206182_226290",
                        "206182_226326",
                        "206182_226294",
                        "206182_226322"
                    ]
                },
                {
                    "id": "249393_1188966",
                    "value": "5",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290",
                        "206182_226294"
                    ]
                },
                {
                    "id": "249393_1188967",
                    "value": "6",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290",
                        "206182_226294"
                    ]
                },
                {
                    "id": "249393_1188968",
                    "value": "7",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290",
                        "206182_226294"
                    ]
                },
                {
                    "id": "249393_1188969",
                    "value": "8",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290",
                        "206182_226294"
                    ]
                },
                {
                    "id": "249393_1188970",
                    "value": "9",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290",
                        "206182_226294"
                    ]
                },
                {
                    "id": "249393_1188971",
                    "value": "10",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290",
                        "206182_226294"
                    ]
                },
                {
                    "id": "249393_1648194",
                    "value": "11",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290",
                        "206182_226294"
                    ]
                },
                {
                    "id": "249393_1648195",
                    "value": "12",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290",
                        "206182_226294"
                    ]
                },
                {
                    "id": "249393_1681128",
                    "value": "13",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290",
                        "206182_226294"
                    ]
                },
                {
                    "id": "249393_1790512",
                    "value": "14",
                    "dependsOnValueIds": [
                        "206182_226286",
                        "206182_226282",
                        "206182_226290"
                    ]
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "224017",
            "name": "Kod producenta",
            "type": "string",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "minLength": 1,
                "maxLength": 45,
                "allowedNumberOfValues": 1
            }
        },
        {
            "id": "225693",
            "name": "EAN (GTIN)",
            "type": "string",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "minLength": 8,
                "maxLength": 14,
                "allowedNumberOfValues": 1
            }
        },
        {
            "id": "4329",
            "name": "Liczba rdzeni procesora",
            "type": "dictionary",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "dictionary": [
                {
                    "id": "4329_1",
                    "value": "1",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_2",
                    "value": "2",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_6",
                    "value": "3",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_3",
                    "value": "4",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_1884069",
                    "value": "5",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_5",
                    "value": "6",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_7",
                    "value": "8",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_9",
                    "value": "10",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_10",
                    "value": "12",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_12",
                    "value": "14",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_11",
                    "value": "16",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_13",
                    "value": "18",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_14",
                    "value": "20",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_15",
                    "value": "22",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_317233",
                    "value": "24",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_568013",
                    "value": "32",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_568017",
                    "value": "64",
                    "dependsOnValueIds": []
                },
                {
                    "id": "4329_8",
                    "value": "nie dotyczy",
                    "dependsOnValueIds": []
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "206294",
            "name": "Typ gniazda procesora",
            "type": "dictionary",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": "206294_855140",
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "dictionary": [
                {
                    "id": "206294_226822",
                    "value": "AMD Socket 462",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226826",
                    "value": "AMD Socket 463",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226830",
                    "value": "AMD Socket 563",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226834",
                    "value": "AMD Socket 754",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226838",
                    "value": "AMD Socket 939",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226842",
                    "value": "AMD Socket 940",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226818",
                    "value": "AMD Socket 1207",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226846",
                    "value": "AMD Socket AM1",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226850",
                    "value": "AMD Socket AM2",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226854",
                    "value": "AMD Socket AM2+",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226858",
                    "value": "AMD Socket AM3",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226862",
                    "value": "AMD Socket AM3+",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226866",
                    "value": "AMD Socket AM4",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_1680143",
                    "value": "AMD Socket AM5",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_246398",
                    "value": "AMD Socket TR4",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226870",
                    "value": "AMD Socket FM1",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226874",
                    "value": "AMD Socket FM2",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226878",
                    "value": "AMD Socket FM2+",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226890",
                    "value": "Intel Socket 1150",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226894",
                    "value": "Intel Socket 1151",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226898",
                    "value": "Intel Socket 1155",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226902",
                    "value": "Intel Socket 1156",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_589277",
                    "value": "Intel Socket 1200",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226906",
                    "value": "Intel Socket 1366",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226910",
                    "value": "Intel Socket 2011",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226886",
                    "value": "Intel Socket 2011-3",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226882",
                    "value": "Intel Socket 2066",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226922",
                    "value": "Intel Socket 437",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226926",
                    "value": "Intel Socket 478",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226930",
                    "value": "Intel Socket 479",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226934",
                    "value": "Intel Socket 486",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226938",
                    "value": "Intel Socket 603",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226942",
                    "value": "Intel Socket 604",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226914",
                    "value": "Intel Socket 771",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_226918",
                    "value": "Intel Socket 775",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_1098547",
                    "value": "Intel Socket 1700",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_1928521",
                    "value": "Intel Socket 1851",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206294_855140",
                    "value": "pozostałe",
                    "dependsOnValueIds": []
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "201725",
            "name": "Taktowanie bazowe procesora",
            "type": "float",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": "GHz",
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "min": 0,
                "max": 1000000,
                "range": false,
                "precision": 2
            }
        },
        {
            "id": "201721",
            "name": "Taktowanie maksymalne procesora",
            "type": "float",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": "GHz",
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "min": 0,
                "max": 1000000,
                "range": false,
                "precision": 2
            }
        },
        {
            "id": "206218",
            "name": "Liczba wątków",
            "type": "integer",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "min": 0,
                "max": 1000000,
                "range": false
            }
        },
        {
            "id": "206230",
            "name": "Pamięć podręczna",
            "type": "float",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": "MB",
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "min": 0,
                "max": 1000000,
                "range": false,
                "precision": 2
            }
        },
        {
            "id": "206234",
            "name": "Proces technologiczny",
            "type": "integer",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": "nm",
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "min": 0,
                "max": 1000000,
                "range": false
            }
        },
        {
            "id": "206238",
            "name": "Współczynnik TDP",
            "type": "integer",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": "W",
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "min": 0,
                "max": 1000000,
                "range": false
            }
        },
        {
            "id": "206242",
            "name": "Architektura",
            "type": "dictionary",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "dictionary": [
                {
                    "id": "206242_226390",
                    "value": "32-bit",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206242_226386",
                    "value": "64-bit",
                    "dependsOnValueIds": []
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "206250",
            "name": "Wersja opakowania",
            "type": "dictionary",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": true,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "dictionary": [
                {
                    "id": "206250_226414",
                    "value": "BOX",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206250_385765",
                    "value": "brak informacji",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206250_226410",
                    "value": "OEM",
                    "dependsOnValueIds": []
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "206258",
            "name": "Chłodzenie w zestawie",
            "type": "dictionary",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "dictionary": [
                {
                    "id": "206258_226418",
                    "value": "tak",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206258_226422",
                    "value": "nie",
                    "dependsOnValueIds": []
                },
                {
                    "id": "206258_385757",
                    "value": "brak informacji",
                    "dependsOnValueIds": []
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "219821",
            "name": "Model zintegrowanej karty graficznej",
            "type": "string",
            "required": true,
            "requiredForProduct": true,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "minLength": 1,
                "maxLength": 30,
                "allowedNumberOfValues": 1
            }
        },
        {
            "id": "219801",
            "name": "Cechy dodatkowe",
            "type": "string",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "minLength": 1,
                "maxLength": 50,
                "allowedNumberOfValues": 5
            }
        },
        {
            "id": "218829",
            "name": "Załączone wyposażenie",
            "type": "string",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "minLength": 1,
                "maxLength": 40,
                "allowedNumberOfValues": 10
            }
        },
        {
            "id": "212838",
            "name": "Maksymalny pobór mocy",
            "type": "integer",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": "W",
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "min": 0,
                "max": 1000000,
                "range": false
            }
        },
        {
            "id": "17448",
            "name": "Waga produktu z opakowaniem jednostkowym",
            "type": "float",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": "kg",
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "restrictions": {
                "min": 0,
                "max": 1000000,
                "range": false,
                "precision": 3
            }
        },
        {
            "id": "229205",
            "name": "Stan opakowania",
            "type": "dictionary",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": "11323",
                "describesProduct": false,
                "customValuesEnabled": false
            },
            "dictionary": [
                {
                    "id": "229205_340245",
                    "value": "oryginalne",
                    "dependsOnValueIds": [
                        "11323_253798",
                        "11323_246534",
                        "11323_1",
                        "11323_1223636",
                        "11323_1223462",
                        "11323_246510",
                        "11323_253802",
                        "11323_852680",
                        "11323_246514",
                        "11323_253806",
                        "11323_246466",
                        "11323_2",
                        "11323_1223635",
                        "11323_238066",
                        "11323_238058",
                        "11323_246462",
                        "11323_238062",
                        "11323_246538",
                        "11323_1223453",
                        "11323_238070"
                    ]
                },
                {
                    "id": "229205_340249",
                    "value": "otwarte",
                    "dependsOnValueIds": [
                        "11323_253798",
                        "11323_246534",
                        "11323_1223636",
                        "11323_1223462",
                        "11323_246510",
                        "11323_253802",
                        "11323_852680",
                        "11323_246514",
                        "11323_253806",
                        "11323_246466",
                        "11323_2",
                        "11323_1223635",
                        "11323_238066",
                        "11323_238058",
                        "11323_246462",
                        "11323_238062",
                        "11323_246538",
                        "11323_1223453",
                        "11323_238070"
                    ]
                },
                {
                    "id": "229205_340253",
                    "value": "uszkodzone",
                    "dependsOnValueIds": [
                        "11323_253798",
                        "11323_246534",
                        "11323_1223636",
                        "11323_1223462",
                        "11323_246510",
                        "11323_253802",
                        "11323_852680",
                        "11323_246514",
                        "11323_253806",
                        "11323_246466",
                        "11323_2",
                        "11323_1223635",
                        "11323_238066",
                        "11323_238058",
                        "11323_246462",
                        "11323_238062",
                        "11323_246538",
                        "11323_1223453",
                        "11323_238070"
                    ]
                },
                {
                    "id": "229205_340257",
                    "value": "zastępcze",
                    "dependsOnValueIds": [
                        "11323_253798",
                        "11323_246534",
                        "11323_1223636",
                        "11323_1223462",
                        "11323_246510",
                        "11323_253802",
                        "11323_852680",
                        "11323_246514",
                        "11323_253806",
                        "11323_246466",
                        "11323_2",
                        "11323_1223635",
                        "11323_238066",
                        "11323_238058",
                        "11323_246462",
                        "11323_238062",
                        "11323_246538",
                        "11323_1223453",
                        "11323_238070"
                    ]
                },
                {
                    "id": "229205_340261",
                    "value": "brak opakowania",
                    "dependsOnValueIds": [
                        "11323_253798",
                        "11323_246534",
                        "11323_1223636",
                        "11323_1223462",
                        "11323_246510",
                        "11323_253802",
                        "11323_852680",
                        "11323_246514",
                        "11323_253806",
                        "11323_246466",
                        "11323_2",
                        "11323_1223635",
                        "11323_238066",
                        "11323_238058",
                        "11323_246462",
                        "11323_238062",
                        "11323_246538",
                        "11323_1223453",
                        "11323_238070"
                    ]
                }
            ],
            "restrictions": {
                "multipleChoices": false
            }
        },
        {
            "id": "218669",
            "name": "Informacje o bezpieczeństwie",
            "type": "dictionary",
            "required": false,
            "requiredForProduct": false,
            "requiredIf": null,
            "displayedIf": null,
            "unit": null,
            "options": {
                "variantsAllowed": false,
                "variantsEqual": false,
                "ambiguousValueId": null,
                "dependsOnParameterId": null,
                "describesProduct": true,
                "customValuesEnabled": false
            },
            "dictionary": [
                {
                    "id": "218669_1",
                    "value": "CE",
                    "dependsOnValueIds": []
                },
                {
                    "id": "218669_1880913",
                    "value": "WEEE",
                    "dependsOnValueIds": []
                }
            ],
            "restrictions": {
                "multipleChoices": true
            }
        }
    ]
