import { renderConditionalDescription } from "../templates/renderConditionalDescription";

export const damagedLaptopTemplate = (
    model: string,
    marka: string,
    visualConditionDescription: string,
    biosOK: string,
    biosX: string,
    cpu: string,
    ram: string,
    disk: string,
    gpu: string,
    screen: string,
    battery: string,
) => renderConditionalDescription(`
    <div id="mainContainer" style="display: flex; align-items: center; flex-direction: column;">

        <div class="damagedLaptops_section">

            <div>
                <h2 class="damagedLaptops_h2">Laptop poleasingowy ${model}</h2>
                <div class="damagedLaptops_text_container">

                    <p class="damagedLaptops_p">
                        ✅ Przedmiotem aukcji jest laptop poleasingowy marki ${marka} model ${model}. Laptop używany,
                        ✅ Przedmiotem aukcji jest laptop poleasingowy marki ${marka} model ${model}. Laptop używany,
                        stan
                        jak na zdjęciach, ${visualConditionDescription} <br><br>

                        ❗<b data-omit="${biosOK}">Laptop został przetestowany tylko i wyłącznie wejściem do biosu. Laptop wchodzi do
                            BIOS-u❗, </b>
                            <b data-omit="${biosX}">Laptop nie uruchamia się, </b>
                            nie posiada zainstalowanego systemu.

                        <br>
                        Laptop sprzedawany bez ładowarki, stan baterii - ${battery}
                        <br><br>
                        <b>Galeria zawiera realne zdjęcia sprzedawanego produktu, każdy laptop jest
                            fotografowany osobno!</b>
                    <p class="damagedLaptops_p">Specyfikacja:</p>
                    <ul class="damagedLaptops_ul">
                        <li>Procesor: ${cpu}</li>
                        <li>Pamięć RAM: ${ram}</li>
                        <li>Dysk twardy ${disk}</li>
                        <li>Karta graficzna: ${gpu}</li>
                        <li>Ekran: ${screen}</li>
                        <li>Bateria: ${battery}</li>
                    </ul>
                </div>
            </div>
        </div>

    </div>

    <style>
        * {
            font-family: "Poppins", serif;
            font-style: normal;
        }

        .damagedLaptops_h2 {
            color: #313131;
            font-size: 30px;
            margin-top: 10px;
            margin-bottom: 5px;
            font-weight: 400;
        }

        .damagedLaptops_p {
            font-size: 20px;
            line-height: 1.5;
            color: #313131;
        }

        .damagedLaptops_ul {
            font-size: 16px;
            line-height: 2;
            margin-left: 2rem;
            color: #717171;
        }

        @media (max-width: 600px) {
            .damagedLaptops_section {
                display: flex;
                flex-direction: column;
                margin-left: 10px;
                margin-right: 10px;
            }

        }
    </style>
`)
