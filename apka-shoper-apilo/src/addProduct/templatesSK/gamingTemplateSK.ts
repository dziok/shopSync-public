export const gamingTemplateSK = (
    cpuName: string,
    gpuName: string,
    mainBoardName: string,
    powerSupplyName: string,
    ramName: string,
    caseName: string,
    cpuCores: string,
    cpuThreeds: string,
    cpuMax: string,
    CasePorts: string,
    system: string,
    gpuDescription: string,
    cpuDescription: string,
    gpuSrc: string,
    cpuSrc: string,
    ramDescription: string,
    diskDescription: string,
    diskName: string,
    diskSrc: string,
    cpuSeries: string,
    gpuType: string,
    additionalInfo: string,
    components: string,
    rt: boolean,
    powerSupplyModel: string,
    ramModel: string,
    caseModel: string,
    cpuFanModel: string,
    set: string,
    disableGameGraphics = false

) => `
  <div class="g_mainContainer">
        <div class="g_bimg2">
<div class="g_header">
    <div>
        <h2 class="g_h2_header">HERNÝ POČÍTAČ</h2>
        <h3 class="g_h3">
            ${cpuSeries} ${cpuName} | ${gpuName} | ${ramName} | ${diskName} | ${system}
        </h3>
    </div>
    <p class="g_p1_header">Pripravená zostava pre hráča aj profesionála – výkon, modernosť, spoľahlivosť!</p>
</div>

        </div>
        ${!disableGameGraphics ? `<div class="g_gradientBox">
            <img class="g_gameImg" onerror="this.onerror=null; this.src='../gc1.svg';" src="/userdata/public/assets/gaming/gc1.svg" alt="game" style="width: 28%;"/>
            <img class="g_gameImg" onerror="this.onerror=null; this.src='../gc2.svg';" src="/userdata/public/assets/gaming/gc2.svg" alt="game" style="width: 21%;"/>
            <img class="g_gameImg" onerror="this.onerror=null; this.src='../gc3.svg';" src="/userdata/public/assets/gaming/gc3.svg" alt="game" style="width: 28%;"/>
            <img class="g_gameImg" onerror="this.onerror=null; this.src='../gc4.svg';" src="/userdata/public/assets/gaming/gc4.svg" alt="game" style="width: 20%;"/>
        </div>` : ""}

        <div class="g_specBox2">
            <div class="g_specBox2_c">
<div class="g_specBoxTextContainer_2">
    <h3 class="g_h3_2">Kľúčové Vlastnosti</h3>
    <ul class="g_p2">
        ${additionalInfo ? `<li>${additionalInfo}</li>` : ""}
        <li>Porty skrinky: ${CasePorts}</li>
        <li>Počítač je plne pripravený na používanie hneď po vybalení</li>
        <li>Počítač bol zostavený z komponentov: ${components}</li>
        <li>Každý kus je pred odoslaním dôkladne testovaný v záťaži, aby sa zabezpečila stabilita a spoľahlivosť prevádzky.</li>
    </ul>
</div>

                <div class="g_specBoxImgContainer2">
                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_cpu.svg';" src="/userdata/public/assets/gaming/g_cpu.svg" alt="cpu" />
                        </div>
                        <p class="g_specText1">Procesor</p>
                        <p class="g_specText2">${cpuSeries} ${cpuName}</p>
                    </div>

                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_gpu.svg';" src="/userdata/public/assets/gaming/g_gpu.svg" alt="gpu" />
                        </div>
                       <p class="g_specText1">Grafická karta</p>
                        <p class="g_specText2">${gpuName}</p>
                    </div>

                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_mb.svg';" src="/userdata/public/assets/gaming/g_mb.svg" alt="płyta główna" />
                        </div>
                        <p class="g_specText1">Základná doska</p>
                        <p class="g_specText2">${mainBoardName}</p>
                    </div>

                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_ps.svg';" src="/userdata/public/assets/gaming/g_ps.svg" alt="zasilacz" />
                        </div>
                        <p class="g_specText1">Zdroj</p>
                        <p class="g_specText2">${powerSupplyModel} ${powerSupplyName}W </p>
                    </div>

                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_ram.svg';" src="/userdata/public/assets/gaming/g_ram.svg" alt="ram" />
                        </div>
                        <p class="g_specText1">RAM pamäť</p>
                        <p class="g_specText2">${ramModel} ${ramName}</p>
                    </div>
                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_case.svg';" src="/userdata/public/assets/gaming/g_case.svg" alt="obudowa" />
                        </div>
                        <span class="g_specText1">Skrinka</span>
                        <span class="g_specText2">${caseModel} ${caseName}</span>
                    </div>
                            ${cpuFanModel ? ` 
                                <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_fan.svg';" src="/userdata/public/assets/gaming/g_fan.svg" alt="radiator CPU" />
                        </div>
                        <p class="g_specText1">Chladič CPU</p>
                        <p class="g_specText2">${cpuFanModel}</p>
                    </div>` : ""}

                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_system.svg';" src="/userdata/public/assets/gaming/g_system.svg" alt="system" />
                        </div>
                        <span class="g_specText1">Operačný systém</span>
                        <span class="g_specText2">${system}</span>
                    </div>

                </div>
            </div>
            <div class="g_img_tr">
                <svg xmlns="http://www.w3.org/2000/svg" width="192" height="27" viewBox="0 0 192 27">
                    <g fill="#e6e6e6">
                        <polygon points="0,0 27,13.5 0,27" />
                        <polygon points="32,0 59,13.5 32,27" />
                        <polygon points="64,0 91,13.5 64,27" />
                        <polygon points="96,0 123,13.5 96,27" />
                        <polygon points="128,0 155,13.5 128,27" />
                        <polygon points="160,0 187,13.5 160,27" />
                    </g>
                </svg>
            </div>
        </div>
        <div class="g_specBox3">
            <div class="g_specBoxTextContainer_2">
                <h3 class="g_h3_3">Grafická karta ${gpuName}</h3>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" viewBox="0 0 192 27">
                        <g fill="#555">
                            <polygon points="0,0 27,13.5 0,27"></polygon>
                            <polygon points="32,0 59,13.5 32,27"></polygon>
                            <polygon points="64,0 91,13.5 64,27"></polygon>
                            <polygon points="96,0 123,13.5 96,27"></polygon>
                            <polygon points="128,0 155,13.5 128,27"></polygon>
                            <polygon points="160,0 187,13.5 160,27"></polygon>
                        </g>
                    </svg>
                </div>
                <p class="g_p3">
                    ${gpuDescription}
                </p>
            </div>
            <div class="g_specBoxImgContainer3">
                <img class="g_specImg g_SpecImgMain" onerror="this.onerror=null; this.src='../${gpuSrc}.png';" src="/userdata/public/assets/gaming/${gpuSrc}.png" alt="gpu" />
            </div>
        </div>


        <div class="g_specBox1">
            <div class="g_specBoxImgContainer_dark">
                <img class="g_specImg_dark"  onerror="this.onerror=null; this.src='../${cpuSrc}.png';" src="/userdata/public/assets/gaming/${cpuSrc}.png" alt="cpu" />
            </div>
            <div class="g_specBoxTextContainer_2">
                <h3 class="g_h3_2">${cpuSeries} ${cpuName}</h3>

                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" viewBox="0 0 192 27">
                        <g fill="#6b6d6bff">
                            <polygon points="0,0 27,13.5 0,27"></polygon>
                            <polygon points="32,0 59,13.5 32,27"></polygon>
                            <polygon points="64,0 91,13.5 64,27"></polygon>
                            <polygon points="96,0 123,13.5 96,27"></polygon>
                            <polygon points="128,0 155,13.5 128,27"></polygon>
                            <polygon points="160,0 187,13.5 160,27"></polygon>
                        </g>
                    </svg>

                </div>
                <p class="g_p2">
                    ${cpuDescription}
                </p>
                <div class="g_specDetails">
<div class="g_spec_h3"> <b class="g_spec_b"> ${cpuCores} </b> <p class="g_spec_p"> Jadrá</p></div>
<div class="g_spec_h3"> <b class="g_spec_b"> ${cpuThreeds} </b> <p class="g_spec_p"> Vlákna</p></div>
<div class="g_spec_h3"> <b class="g_spec_b"> ${cpuMax} GHz</b> <p class="g_spec_p"> Turbo frekvencia</p></div>

                </div>
            </div>
        </div>

        <div class="g_specBox3">
            <div class="g_specBoxTextContainer_2">
                <h3 class="g_h3_3">RAM pamäť ${ramName}</h3>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" viewBox="0 0 192 27">
                        <g fill="#555">
                            <polygon points="0,0 27,13.5 0,27"></polygon>
                            <polygon points="32,0 59,13.5 32,27"></polygon>
                            <polygon points="64,0 91,13.5 64,27"></polygon>
                            <polygon points="96,0 123,13.5 96,27"></polygon>
                            <polygon points="128,0 155,13.5 128,27"></polygon>
                            <polygon points="160,0 187,13.5 160,27"></polygon>
                        </g>
                    </svg>
                </div>
                <p class="g_p3">
                    ${ramDescription}
                </p>

            </div>
            <div class="g_specBoxImgContainer3">
                <img class="g_specImg g_SpecImgMain"  onerror="this.onerror=null; this.src='../g_r2.svg';" src="/userdata/public/assets/gaming/g_r2.png" alt="ram" />
            </div>
        </div>

        <div class="g_specBox1b">
            <div class="g_specBoxImgContainer_dark">

                <img class="g_specImg_dark g_SpecImgMain"  onerror="this.onerror=null; this.src='../${diskSrc}.png';" src="/userdata/public/assets/gaming/${diskSrc}.png" alt="disk" />
            </div>
            <div class="g_specBoxTextContainer_2">
                <h3 class="g_h3_2">Disk ${diskName} GB</h3>

                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" viewBox="0 0 192 27">
                        <g fill="#6b6d6bff">
                            <polygon points="0,0 27,13.5 0,27"></polygon>
                            <polygon points="32,0 59,13.5 32,27"></polygon>
                            <polygon points="64,0 91,13.5 64,27"></polygon>
                            <polygon points="96,0 123,13.5 96,27"></polygon>
                            <polygon points="128,0 155,13.5 128,27"></polygon>
                            <polygon points="160,0 187,13.5 160,27"></polygon>
                        </g>
                    </svg>

                </div>
                <p class="g_p2">
                    ${diskDescription}
                </p>
            </div>
        </div>
        ${!disableGameGraphics ? `<div class="g_gradientBox">
            <img class="g_gameImg" onerror="this.onerror=null; this.src='../gc1.svg';" src="/userdata/public/assets/gaming/gc1.svg" alt="game" style="width: 28%;"/>
            <img class="g_gameImg" onerror="this.onerror=null; this.src='../gc2.svg';" src="/userdata/public/assets/gaming/gc2.svg" alt="game" style="width: 21%;"/>
            <img class="g_gameImg" onerror="this.onerror=null; this.src='../gc3.svg';" src="/userdata/public/assets/gaming/gc3.svg" alt="game" style="width: 28%;"/>
            <img class="g_gameImg" onerror="this.onerror=null; this.src='../gc4.svg';" src="/userdata/public/assets/gaming/gc4.svg" alt="game" style="width: 20%;"/>
        </div>` : ""}

                            
                ${set === "drogi" ? `
        <div class="g_specBox1b_monitor">
            <div class="g_specBoxImgContainer_dark_monitor">
                <img class="g_specImg_dark_monitor g_SpecImgMain"  onerror="this.onerror=null; this.src='../g_monitor.png';" src="/userdata/public/assets/gaming/g_monitor.png" alt="monitor" />
            </div>
            <div class="g_specBoxTextContainer_2_monitor">
                <h3 class="g_h3_2">Monitor Acer 24" 75 HZ Full HD</h3>

                <div>
                    <img class=" g_kr_lightGray"  onerror="this.onerror=null; this.src='../g_kr2.svg';" src="/userdata/public/assets/gaming/g_kr2.svg"  />
                </div>
                <p class="g_p2">
                   Monitor Acer, ktorý je súčasťou zostavy, je vynikajúcou voľbou nielen na hranie hier. Vďaka 24-palcovej obrazovke a obnovovacej frekvencii 75 Hz poskytuje plynulý obraz a minimálne vstupné oneskorenie – ideálne sa hodí na strieľačky, pretekárske hry a rýchle akčné tituly. Ultra rýchly čas odozvy 1 ms spôsobí, že sa čas zastaví, takže si môžete vychutnať krásny obraz bez rozmazania pohybu a šmúh.
                </p>
            </div>
        </div>


