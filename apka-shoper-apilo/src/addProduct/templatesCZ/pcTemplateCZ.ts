import { renderAdditionalFeatureItems } from "../additionalFeatures";
import { getAioStandDescription } from "../aioStand";
import { isPcPortGroups, renderPcPortGridRows, type PcPortGroups } from "../pcPortGroups";

export const pcTemplateCZ = (
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
    ports: string[] | PcPortGroups,
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
    wifi: string,
    extraFeatures = "",
    aioStand = ""
) => `
<div id="mainContainer" style="display: flex !important; align-items: center !important; flex-direction: column !important;">

    <div class="poleasingowe_section">
            <div>
                <img  onerror="this.onerror=null; this.src='../desktop.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/desktop.png" class="desktop_logo">
            </div>
            <div>
                <h2 class="poleasingowe_h2">${title}</h2>
                <div class="poleasingowe_text_container">
                                ${system !== 'brak systemu'
        ? /home assistant/i.test(system)
            ? `<p class="poleasingowe_p">Počítač má nainstalovaný systém Home Assistant OS (HAOS), připravený k další konfiguraci uživatelem.</p>`
            : `                    <p class="poleasingowe_p" > Počítač má originální systém ${system} 64bit v české jazykové verzi, s nejnovějšími ovladači a dodatečným internetovým prohlížečem. Po vybalení z krabice je připraven k použití.<br></p>`
        : ""}

                                <div class="pc_spec_box">
                                    <h3 class="pc_spec_title">Nejdůležitější informace</h3>

                                    <div class="pc_spec_tags">
                                        <span class="pc_spec_tag">${cpu}-${cpuModel}</span>
                                        <span class="pc_spec_tag">${ramType} ${ramAmount}</span>
                                        <span class="pc_spec_tag">${diskType} ${diskCapacity} GB</span>
                                        <span class="pc_spec_tag">${system}</span>
                                    </div> 

                                    <dl class="pc_spec_grid">
                                        ${additionalInfo ? `<dt>Uwagi</dt><dd>${additionalInfo}</dd> ` : ""}
<dt>Stav</dt><dd>${condition}</dd>
<dt>Vizuální stav</dt><dd>${grade}</dd>
<dt>Typ skříně</dt><dd>${caseType}</dd>
<dt>Procesor</dt><dd>${cpu}-${cpuModel}</dd>
<dt>Grafická karta</dt><dd>${gpu}</dd>
<dt>Disk</dt><dd>${diskType} ${diskCapacity} GB</dd>
<dt>V balení</dt><dd>${included}</dd>
<dt>Operační systém</dt><dd>${system}</dd>
<dt>Operační paměť RAM</dt><dd>${ramAmount} ${ramType}</dd>
<dt>Optická mechanika</dt><dd>${dvd}</dd>
${wifi ? `<dt>Wi-Fi</dt><dd>ano</dd>` : ""}

                                        

                                        <div class="pc_spec_divider"></div>

                                        ${isPcPortGroups(ports)
                                            ? renderPcPortGridRows(ports, {
                                                casePorts: "Konektory skříně",
                                                motherboardPorts: "Konektory základní desky",
                                                gpuPorts: "Konektory grafické karty",
                                            })
                                            : ports?.length ? `<dt>Porty</dt><dd><div class="pc_spec_chips">${ports.filter(Boolean).map(p => `<span class="pc_spec_chip">${p}</span>`).join('')}</div></dd>` : ""}
                                    </dl>
                                </div>
                                ${extraFeatures.trim() ? `<div class="pc_extra_features"><h3 class="pc_spec_title">Další vlastnosti</h3><ul>${renderAdditionalFeatureItems(extraFeatures)}</ul></div>` : ""}
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
        <h2 class="poleasingowe_h2">All-in-One – Kompaktní styl a výkon v jednom zařízení</h2>
        <div class="poleasingowe_text_container">
            <p class="poleasingowe_p" style="color: #313131 !important;">
                Počítač All-in-One je kompaktní řešení, které spojuje centrální jednotku a monitor v jednom zařízení. Díky tomu zabírá méně místa na stole, nabízí estetický vzhled a snadnější správu kabelů. Ideální pro kancelářskou práci, studium a každodenní použití doma.<br>
            </p>
            <p class="poleasingowe_p" style="color: #313131 !important;">Specifikace konstrukce AIO:</p>
            <ul class="poleasingowe_ul">
                ${getAioStandDescription(aioStand, 'cz') ? `<li><b class="poleasingowe_b">Stojan AIO:</b> ${getAioStandDescription(aioStand, 'cz')}</li>` : ""}
                <li><b class="poleasingowe_b">Rozlišení:</b> ${resolution}</li>
                <li><b class="poleasingowe_b">Typ panelu:</b> ${matrixType}</li>
                <li><b class="poleasingowe_b">Velikost obrazovky:</b> ${matrixSize}</li>
                <li><b class="poleasingowe_b">Obnovovací frekvence:</b> ${Frequency}</li>
                <li><b class="poleasingowe_b">Dotyková obrazovka:</b> ${touchScreen}</li>
                <li><b class="poleasingowe_b">Mikrofon:</b> ${microphone}</li>
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
        <h3 class="poleasingowe_h3">Paměť RAM ${ramAmount} ${ramType}</h3>
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


    <style>
        * {
            font-family: "Poppins", serif;
            font-style: normal;
        }

                .pc_spec_box {
            border-radius: 12px;
            padding: 20px 0px;
            color: #313131;
        }

        .pc_spec_title {
            margin: 0 0 30px;
            font-weight: 600;
            font-size: 20px;
        }

        .pc_spec_tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 0 0 12px;
        }

        .pc_spec_tag {
            padding: 6px 15px;
            border-radius: 999px;
            background: #89b5bb;
            font-weight: 600;
            font-size: 14px;
            color: white;
        }

        .pc_spec_grid {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 8px 16px;
        }

        .pc_spec_grid dt {
            margin: 0;
            font-weight: 600;
        }

        .pc_spec_grid dd {
            margin: 0;
            color: #494949;
        }

        .pc_spec_divider {
            grid-column: 1 / -1;
            height: 1px;
            background: #eee;
            margin: 4px 0;
        }

        .pc_extra_features {
            border-top: 1px solid #eee;
            margin-top: 16px;
            padding-top: 16px;
            color: #494949;
        }

        .pc_extra_features .pc_spec_title {
            margin-bottom: 10px;
        }

        .pc_extra_features ul {
            margin: 0;
            padding-left: 22px;
            font-size: 16px;
            line-height: 1.6;
        }

        .pc_extra_features li + li {
            margin-top: 6px;
        }

        .pc_spec_chips {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .pc_spec_chip {
            padding: 4px 8px;
            border-radius: 8px;
            background: #f7f7f7;
            font-size: 14px;
        }

        @media (max-width:640px) {
            .pc_spec_grid {
                grid-template-columns: 1fr;
            }
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
`
