const omittedClasses = [
    "false", "laptop_HDD", "display_nie", "system_Brak", "disk_Brak",
    "poleasingoweCaseType_Tower", "poleasingoweCaseType_Mid", "poleasingoweCaseType_SFF",
    "poleasingoweCaseType_USDT", "poleasingoweCaseType_Tiny", "poleasingoweCaseType_Micro",
    "poleasingoweCaseType_USFF", "poleasingoweCaseType_Mini", "poleasingoweCaseType_Mini_Tower",
];

// Descriptions are HTML strings sent to Shoper. Remove unavailable sections before sending them.
export function renderConditionalDescription(html: string): string {
    const template = document.createElement("template");
    template.innerHTML = html;
    for (const className of omittedClasses) {
        template.content.querySelectorAll(`.${className}`).forEach(element => element.remove());
    }
    template.content.querySelectorAll("[data-omit]").forEach(element => {
        if (element.getAttribute("data-omit")?.trim().startsWith("none")) element.remove();
        else element.removeAttribute("data-omit");
    });
    template.content.querySelectorAll<HTMLElement>("[style]").forEach(element => {
        if (element.style.display === "none") element.remove();
        else if (element.style.length === 1 && element.style.display) element.removeAttribute("style");
    });
    template.content.querySelectorAll(".true").forEach(element => element.classList.remove("true"));
    return template.innerHTML;
}