<div class="g_setContainer">
    <div class="g_setMouse g_set"> 
        <div class="g_setImgBox">
            <img class="g_setImg" onerror="this.onerror=null; this.src='../g_mouseSet_d.png';" src="/userdata/public/assets/gaming/g_mouseSet_d.png" alt="mouse" />
        </div>
        <h3 class="g_h3_3 g_set_h3">Myš BLOODY ES7RGB</h3>
        <p class="g_p3 g_set_p">
            Myš A4TECH BLOODY ES7 RGB Esports Stone Black USB ponúka 5-úrovňové nastavenie CPI (1000–6000) s možnosťou personalizácie v softvéri. Umožňuje prispôsobiť citlivosť, rýchlosť kurzora a zrýchlenie pre hry, grafickú prácu alebo dizajn. Vybavená podsvietením RGB so 16,8 milióna farieb. Podložka s rozmermi 25 × 28 × 0,3 cm s pogumovanou spodnou stranou je nevyhnutná pre ešte lepšiu kontrolu nad myšou.
        </p>
    </div>  
    <div class="g_vl_container">
        <img class="g_vl" onerror="this.onerror=null; this.src='../g_vl.png';" src="/userdata/public/assets/gaming/g_vl.png" />
    </div>  
    <div class="g_setKeyboard g_set">
        <div class="g_setImgBox">
            <img class="g_setImg" onerror="this.onerror=null; this.src='../g_keyboard_d.png';" src="/userdata/public/assets/gaming/g_keyboard_d.png" alt="keyboard" />
        </div>
        <h3 class="g_h3_3 g_set_h3">Klávesnica Bloody B140N</h3>
        <p class="g_p3 g_set_p">
            Plnohodnotná membránová klávesnica s podsvietením RGB Neon, špeciálnymi klávesmi WASD a funkciou Anti-ghosting zabezpečuje maximálnu kontrolu v hrách. Reakčný čas 1 ms a frekvencia 1000 Hz garantujú bleskovú odozvu a herný režim blokuje kláves Windows. Odolná, pohodlná a pripravená na intenzívne hranie.
        </p>
    </div>    
    <div class="g_vl_container">
        <img class="g_vl" onerror="this.onerror=null; this.src='../g_vl.png';" src="/userdata/public/assets/gaming/g_vl.png" />
    </div>  
    <div class="g_setHeadphones g_set">
        <div class="g_setImgBox">
            <img class="g_setImg" onerror="this.onerror=null; this.src='../g_headphones_d.png';" src="/userdata/public/assets/gaming/g_headphones_d.png" alt="headphones" />
        </div>
        <h3 class="g_h3_3 g_set_h3">Slúchadlá Tracer GameZone GZ X1</h3>
        <p class="g_p3 g_set_p">
            Tracer GameZone GZ X1 sú herné slúchadlá s meničmi 50 mm, podsvietením RGB a pružným hlavovým mostom, poskytujúce silný zvuk a pohodlie. Sú vybavené mikrofónom, ovládaním hlasitosti a 1,9 m dlhým káblom s konektorom Mini Jack 3,5 mm a sú kompatibilné s počítačmi, konzolami a ďalšími zariadeniami.
        </p>
    </div>                
