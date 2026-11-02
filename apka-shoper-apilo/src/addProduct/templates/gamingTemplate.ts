export const gamingTemplate = (
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
                  ${set === "brak" ? `<h2 class="g_h2_header">KOMPUTER DO GIER</h2>` : '<h2 class="g_h2_header">ZESTAW GAMINGOWY</h2>'}  

                    <h3 class="g_h3">
                       ${cpuSeries} ${cpuName} | ${gpuName} | ${ramName} | ${diskName} GB | ${system}
                    </h3>
                </div>
                <p class="g_p1_header">Gotowy zestaw dla gracza i profesjonalisty – wydajność, nowoczesność,
                    niezawodność!</p>
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
                    <h3 class="g_h3_2">Kluczowe Cechy</h3>
                    <ul class="g_p2">
                        ${additionalInfo ? `<li>${additionalInfo}</li>` : ""}
                        <li>Porty obudowy: ${CasePorts}</li>
                        <li>Komputer jest w pełni gotowy do pracy zaraz po wyjęciu z opakowania</li>
                        <li>Komputer został złożony ${components}</li>
                        <li>Każdy egzemplarz jest dokładnie testowany pod obciążeniem przed wysyłką, aby zapewnić stabilność i niezawodność działania.</li>
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
                        <p class="g_specText1">Karta Graficzna</p>
                        <p class="g_specText2">${gpuName}</p>
                    </div>

                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_mb.svg';" src="/userdata/public/assets/gaming/g_mb.svg" alt="płyta główna" />
                        </div>
                        <p class="g_specText1">Płyta główna</p>
                        <p class="g_specText2">${mainBoardName}</p>
                    </div>

                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_ps.svg';" src="/userdata/public/assets/gaming/g_ps.svg" alt="zasilacz" />
                        </div>
                        <p class="g_specText1">Zasilacz</p>
                        <p class="g_specText2">${powerSupplyModel} ${powerSupplyName}W </p>
                    </div>

                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_ram.svg';" src="/userdata/public/assets/gaming/g_ram.svg" alt="ram" />
                        </div>
                        <p class="g_specText1">Pamięć RAM</p>
                        <p class="g_specText2">${ramModel} ${ramName}</p>
                    </div>
                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_case.svg';" src="/userdata/public/assets/gaming/g_case.svg" alt="obudowa" />
                        </div>
                        <span class="g_specText1">Obudowa</span>
                        <span class="g_specText2">${caseModel} ${caseName}</span>
                    </div>
                            ${cpuFanModel ? ` 
                                <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_fan.svg';" src="/userdata/public/assets/gaming/g_fan.svg" alt="radiator CPU" />
                        </div>
                        <p class="g_specText1">Radiator CPU</p>
                        <p class="g_specText2">${cpuFanModel}</p>
                    </div>` : ""}

                    <div class="g_specBoxTextContainer">
                        <div class="g_specBox">
                            <img class="g_icon" onerror="this.onerror=null; this.src='../g_system.svg';" src="/userdata/public/assets/gaming/g_system.svg" alt="system" />
                        </div>
                        <span class="g_specText1">System</span>
                        <span class="g_specText2">${system}</span>
                    </div>

                </div>
            </div>
            <div >
            <img class="g_img_tr g_kr_white"  onerror="this.onerror=null; this.src='../g_kr1.svg';" src="/userdata/public/assets/gaming/g_kr1.svg"  />
            </div>
        </div>
        <div class="g_specBox3">
            <div class="g_specBoxTextContainer_2">
                <h3 class="g_h3_3">Karta graficzna ${gpuName}</h3>
                <div>
                <img class=" g_kr_gray"  onerror="this.onerror=null; this.src='../g_kr3.svg';" src="/userdata/public/assets/gaming/g_kr3.svg"  />
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
                <img class=" g_kr_lightGray"  onerror="this.onerror=null; this.src='../g_kr2.svg';" src="/userdata/public/assets/gaming/g_kr2.svg"  />
                </div>
                <p class="g_p2">
                    ${cpuDescription}
                </p>
                <div class="g_specDetails">
                    <div class="g_spec_h3"> <b class="g_spec_b"> ${cpuCores} </b> <p class="g_spec_p"> Rdzeni</p></div>
                    <div class="g_spec_h3"> <b class="g_spec_b"> ${cpuThreeds} </b> <p class="g_spec_p"> Wątków</p></div>
                    <div class="g_spec_h3"> <b class="g_spec_b"> ${cpuMax} GHz</b> <p class="g_spec_p"> Taktowanie Turbo</p></div>
                </div>
            </div>
        </div>

        <div class="g_specBox3">
            <div class="g_specBoxTextContainer_2">
                <h3 class="g_h3_3">Pamięć RAM ${ramName}</h3>
                <div>
                    <img class="g g_kr_gray"  onerror="this.onerror=null; this.src='../g_kr3.svg';" src="/userdata/public/assets/gaming/g_kr3.svg"  />
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
                <h3 class="g_h3_2">Dysk ${diskName} GB</h3>

                <div>
                    <img class=" g_kr_lightGray"  onerror="this.onerror=null; this.src='../g_kr2.svg';" src="/userdata/public/assets/gaming/g_kr2.svg"  />
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
                    Monitor Acer który wchodzi w skład zestawu jest doskonałym wyborem do gier i nie tylko. Dzięki 24-calowemu ekranowi i częstotliwości odświeżania 75 Hz, monitor zapewnia płynny obraz i minimalne opóźnienia sygnału wejściowego - idealnie nadaje się do strzelanek, gier wyścigowych oraz szybkich gier akcji. Ultraszybki czas reakcji 1 ms sprawia, że monitor zatrzymuje czas, dzięki czemu możesz cieszyć się pięknymi obrazami bez rozmycia ruchu i smużenia.
                </p>
            </div>
        </div>


        <div class="g_setContainer">
            <div class = "g_setMouse g_set"> 
               <div class="g_setImgBox"> <img class="g_setImg" onerror="this.onerror=null; this.src='../g_mouseSet_d.png';" src="/userdata/public/assets/gaming/g_mouseSet_d.png" alt="mouse" /> </div>
                <h3 class="g_h3_3 g_set_h3">Mysz BLOODY ES7RGB</h3>
                <p class="g_p3 g_set_p">
                    Mysz A4TECH BLOODY ES7 RGB Esports Stone Black USB oferuje 5-poziomową regulację CPI (1000–6000) z możliwością personalizacji w oprogramowaniu. Pozwala to dostosować czułość, prędkość kursora i przyspieszenie do gier, pracy graficznej czy projektowania. Wyposażona w podświetlenie RGB z 16,8 mln kolorów. Podkładka o wymiarach 25 x 28 x 0,3 cm z gumowanym spodem jest niezbędną aby jeszcze lepiej panować nad myszką.
                </p>
            </div>  
            <div class = "g_vl_container">
             <img class = " g_vl" onerror="this.onerror=null; this.src='../g_vl.png';" src="/userdata/public/assets/gaming/g_vl.png"  />     
            
             </div>  
            <div class = "g_setKeyboard g_set">
               <div class="g_setImgBox"> <img class="g_setImg" onerror="this.onerror=null; this.src='../g_keyboard_d.png';" src="/userdata/public/assets/gaming/g_keyboard_d.png" alt="mouse" /> </div>
                <h3 class="g_h3_3 g_set_h3">Klawiatura Bloody B140N</h3>
                <p class="g_p3 g_set_p">
                    Pełnowymiarowa klawiatura membranowa z podświetleniem RGB Neon, specjalnymi klawiszami WASD i funkcją Anti-ghosting zapewnia maksymalną kontrolę w grach. Czas reakcji 1 ms i częstotliwość 1000 Hz gwarantują błyskawiczne działanie, a tryb Gaming Mode blokuje klawisz Windows. Trwała, wygodna i gotowa na intensywną rozgrywkę.
                </p>
                </div>    
                    <div class = "g_vl_container">
             <img class = " g_vl" onerror="this.onerror=null; this.src='../g_vl.png';" src="/userdata/public/assets/gaming/g_vl.png"  />     
            </div>  
            <div class = "g_setHeadphones g_set">
                <div class="g_setImgBox"> <img class="g_setImg" onerror="this.onerror=null; this.src='../g_headphones_d.png';" src="/userdata/public/assets/gaming/g_headphones_d.png" alt="headphones" /> </div>
                <h3 class="g_h3_3 g_set_h3">Słuchawki Tracer GameZone GZ X1</h3>
                <p class="g_p3 g_set_p">
                    Tracer GameZone GZ X1 to gamingowe słuchawki z przetwornikami 50 mm, podświetleniem RGB i elastycznym pałąkiem, zapewniające mocny dźwięk i wygodę. Wyposażone w mikrofon, regulację głośności i kabel 1,9 m ze złączem Mini Jack 3,5 mm, są kompatybilne z komputerami, konsolami i innymi urządzeniami.
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
                    Monitor Acer który wchodzi w skład zestawu jest doskonałym wyborem do gier i nie tylko. Dzięki 24-calowemu ekranowi i częstotliwości odświeżania 75 Hz, monitor zapewnia płynny obraz i minimalne opóźnienia sygnału wejściowego - idealnie nadaje się do strzelanek, gier wyścigowych oraz szybkich gier akcji. Ultraszybki czas reakcji 1 ms sprawia, że monitor zatrzymuje czas, dzięki czemu możesz cieszyć się pięknymi obrazami bez rozmycia ruchu i smużenia.
                </p>
            </div>
        </div>

        <div class="g_setContainer">
            <div class = "g_setMouse g_set"> 
               <div class="g_setImgBox"> <img class="g_setImg" onerror="this.onerror=null; this.src='../g_mouseSet_t.png';" src="/userdata/public/assets/gaming/g_mouseSet_t.png" alt="mouse" /> </div>
                <h3 class="g_h3_3 g_set_h3">Mysz Tracer Boost</h3>
                <p class="g_p3 g_set_p">
                    Mysz Tracer Boost to precyzyjne narzędzie dla każdego gracza. Rozdzielczość do 1600 DPI gwarantuje szybkie i dokładne reakcje, a cztery przyciski oraz rolka umożliwiają intuicyjną obsługę. Kolorowe podświetlenie dodaje jej dynamicznego charakteru, a ergonomiczny kształt zapewnia komfort nawet podczas długich rozgrywek. W zestawie znajduje się także podkładka A4Tech XGame X7-200MP o wymiarach 250×200×3 mm, z gumowanym, antypoślizgowym spodem i gładką tkaniną wierzchnią, która poprawia kontrolę ruchów myszy i zwiększa precyzję w grach.
                </p>
            </div>  
            <div class = "g_vl_container">
             <img class = " g_vl" onerror="this.onerror=null; this.src='../g_vl.png';" src="/userdata/public/assets/gaming/g_vl.png"  />     
            
             </div>  
            <div class = "g_setKeyboard g_set">
               <div class="g_setImgBox"> <img class="g_setImg" onerror="this.onerror=null; this.src='../g_keyboard_t.png';" src="/userdata/public/assets/gaming/g_keyboard_t.png" alt="mouse" /> </div>
                <h3 class="g_h3_3 g_set_h3">Klawiatura Tracer Boost</h3>
                <p class="g_p3 g_set_p">
                    Klawiatura Tracer Boost to połączenie funkcjonalności i nowoczesnego designu stworzone z myślą o graczach. Efektowne, kolorowe podświetlenie z kilkoma trybami nadaje stanowisku wyjątkowy charakter, a osiem klawiszy multimedialnych pozwala szybko sterować muzyką, głośnością i innymi funkcjami bez przerywania gry. Ergonomiczny kształt i solidna konstrukcja zapewniają wygodę oraz trwałość podczas wielogodzinnych sesji.
                </p>
                </div>    
                    <div class = "g_vl_container">
             <img class = " g_vl" onerror="this.onerror=null; this.src='../g_vl.png';" src="/userdata/public/assets/gaming/g_vl.png"  />     
            </div>  
            <div class = "g_setHeadphones g_set">
                <div class="g_setImgBox"> <img class="g_setImg" onerror="this.onerror=null; this.src='../g_headphones_t.png';" src="/userdata/public/assets/gaming/g_headphones_t.png" alt="headphones" /> </div>
                <h3 class="g_h3_3 g_set_h3">Słuchawki Tracer GAMEZONE GZ X3</h3>
                <p class="g_p3 g_set_p">
                   Tracer GAMEZONE GZ X3 to lekkie i wygodne słuchawki z przetwornikami 40 mm, oferujące czyste brzmienie, mocne basy i dobrą izolację od otoczenia. Podświetlenie RGB LED „flow” podkreśla gamingowy styl, a miękkie nauszniki i wyściełany pałąk zapewniają komfort. Składany mikrofon umożliwia wyraźną komunikację, a złącze mini-jack 3,5 mm gwarantuje szeroką kompatybilność.
                </p>
                </div>                
        </div>
                ` : ''}


        ${rt ? `        
            <div class="g_rayTracingBox">
            <div class="g_top2">
                <div>
                    <h2 class="g_h2">RAY TRACING</h2>
                </div>
                <p class="g_p1">
                Ray tracing to nowoczesna technologia renderowania obrazu, która zyskała dużą popularność wśród graczy i twórców grafiki. Polega na śledzeniu promieni światła w sposób zbliżony do rzeczywistego, co pozwala uzyskać wyjątkowo realistyczne efekty świetlne, cienie i odbicia. Dzięki odwzorowaniu praw fizyki, ray tracing podnosi jakość grafiki do poziomu kinowego, nadając grom i aplikacjom wizualnym niespotykaną głębię i szczegółowość – bez kompromisów w płynności działania.
                </p>
            </div>
        </div>
        <div class="g_gradientBox" style="
            height: 10px;
            padding: 0 !important;">
        </div>
        ` : ""}
    
  ${system?.includes("Windows 11") ? `
    <div class="g_specBox1c">
      <div class="g_specBoxTextContainer_2">
        <h3 class="g_h3_2">${system}</h3>
        <div>
 <img class=" g_kr_lightGray"  onerror="this.onerror=null; this.src='../g_kr2.svg';" src="/userdata/public/assets/gaming/g_kr2.svg"  />
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
                 <img class=" g_kr_lightGray"  onerror="this.onerror=null; this.src='../g_kr2.svg';" src="/userdata/public/assets/gaming/g_kr2.svg"  />
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
        .g_kr_lightGray{
          width: 150px
        }
        .g_kr_gray{
          width: 150px
        } 
        .g_kr_white{
          width: 192px
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
export const gamingTemplateAllegro = (
    cpuName: string | string[],
    gpuName: string | string[],
    mainBoardName: string | string[],
    powerSupplyName: string | string[],
    ramName: string | string[],
    caseName: string | string[],
    cpuCores: string | string[],
    cpuThreeds: string | string[],
    cpuMax: string | string[],
    CasePorts: string | string[],
    system: string | string[],
    gpuDescription: string | string[],
    cpuDescription: string | string[],
    gpuSrc: string | string[],
    cpuSrc: string | string[],
    ramDescription: string | string[],
    diskDescription: string | string[],
    diskName: string | string[],
    diskSrc: string | string[],
    cpuSeries: string | string[],
    gpuType: string | string[],
    additionalInfo: string | string[],
    components: string | string[],
    rt: boolean,
    powerSupplyModel: string | string[],
    ramModel: string | string[],
    caseModel: string | string[],
    cpuFanModel: string | string[],
    set: string
) => {
    return {
        sections: [
            {
                items: [
                    {
                        type: "IMAGE",
                        url: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/gamingBaner.png"
                    }
                ]
            },
            {
                items: [
                    {
                        type: "TEXT",
                        content: `
                            <h2>🛠️ Najważniejsze parametry zestawu</h2>
                            <ul>
                                <li>Procesor: <b>${cpuSeries} ${cpuName}</b></li>
                                <li>Karta Graficzna: <b>${gpuName}</b></li>
                                <li>Płyta główna: <b>${mainBoardName}</b></li>
                                <li>Zasilacz: <b>${powerSupplyModel} ${powerSupplyName}W</b></li>
                                <li>Pamięć RAM: <b>${ramModel} ${ramName}</b></li>
                                <li>Obudowa: <b>${caseModel} ${caseName}</b></li>
                                <li>Chłodzenie CPU: <b>${cpuFanModel || "dostosowane do zestawu"}</b></li>
                                <li>System operacyjny: <b>${system}</b></li>
                                ${set != "brak" ? `<li>Monitor: <b>Acer 24" 75Hz Full HD</b></li>` : ""}
                                ${set == "tani" ? `<li>Mysz: <b>Tracer Boost</b></li>` : ""}
                                ${set == "tani" ? `<li>Klawiatura: <b>Tracer Boost</b></li>` : ""}
                                ${set == "tani" ? `<li>Słuchawki: <b>Tracer GAMEZONE GZ X3 </b></li>` : ""}
                                ${set == "drogi" ? `<li>Mysz: <b>BLOODY ES7RGB</b></li>` : ""}
                                ${set == "drogi" ? `<li>Klawiatura: <b>Bloody B140N</b></li>` : ""}
                                ${set == "drogi" ? `<li>Słuchawki: <b>Tracer GameZone GZ X1</b></li>` : ""}
                                                               
                            </ul>
                    
                            ${additionalInfo ? `<p>❗ ${additionalInfo}</p>` : ""}
                            
                            <p>Porty obudowy: <b>${CasePorts}</b></p>
                            <p>✅ Komputer jest w pełni gotowy do pracy zaraz po wyjęciu z opakowania.</p>
                            <p>✅ Złożony ręcznie przez specjalistę z użyciem komponentów: <b>${components}</b></p>
                            <p>✅ Każdy egzemplarz jest testowany pod obciążeniem, aby zapewnić <b>maksymalną stabilność i niezawodność</b>.</p>
                        `
                    }
                ]
            },

            {
                items: [
                    {
                        type: "IMAGE",
                        url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/${gpuSrc}.png`
                    },
                    {
                        type: "TEXT",
                        content: `<h2> Karta Graficzna ${gpuName}</h2><p>${gpuDescription}</p>`
                    }
                ]
            },
            {
                items: [
                    {
                        type: "TEXT",
                        content: ` <h2> Procesor ${cpuSeries} ${cpuName}</h2><p>${cpuDescription}</p>`
                    },
                    {
                        type: "IMAGE",
                        url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/${cpuSrc}.png`
                    },

                ]
            },
            {
                items: [
                    {
                        type: "IMAGE",
                        url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/g_r2.png`
                    },
                    {
                        type: "TEXT",
                        content: `<h2> Pamięć RAM ${ramName}</h2><p>${ramDescription}</p>`
                    }
                ]
            },
            {
                items: [
                    {
                        type: "TEXT",
                        content: `<h2> Dysk ${diskName} GB</h2><p>${diskDescription}</p>`
                    },
                    {
                        type: "IMAGE",
                        url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/${diskSrc}.png`
                    }

                ]
            },

            ...(system?.includes("Windows 11") ? [

                {
                    items: [
                        {
                            type: "IMAGE",
                            url: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/win11.png"
                        },
                        {
                            type: "TEXT",
                            content: `<h2>${system}</h2>
                            <ul>
                                <li> Intuicyjny i nowoczesny interfejs</li>
                                <li> Wyższa wydajność i szybkość działania</li>
                                <li> Lepsze wsparcie dla gier (DirectStorage, AutoHDR)</li>
                                <li> Większe bezpieczeństwo i ochrona danych</li>
                                <li> Obsługa najnowszych procesorów i technologii</li>
                                <li> Snap Layouts i ulepszona wielozadaniowość</li>
                                <li> Nowy Microsoft Store z większą liczbą aplikacji</li>
                            </ul>`
                        }
                    ]
                }
            ] : []),
            ...(system?.includes("Windows 10") ? [
                {
                    items: [
                        {
                            type: "IMAGE",
                            url: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/g_win10.png"
                        },
                        {
                            type: "TEXT",
                            content: `<h2>${system}</h2>
                            <ul>
                                <li>Przejrzysty i prosty interfejs użytkownika</li>
                                <li>Wysoka wydajność i optymalizacja działania</li>
                                <li>Doskonała kompatybilność z grami i aplikacjami</li>
                                <li>Regularne aktualizacje bezpieczeństwa</li>
                                <li>Wbudowany Windows Defender</li>
                                <li>Obsługa ekranów dotykowych i tabletów</li>
                                <li>Integracja z OneDrive, Office, Teams</li>
                            </ul>`
                        }
                    ]
                }
            ] : []),

            ...(set != "brak" ? [
                {
                    items: [
                        {
                            type: "TEXT",
                            content: `<h2>🖥️ Monitor Acer 24" Full HD 75Hz </h2>
                                <p>
                                <b>Monitor Acer</b>, który wchodzi w skład zestawu, jest 
                                <b>doskonałym wyborem do gier i nie tylko</b>. 
                                Dzięki <b>24-calowemu ekranowi</b> i 
                                <b>częstotliwości odświeżania 75 Hz</b> monitor zapewnia 
                                <b>płynny obraz</b> i 
                                <b>minimalne opóźnienia sygnału wejściowego</b> – idealnie nadaje się do 
                                <b>strzelanek</b>, <b>gier wyścigowych</b> oraz 
                                <b>dynamicznych gier akcji</b>. 
                                <b>Ultraszybki czas reakcji 1 ms</b> sprawia, że monitor „zatrzymuje czas”, dzięki czemu możesz cieszyć się 
                                <b>ostrym i wyraźnym obrazem</b> bez 
                                <b>rozmycia ruchu</b> i <b>smużenia</b>.
                                </p>`
                        }
                    ]
                },
                {
                    items: [
                        {
                            type: "IMAGE",
                            url: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/g_monitor.png"
                        }
                    ]
                }
            ] : []),
            ...(set == "tani" ? [
                {
                    items: [
                        {
                            type: "TEXT",
                            content: `<h2> Mysz Tracer Boost</h2><p>Mysz Tracer Boost to precyzyjne narzędzie dla każdego gracza. Rozdzielczość do 1600 DPI gwarantuje szybkie i dokładne reakcje, a cztery przyciski oraz rolka umożliwiają intuicyjną obsługę. Kolorowe podświetlenie dodaje jej dynamicznego charakteru, a ergonomiczny kształt zapewnia komfort nawet podczas długich rozgrywek. W zestawie znajduje się także podkładka A4Tech XGame X7-200MP o wymiarach 250×200×3 mm, z gumowanym, antypoślizgowym spodem i gładką tkaniną wierzchnią, która poprawia kontrolę ruchów myszy i zwiększa precyzję w grach.</p>`
                        },
                        {
                            type: "IMAGE",
                            url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/g_mouseSet_t.png`
                        }

                    ]
                },
                {
                    items: [
                        {
                            type: "IMAGE",
                            url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/g_keyboard_t.png`
                        },
                        {
                            type: "TEXT",
                            content: `<h2>Klawiatura Tracer Boost</h2><p>Klawiatura Tracer Boost to połączenie funkcjonalności i nowoczesnego designu stworzone z myślą o graczach. Efektowne, kolorowe podświetlenie z kilkoma trybami nadaje stanowisku wyjątkowy charakter, a osiem klawiszy multimedialnych pozwala szybko sterować muzyką, głośnością i innymi funkcjami bez przerywania gry. Ergonomiczny kształt i solidna konstrukcja zapewniają wygodę oraz trwałość podczas wielogodzinnych sesji.</p>`
                        }
                    ]
                },
                {
                    items: [
                        {
                            type: "TEXT",
                            content: `<h2>Słuchawki Tracer GAMEZONE GZ X3</h2><p>Tracer GAMEZONE GZ X3 to lekkie i wygodne słuchawki z przetwornikami 40 mm, oferujące czyste brzmienie, mocne basy i dobrą izolację od otoczenia. Podświetlenie RGB LED „flow” podkreśla gamingowy styl, a miękkie nauszniki i wyściełany pałąk zapewniają komfort. Składany mikrofon umożliwia wyraźną komunikację, a złącze mini-jack 3,5 mm gwarantuje szeroką kompatybilność.</p>`
                        },
                        {
                            type: "IMAGE",
                            url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/g_headphones_t.png`
                        }

                    ]
                },
            ] : []),



            ...(set == "drogi" ? [
                {
                    items: [
                        {
                            type: "TEXT",
                            content: `<h2>Mysz BLOODY ES7RGB</h2><p>Mysz A4TECH BLOODY ES7 RGB Esports Stone Black USB oferuje 5-poziomową regulację CPI (1000–6000) z możliwością personalizacji w oprogramowaniu. Pozwala to dostosować czułość, prędkość kursora i przyspieszenie do gier, pracy graficznej czy projektowania. Wyposażona w podświetlenie RGB z 16,8 mln kolorów. Podkładka o wymiarach 25 x 28 x 0,3 cm z gumowanym spodem jest niezbędną aby jeszcze lepiej panować nad myszką.</p>`
                        },
                        {
                            type: "IMAGE",
                            url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/g_mouseSet_d.png`
                        }

                    ]
                },
                {
                    items: [
                        {
                            type: "IMAGE",
                            url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/g_keyboard_d.png`
                        },
                        {
                            type: "TEXT",
                            content: `<h2>Klawiatura Bloody B140N</h2><p>Pełnowymiarowa klawiatura membranowa z podświetleniem RGB Neon, specjalnymi klawiszami WASD i funkcją Anti-ghosting zapewnia maksymalną kontrolę w grach. Czas reakcji 1 ms i częstotliwość 1000 Hz gwarantują błyskawiczne działanie, a tryb Gaming Mode blokuje klawisz Windows. Trwała, wygodna i gotowa na intensywną rozgrywkę.</p>`
                        }
                    ]
                },
                {
                    items: [
                        {
                            type: "TEXT",
                            content: `<h2>Słuchawki Tracer GameZone GZ X1</h2><p>Tracer GameZone GZ X1 to gamingowe słuchawki z przetwornikami 50 mm, podświetleniem RGB i elastycznym pałąkiem, zapewniające mocny dźwięk i wygodę. Wyposażone w mikrofon, regulację głośności i kabel 1,9 m ze złączem Mini Jack 3,5 mm, są kompatybilne z komputerami, konsolami i innymi urządzeniami.</p>`
                        },
                        {
                            type: "IMAGE",
                            url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/g_headphones_d.png`
                        }

                    ]
                },
            ] : []),



            {
                items: [
                    {
                        type: "IMAGE",
                        url: `https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/games.png`
                    }
                ]
            },

            ...(rt === true ? [
                {
                    items: [
                        {
                            type: "TEXT",
                            content: `<h2>Ray tracing</h2>
                            <p>
                            <b>Ray tracing</b> to <b>nowoczesna technologia renderowania obrazu</b>, która zyskała dużą popularność wśród <b>graczy i twórców grafiki</b>.
                            Polega na <b>śledzeniu promieni światła</b> w sposób zbliżony do rzeczywistego, co pozwala uzyskać <b>wyjątkowo realistyczne efekty świetlne</b>, <b>cienie</b> i <b>odbicia</b>.
                            Dzięki odwzorowaniu <b>praw fizyki</b>, ray tracing podnosi <b>jakość grafiki do poziomu kinowego</b>, nadając grom i aplikacjom wizualnym <b>niespotykaną głębię i szczegółowość</b> – bez kompromisów w <b>płynności działania</b>.
                            </p>`
                        }
                    ]
                },
                {
                    items: [
                        {
                            type: "IMAGE",
                            url: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/rt.png"
                        }
                    ]
                }
            ] : []),

            {
                items: [
                    {
                        type: "TEXT",
                        content: `
                            <h2>✅ Gotowy do pracy od razu po uruchomieniu</h2>
                            <p><b>Każdy komputer jest kompleksowo przygotowany do działania</b> – otrzymujesz w pełni skonfigurowany zestaw, z zainstalowanym systemem operacyjnym, sterownikami oraz pakietem przydatnych programów.</p>
                            <p>W skład preinstalowanego oprogramowania wchodzą między innymi:</p>

                            <ul>
                                <li> <b>✔️ LibreOffice</b> – darmowy i funkcjonalny pakiet biurowy do tworzenia dokumentów, arkuszy kalkulacyjnych i prezentacji</li>
                                <li> <b>✔️ Adobe Acrobat Reader</b> – do przeglądania i drukowania plików PDF</li>
                                <li> <b>✔️ Google Chrome</b> – szybka i bezpieczna przeglądarka internetowa</li>
                                <li> <b>✔️ Podstawowe narzędzia systemowe</b> – m.in. kodeki multimedialne, programy diagnostyczne i zabezpieczające</li>
                            </ul>

                            <p><b>Nie musisz instalować niczego samodzielnie</b> – komputer jest gotowy do natychmiastowego użycia, zarówno w domu, w pracy, jak i do rozrywki.</p>`
                    }
                ]
            },
            {
                items: [
                    {
                        type: "IMAGE",
                        url: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/gamingi/gamingProgramy.png"
                    }
                ]
            },

        ]
    };
};




