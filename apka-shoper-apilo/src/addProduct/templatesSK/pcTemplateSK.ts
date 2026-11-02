import { renderConditionalDescription } from "../templates/renderConditionalDescription";
import { renderAdditionalFeatureItems } from "../additionalFeatures";
import { getAioStandDescription } from "../aioStand";
import { isPcPortGroups, renderPcPortListItems, type PcPortGroups } from "../pcPortGroups";

export const pcTemplateSK = (
    title: string,
    grade: string,
    cpu: string,
    cpuModel: string,
    condition: string,
    caseType: string,
    gpu: string,
    diskType: string,
    diskCapacity: string,
    system: string,
    ramAmount: string,
    ramType: string,
    dvd: string,
    ports: string | PcPortGroups,
    additionalInfo: string,
    cpuTypesDescriptions: string,
    ramTypesDescriptions: string,
    diskTypesDescriptions: string,
    systemDescriptions: string,
    included: string,
    imgSrc: string,
    desktopStatus: string,
    gpuDescriptions: string,
    resolution: string,
    matrixType: string,
    matrixSize: string,
    Frequency: string,
    touchScreen: string,
    microphone: string,
    camera: string,
    extraFeatures = "",
    aioStand = ""
) => renderConditionalDescription(`
<div id="mainContainer" style="display: flex !important; align-items: center !important; flex-direction: column !important;">
<div class="poleasingowe_section">
    <div>
        <img onerror="this.onerror=null; this.src='../desktop.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/desktop.png" class="desktop_logo">
    </div>
    <div>
        <h2 class="poleasingowe_h2">${title}</h2>
        <div class="poleasingowe_text_container">
                ${system !== 'brak systemu'
        ? /home assistant/i.test(system)
            ? `<p class="poleasingowe_p">Počítač má nainštalovaný systém Home Assistant OS (HAOS), pripravený na ďalšiu konfiguráciu používateľom.</p>`
            : `
            <p class="poleasingowe_p system_${system}" style="color: #313131 !important;">
                Počítač má originálny systém ${system} 64bit v slovenskom jazykovom rozhraní, s najnovšími ovládačmi a doplnkovým internetovým prehliadačom. Po vybalení z krabice je pripravený na použitie.<br>
            </p>
            ` : ""}
                ${additionalInfo
        ? `
            <div class="poleasingowe_text_container">
                <p class="poleasingowe_p" style="color: #313131 !important;">poznámky:</p>
                <ul class="poleasingowe_ul">
                    <b class="poleasingowe_b">${additionalInfo}</b>
                </ul>
            </div>
                 `: ""}
            <p class="poleasingowe_p" style="color: #313131 !important;">Špecifikácia:</p>
            <ul class="poleasingowe_ul">
                <li><b class="poleasingowe_b">Stav:</b> ${condition}</li>
                <li>${grade}</li>
                <li><b class="poleasingowe_b">Typ skrine:</b> ${caseType}</li>
                <li><b class="poleasingowe_b">Procesor:</b> ${cpu}-${cpuModel}</li>
                <li><b class="poleasingowe_b">Grafická karta:</b> ${gpu}</li>
                                ${diskType !== 'brak dysku'
        ? `<li><b class="poleasingowe_b">Disk:</b> ${diskType} ${diskCapacity} GB</li>`
        : ""}
                <li><b class="poleasingowe_b">Súčasť balenia:</b> ${included}</li>
                                ${system !== 'brak systemu'
        ? `<li><b class="poleasingowe_b">Systém:</b> ${system}</li>`
        : ""}
                <li><b class="poleasingowe_b">Pamäť:</b> ${ramAmount} ${ramType}</li>
                <li><b class="poleasingowe_b">Mechanika:</b> ${dvd}</li>
                ${isPcPortGroups(ports)
                    ? renderPcPortListItems(ports, {
                        casePorts: "Konektory skrine",
                        motherboardPorts: "Konektory základnej dosky",
                        gpuPorts: "Konektory grafickej karty",
                    })
                    : ports ? `<li><b class="poleasingowe_b">Porty:</b> ${ports}</li>` : ""}
            </ul>
            ${extraFeatures.trim() ? `<div class="pc_extra_features"><h3 class="poleasingowe_h3">Ďalšie vlastnosti</h3><ul class="poleasingowe_ul">${renderAdditionalFeatureItems(extraFeatures)}</ul></div>` : ""}
        </div>
    </div>
</div>
        ${caseType == 'All in One'
        ? `  
<div class="poleasingowe_section  poleasingoweCaseType_${caseType}">
    <div>
        <img onerror="this.onerror=null; this.src='../aio.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/aio.png" class="aio_logo">
    </div>
    <div>
        <h2 class="poleasingowe_h2">All-in-One – Kompaktný štýl a výkon v jednom zariadení</h2>
        <div class="poleasingowe_text_container">
            <p class="poleasingowe_p" style="color: #313131 !important;">
                Počítač All-in-One je kompaktné riešenie, ktoré spája centrálnu jednotku a monitor do jedného zariadenia. Vďaka tomu zaberá menej miesta na stole, ponúka estetický vzhľad a jednoduchšiu správu káblov. Ideálny na kancelársku prácu, štúdium a každodenné použitie doma.<br>
            </p>
            <p class="poleasingowe_p" style="color: #313131 !important;">Špecifikácia konštrukcie AIO:</p>
            <ul class="poleasingowe_ul">
                ${getAioStandDescription(aioStand, 'sk') ? `<li><b class="poleasingowe_b">Stojan AIO:</b> ${getAioStandDescription(aioStand, 'sk')}</li>` : ""}
                <li><b class="poleasingowe_b">Rozlíšenie:</b> ${resolution}</li>
                <li><b class="poleasingowe_b">Typ panela:</b> ${matrixType}</li>
                <li><b class="poleasingowe_b">Veľkosť obrazovky:</b> ${matrixSize}</li>
                <li><b class="poleasingowe_b">Obnovovacia frekvencia:</b> ${Frequency}</li>
                <li><b class="poleasingowe_b">Dotyková obrazovka:</b> ${touchScreen}</li>
                <li><b class="poleasingowe_b">Mikrofón:</b> ${microphone}</li>
                <li><b class="poleasingowe_b">Webkamera:</b> ${camera}</li>
            </ul>
        </div>
    </div>
</div>
       ` : ""
    }
<div id="poleasingowe_photo_container">
    <img src="${imgSrc}">
</div>

<div class="poleasingowe_section2">
    <div class="poleasingowe_boxes">
        <img onerror="this.onerror=null; this.src='../cpu.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/cpu.png" alt="cpu" class="poleasingowe_icon">
        <h3 class="poleasingowe_h3">Procesor ${cpu}-${cpuModel}</h3>
        <p class="poleasingowe_p2">
            ${cpuTypesDescriptions}
        </p>
    </div>
    <div class="poleasingowe_boxes">
        <img onerror="this.onerror=null; this.src='../ram.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ram.png" alt="cpu" class="poleasingowe_icon">
        <h3 class="poleasingowe_h3">Pamäť RAM ${ramAmount} ${ramType}</h3>
        <p class="poleasingowe_p2">
            ${ramTypesDescriptions}
        </p>
    </div>
            ${diskType !== 'brak dysku'
        ? `
    <div class="poleasingowe_boxes disk_${diskType}">
        <img onerror="this.onerror=null; this.src='../drive.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/drive.png" alt="cpu" class="poleasingowe_icon">
        <h3 class="poleasingowe_h3">Disk ${diskType} ${diskCapacity}</h3>
        <p class="poleasingowe_p2">
            ${diskTypesDescriptions}
        </p>
    </div>
                `
        : ""
    }
    <div class="poleasingowe_boxes">
        <img onerror="this.onerror=null; this.src='../cart.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/cart.png" class="poleasingowe_icon">
        ${desktopStatus}
    </div>
    <div class="poleasingowe_boxes">
        <img onerror="this.onerror=null; this.src='../gpu.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/gpu.png" alt="cpu" class="poleasingowe_icon">
        <h3 class="poleasingowe_h3">Grafická karta ${gpu}</h3>
        <p class="poleasingowe_p2">
            ${gpuDescriptions}
        </p>
    </div>

            ${system !== 'brak systemu'
        ? `${systemDescriptions}`
        : ""}
</div>

</div>

    <style>
        * {
            font-family: "Poppins", serif;
            font-style: normal;
        }

        .poleasingowe_h3 {
            color: #313131;
            font-size: 20px;
            margin: 10px 0 0 0;
            font-weight: 410;
        }

        .poleasingowe_h2 {
            color: #313131;
            font-size: 30px;
            margin-top: 10px;
            margin-bottom: 5px;
            font-weight: 410;
        }

        .poleasingowe_p {
            font-size: 20px;
            line-height: 1.5;
            color: #717171;
        }

        .poleasingowe_p2 {
            font-size: 16px;
            line-height: 1.5;
            color: #494949;
            text-align: justify
        }

        .haos_notice {
            width: 100%;
            border-top: 1px solid #e3e3e3;
            margin-top: 20px;
            padding-top: 22px;
        }

        .haos_notice .poleasingowe_h3 {
            font-weight: 600;
            margin: 0 0 12px;
        }

        .haos_notice .poleasingowe_p2 {
            text-align: left;
            line-height: 1.6;
            margin: 0 0 10px;
        }

        .haos_notice .poleasingowe_p2:last-child {
            margin-bottom: 0;
        }

        .poleasingowe_ul {
            font-size: 16px;
            line-height: 2;
            margin-left: 2rem;
            color: #494949;
        }

        .pc_extra_features {
            border-top: 1px solid #eee;
            margin-top: 16px;
            padding-top: 16px;
        }

        .pc_extra_features .poleasingowe_h3 {
            font-weight: 600;
            margin: 0 0 10px;
        }

        .pc_extra_features .poleasingowe_ul {
            line-height: 1.6;
            margin-top: 0;
        }

        #poleasingowe_photo_container {
            margin-bottom: 20px;
            display: flex;
            width: 100%;
            /* max-width: 1200px; */
            justify-content: center;

        }

        .poleasingowe_text_container {
            display: flex;
            flex-direction: column;
            width: 100%;
            justify-content: center;
        }

        .poleasingowe_section {
            width: 100%;
            /* max-width: 1200px; */
            display: flex;
            flex-direction: row;
            margin: 10px 0 10px 0;
        }

        .windows_logo {
            height: 90px;
            margin-right: 50px;
            margin-top: 20px;
        }
        .desktop_logo{
            height: 90px;
            margin-right: 60px;
            margin-top: 20px;
        }
            .aio_logo{
            height: 90px;
            margin-right: 30px;
            margin-top: 20px;
            }

        .poleasingowe_boxes {
            width: 42%;
            background-color: #f7f7f7;
            padding: 30px;
            border-radius: 20px;
            flex-shrink: 0;
            flex-grow: 1;
        }

        .poleasingowe_section2 {
            /* max-width: 1200px; */
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            gap: 1rem;
        }

        .poleasingowe_photo {
            height: 450px;
            margin: auto;
        }

        .poleasingowe_icon {
            width: 60px;
        }

        .poleasingowe_b {
        color: #434343;
        }
        .warningText{
            color: #e07100;
            font-weight: 500;
        }

        @media (max-width: 600px) {
            .poleasingowe_section {
                display: flex;
                flex-direction: column;
                margin-left: 10px;
                margin-right: 10px;
            }

            .poleasingowe_section2 {
                margin-left: 10px;
                margin-right: 10px;
            }
        }
    </style>
`)