</div>

            ` : ''}

                       ${set === "tani" ? `
        <div class="g_specBox1b_monitor">
            <div class="g_specBoxImgContainer_dark_monitor">
                <img class="g_specImg_dark_monitor g_SpecImgMain"  onerror="this.onerror=null; this.src='../g_monitor.png';" src="/userdata/public/assets/gaming/g_monitor.png" alt="monitor" />
            </div>
            <div class="g_specBoxTextContainer_2_monitor">
                <h3 class="g_h3_2">Monitor Acer 24" 75 HZ Full HD</h3>

                <div>
                    <img class=" g_kr_lightGray"  onerror="this.onerror=null; this.src='../g_kr2.svg';" src="/userdata/public/assets/gaming/g_kr2.svg"  />
                </div>
                <p class="g_p2">
                   Monitor Acer, ktorý je súčasťou zostavy, je vynikajúcou voľbou nielen na hranie hier. Vďaka 24-palcovej obrazovke a obnovovacej frekvencii 75 Hz poskytuje plynulý obraz a minimálne vstupné oneskorenie – ideálne sa hodí na strieľačky, pretekárske hry a rýchle akčné tituly. Ultra rýchly čas odozvy 1 ms spôsobí, že sa čas zastaví, takže si môžete vychutnať krásny obraz bez rozmazania pohybu a šmúh.
                </p>
            </div>
        </div>

<div class="g_setContainer">
    <div class="g_setMouse g_set"> 
        <div class="g_setImgBox">
            <img class="g_setImg" onerror="this.onerror=null; this.src='../g_mouseSet_t.png';" src="/userdata/public/assets/gaming/g_mouseSet_d.png" alt="mouse" />
        </div>
        <h3 class="g_h3_3 g_set_h3">Myš Tracer Boost</h3>
        <p class="g_p3 g_set_p">
            Myš Tracer Boost je presný nástroj pre každého hráča. Rozlíšenie až 1600 DPI zaručuje rýchle a presné reakcie, štyri tlačidlá a koliesko umožňujú intuitívne ovládanie. Farebné podsvietenie dodáva dynamický vzhľad a ergonomický tvar zaisťuje pohodlie aj pri dlhom hraní. Súčasťou balenia je aj podložka A4Tech XGame X7-200MP s rozmermi 250×200×3 mm s pogumovanou protišmykovou spodnou stranou a hladkým textilným povrchom, ktorá zlepšuje kontrolu pohybu myši a zvyšuje presnosť v hrách.
        </p>
    </div>  
    <div class="g_vl_container">
        <img class="g_vl" onerror="this.onerror=null; this.src='../g_vl.png';" src="/userdata/public/assets/gaming/g_vl.png" />
    </div>  
    <div class="g_setKeyboard g_set">
        <div class="g_setImgBox">
            <img class="g_setImg" onerror="this.onerror=null; this.src='../g_keyboard_t.png';" src="/userdata/public/assets/gaming/g_keyboard_d.png" alt="keyboard" />
        </div>
        <h3 class="g_h3_3 g_set_h3">Klávesnica Tracer Boost</h3>
        <p class="g_p3 g_set_p">
            Klávesnica Tracer Boost spája funkčnosť a moderný dizajn vytvorený pre hráčov. Efektné farebné podsvietenie s viacerými režimami dodáva hernému pracovišťu jedinečný charakter a osem multimediálnych kláves umožňuje rýchlo ovládať hudbu, hlasitosť a ďalšie funkcie bez prerušenia hry. Ergonomický tvar a pevná konštrukcia zaisťujú pohodlie a odolnosť aj pri dlhých herných seansách.
        </p>
    </div>    
    <div class="g_vl_container">
        <img class="g_vl" onerror="this.onerror=null; this.src='../g_vl.png';" src="/userdata/public/assets/gaming/g_vl.png" />
    </div>  
    <div class="g_setHeadphones g_set">
        <div class="g_setImgBox">
            <img class="g_setImg" onerror="this.onerror=null; this.src='../g_headphones_t.png';" src="/userdata/public/assets/gaming/g_headphones_d.png" alt="headphones" />
        </div>
        <h3 class="g_h3_3 g_set_h3">Slúchadlá Tracer GAMEZONE GZ X3</h3>
        <p class="g_p3 g_set_p">
            Tracer GAMEZONE GZ X3 sú ľahké a pohodlné slúchadlá s meničmi 40 mm, ponúkajúce čistý zvuk, silné basy a dobrú izoláciu od okolia. Podsvietenie RGB LED „flow“ podčiarkuje herný štýl, mäkké náušníky a polstrovaný hlavový most zaisťujú komfort. Skladací mikrofón umožňuje jasnú komunikáciu a konektor mini-jack 3,5 mm zaručuje širokú kompatibilitu.
        </p>
    </div>                
</div>

                ` : ''}


 ${rt ? `        <div class="g_rayTracingBox">
            <div class="g_top2">
                <div>
                    <h2 class="g_h2">RAY TRACING</h2>
                </div>
                <p class="g_p1">
Ray tracing je moderná technológia vykresľovania obrazu, ktorá si získala veľkú obľubu medzi hráčmi a tvorcami grafiky. Spočíva v sledovaní lúčov svetla spôsobom podobným reálnemu svetu, čo umožňuje dosiahnuť mimoriadne realistické svetelné efekty, tiene a odrazy. Vďaka vernej simulácii fyzikálnych zákonov zvyšuje ray tracing kvalitu grafiky na filmovú úroveň a dodáva hrám a vizuálnym aplikáciám výnimočnú hĺbku a detailnosť – bez kompromisov v plynulosti chodu.
                </p>
            </div>
        </div>
        <div class="g_gradientBox" style="
            height: 10px;
            padding: 0;">
        </div>
        ` : ""}
    
  ${system?.includes("Windows 11") ? `
    <div class="g_specBox1c">
      <div class="g_specBoxTextContainer_2">
        <h3 class="g_h3_2">${system}</h3>
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" viewBox="0 0 192 27">
            <g fill="#6b6d6bff">
              <polygon points="0,0 27,13.5 0,27"></polygon>
              <polygon points="32,0 59,13.5 32,27"></polygon>
              <polygon points="64,0 91,13.5 64,27"></polygon>
              <polygon points="96,0 123,13.5 96,27"></polygon>
              <polygon points="128,0 155,13.5 128,27"></polygon>
              <polygon points="160,0 187,13.5 160,27"></polygon>
            </g>
          </svg>
        </div>
        <ul class="g_p2">
          <li>Nowoczesny wygląd i intuicyjny interfejs</li>
          <li>Większa szybkość działania systemu</li>
          <li>Lepsze wsparcie dla gier (DirectStorage, AutoHDR)</li>
          <li>Zwiększone bezpieczeństwo i ochrona danych</li>
          <li>Obsługa najnowszych procesorów i technologii</li>
          <li>Wygodne funkcje wielozadaniowości (Snap Layouts)</li>
          <li>Microsoft Store z większą liczbą aplikacji</li>
        </ul>
      </div>
      <div class="g_specBoxImgContainer_dark_b">
        <img class="g_specImg_win" onerror="this.onerror=null; this.src='../win11.png';" src="/userdata/public/assets/gaming/win11.png" alt="windows" />
      </div>
    </div>
  ` : ''}

    ${system?.includes("Windows 10") ? `
        <div class="g_specBox1c">
            <div class="g_specBoxTextContainer_2">
                <h3 class="g_h3_2">${system}</h3>

                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" viewBox="0 0 192 27">
                        <g fill="#6b6d6bff">
                            <polygon points="0,0 27,13.5 0,27"></polygon>
                            <polygon points="32,0 59,13.5 32,27"></polygon>
                            <polygon points="64,0 91,13.5 64,27"></polygon>
                            <polygon points="96,0 123,13.5 96,27"></polygon>
                            <polygon points="128,0 155,13.5 128,27"></polygon>
                            <polygon points="160,0 187,13.5 160,27"></polygon>
                        </g>
                    </svg>

                </div>
                <ul class="g_p2">
                    <li>Nowoczesny i przejrzysty interfejs użytkownika</li>
                    <li>Wysoka wydajność i optymalizacja działania</li>
                    <li>Duża zgodność z aplikacjami i grami</li>
                    <li>Regularne aktualizacje bezpieczeństwa</li>
                    <li>Wbudowany Windows Defender chroniący przed zagrożeniami</li>
                    <li>Wsparcie dla ekranów dotykowych i tabletów</li>
                    <li>Integracja z usługami Microsoft (OneDrive, Office, Teams)</li>
                </ul>

            </div>
            <div class="g_specBoxImgContainer_dark_b">
                <img class="g_specImg_win"  onerror="this.onerror=null; this.src='../g_win10.png';" src="/userdata/public/assets/gaming/g_win10.png" alt="windows" />
            </div>
        </div>
          ` : ''}

        <!-- ////////////////////////////////////////////////////////////////////////////////////////////// -->

    </div>

    <style>
            .g_kr_lightGray{
          width: 150px
        }


             .g_set_h3{
            height: 80px;
            text-align: center;
            margin-top: 20px !important;
            padding: 10px;
        }

        .g_set_p{
            padding: 20px;
            text-align: center
        }

        .g_setImgBox{
            height: 150px;
            margin-top: -50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .g_set h3 {
            margin: 0
        }

        .g_vl_container{
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .g_vl{
            height: 80%;
            width: fit-content;
        }

        .g_setContainer{
            display: flex;
            flex-direction: row;
        }

        .g_setImg{
            max-width: 90%;
            max-height: 200px;
        }

        .g_set{
            width: calc((100%) / 3);
            display: flex;
            align-items: center;
            flex-direction: column;
        }


        .g_specBoxImgContainer_dark_monitor {
            width: 60%;
            display: flex;
            align-content: center;
            min-height: 300px;
            align-items: flex-start;
            justify-content: center;
            align-items: center;
            background-image: url(../t10.svg), url(/userdata/public/assets/gaming/t10.svg);
            background-size: contain;
            background-repeat: no-repeat;
            background-position-y: 40%;
            background-position-x: 10px;
        }
        .g_specBoxTextContainer_2_monitor {
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 40%;
            margin: 0px 50px 20px 50px;
        }
        .g_specBox1b_monitor {
            padding-bottom: 90px;
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            min-height: 350px;
            /* Tło gradientowe z obrazkiem */
            background: linear-gradient(90deg, rgba(28, 28, 23, 0.96) 0%, rgba(30, 27, 33, 0.96) 33%, rgba(28, 23, 23, 0.95) 66%, rgba(22, 26, 26, 0.96) 100%);
            
            }
        .g_specImg_dark_monitor {
            max-width: 90%;
            max-height: 650px;
        }

        * {
            font-family: "Poppins", serif;
            font-style: normal;
        }

        .g_bimg2 {
            background: linear-gradient(90deg, rgba(28, 28, 23, 0.96) 0%, rgba(30, 27, 33, 0.96) 33%, rgba(28, 23, 23, 0.95) 66%, rgba(22, 26, 26, 0.96) 100%);
            width: 100%;
            display: flex;
            justify-content: center;
            flex-direction: column;
            align-items: center;
        }

        .g_rayTracingBox {
            background-image: url("../rt.png"), url("/userdata/public/assets/gaming/rt.png");
            background-position: center;
            background-size: cover;
            width: 100%;
            display: flex;
            justify-content: center;
            flex-direction: column;
            align-items: center;
            aspect-ratio: 16 / 8;
        }


        .g_top2 {
            background-color: rgb(255 255 255 / 67%);
            backdrop-filter: blur(5px);
            flex-direction: column;
            width: 50%;
            display: flex;
            color: rgba(255, 255, 255, 0.744);
            font-size: 2rem;
            padding: 20px;
            justify-content: space-between;
        }

        .g_header {
            backdrop-filter: blur(5px);
            flex-direction: column;
            display: flex;
            color: rgba(255, 255, 255, 0.744);
            font-size: 2rem;
            padding: 20px;
            justify-content: space-between;
        }

        .g_h3 {
            font-family: "Poppins", serif;
            font-style: normal;
            color: #9fbfd0;
            font-size: 35px;
            font-weight: 100 !important;
            text-transform: uppercase;
            text-align: center;
        }

        .g_h2 {
            font-size: 30px;
            font-weight: 300;
            color: rgb(54, 54, 54);
            text-align: center;
        }

        .g_h2_header {
            font-size: 35px;
            font-weight: 200;
            color: rgb(213, 213, 213);
            text-align: center;
        }

        .g_p1 {
            font-size: 16px;
            color: rgb(54, 54, 54);
            text-align: center;
        }

        .g_p1_header {
            font-size: 16px;
            color: rgb(213, 213, 213);
            text-align: center;
            font-weight: 200;
        }

        .g_p2 {
            font-size: 16px;
            color: rgb(239, 239, 239);
            font-weight: 200;
        }

        .g_p3 {
            font-size: 16px;
            color: rgb(49, 49, 49);
            font-weight: 300;
        }

        .g_specBox2 {
            display: flex;
            flex-direction: column;
            background: #1c1c17;
            background: linear-gradient(90deg, rgba(28, 28, 23, 0.96) 0%, rgba(30, 27, 33, 0.96) 33%, rgba(28, 23, 23, 0.95) 66%, rgba(22, 26, 26, 0.96) 100%);
        }

        .g_specBox2_c {
            width: 100%;
            display: flex;
            flex-direction: row;
            min-height: 300px;
            justify-content: space-between;
        }

        .g_specBox {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            width: 100px;
            height: 100px;
            background-color: #393939c4;
        }

        .g_specBoxImgContainer2 {
            gap: 10px;
            width: 70%;
            display: flex;
            flex-wrap: wrap;
            align-content: center;
            min-height: 300px;
            margin: 50px 0;
            justify-content: center;
        }

        .g_specBoxImgContainer_dark {
            width: 50%;
            display: flex;
            align-content: center;
            min-height: 300px;
            align-items: flex-start;
            justify-content: center;
            background-image: url("../t10.svg") ,url("/userdata/public/assets/gaming/t10.svg");
            background-size: contain;
            background-repeat: no-repeat;
            background-position-y: 40%;
            background-position-x: 10px;
            align-items: center;
        }

        .g_specBoxImgContainer_dark_b {
            width: 50%;
            display: flex;
            align-content: center;
            min-height: 300px;
            align-items: flex-end;
            justify-content: center;
            background-image: url("../t10.svg") ,url("/userdata/public/assets/gaming/t10.svg");
            background-size: contain;
            background-repeat: no-repeat;
            background-position-y: 40%;
            background-position-x: 10px;
        }

        .g_h3_2 {
            color: #d9d9d9;
            font-size: 30px;
            font-weight: 300;
            text-transform: uppercase;
        }

        .g_h3_3 {
            color: #212121;
            font-size: 30px;
            font-weight: 300;
            text-transform: uppercase;
        }

        .g_icon {
            transform: scale(0.6);
        }

        .g_specBoxTextContainer {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: calc((100% - 60px) / 4);
            justify-content: space-between;
            gap: 20px;
        }

        .g_specText1 {
            color: rgb(230, 230, 230);
            margin: 0px !important;
            font-size: 17px;
            font-weight: 300;
            text-align: center
        }

        .g_specText2 {
            color: rgb(159 191 208);
            margin: 0px !important;
            font-size: 13px;
            font-weight: 300;
            text-align: center;
            height: 50px;
        }

        .g_img_tr {
            margin-bottom: 20px;
            margin-left: 50px;
        }

        .g_specBox3 {
            width: 100%;
            display: flex;
            flex-direction: row;
        }

        .g_specImg_dark {
            max-width: 60%;
            max-height: 250px;
        }

        .g_specImg_win {
            width: 70%;
        }

        .g_specBoxTextContainer_2 {
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 50%;
            margin: 0px 50px 20px 50px;

        }

        .g_mainContainer {
            background: linear-gradient(90deg, #a5a50d00, #3f335010, #5f070410, #16111110),
                url('../g_mbi.png'),
                url('/userdata/public/assets/gaming/g_mbi.png');
            background-size: contain;
            max-width: 1200px;
            /* background: linear-gradient(90deg, #a5a40d00, #3f335026, #5f07041c, #16111191), url(./gaming-img/g1.svg); */
        }

        .g_gradientBox {
            background: linear-gradient(90deg, #bcbb26, #524762, #7d2725, #332c2c);
            display: flex;
            justify-content: space-between;
            /* Odstępy między zdjęciami */
            align-items: center;
            width: 100%;
            padding: 20px;
            box-sizing: border-box;
        }

        .g_win_top {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }

        .g_rt_top {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }

        .g_rt {
            backdrop-filter: blur(20px);
            background-color: #ffffff4b;
            width: 60%;
            font-size: 19px;
            padding: 20px;
        }

        .g_win {
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-content: flex-start;
            justify-content: space-between;
        }

        .g_win_spec {
            backdrop-filter: blur(20px);
            background-color: #ffffffb0;
            padding: 20px;
            max-width: 180px;
            text-align: center;
            border-radius: 5px;
            font-size: 20px;
            display: flex;
            align-items: center;
            color: black;
        }

        .g_spec_h3 {
            font-weight: 300;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .g_spec_b {
            color: rgb(159 191 208);
            font-size: 25px;
            font-weight: 200;
            margin: 0;
        }

        .g_spec_p {
            font-size: 13px;
            margin: 0;
        }

        .g_top {
            /* background-Color: rgba(255, 255, 255, .24);
            backdrop-filter: blur(20px); */
            flex-direction: column;
            width: 50%;
            display: flex;
            color: rgba(255, 255, 255, 0.744);
            font-size: 2rem;
            padding: 60px 60px;
            height: 100%;
            justify-content: space-between;
        }

        .g_specDetails {
            display: flex;
            flex-direction: row;
            width: 100%;
            justify-content: space-between;
        }

        .g_specBox1 {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            min-height: 450px;
            /* Kształt sekcji */
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 90%);
            /* Tło gradientowe z obrazkiem */
            background: 
                url('../y1.svg') no-repeat right 20px top 20px,
                url('/userdata/public/assets/gaming/y1.svg') no-repeat right 20px top 20px,
                linear-gradient(90deg, rgba(28, 28, 23, 0.96) 0%, rgba(30, 27, 33, 0.96) 33%, rgba(28, 23, 23, 0.95) 66%, rgba(22, 26, 26, 0.96) 100%);
        }

        .g_specBox1b {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            min-height: 350px;
            /* Tło gradientowe z obrazkiem */
            background: 
                url('../y1.svg') no-repeat right 20px top 20px,
                url('/userdata/public/assets/gaming/y1.svg') no-repeat right 20px top 20px,
                linear-gradient(90deg, rgba(28, 28, 23, 0.96) 0%, rgba(30, 27, 33, 0.96) 33%, rgba(28, 23, 23, 0.95) 66%, rgba(22, 26, 26, 0.96) 100%);
        }
        .g_specBox1c {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            min-height: 350px;
            background: linear-gradient(90deg, rgba(28, 28, 23, 0.96) 0%, rgba(30, 27, 33, 0.96) 33%, rgba(28, 23, 23, 0.95) 66%, rgba(22, 26, 26, 0.96) 100%);
        }


        .g_specBoxImgContainer3 {
            display: flex;
            justify-content: center;
            align-items: center;
            background-position: center 30%;
            width: 50%
        }

        .g_specImg {
    max-width: 90%;
    max-height: 200px;
        }

        .g_SpecImgMain {
            z-index: 5;
        }


        @media (max-width: 500px) {
            .g_specBoxTextContainer {
                width: calc((100% - 40px) / 2);
                justify-content: center
            }
        }

        @media (max-width: 900px) {

            .g_specBox2_c,
            .g_specBox1b,
            .g_specBox3,
            .g_specBox1 {
                flex-direction: column;
            }

            .g_specBoxTextContainer_2,
            .g_specBoxImgContainer2,
            .g_specBoxImgContainer_dark,
            .g_specBoxImgContainer_dark_b {
                width: 100%;
            }

            .g_specBox1 {
                clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 96%);
            }

            .specBoxTextContainer {
                margin: 0px;
                padding: 20px;
            }
        }
    </style>
`
