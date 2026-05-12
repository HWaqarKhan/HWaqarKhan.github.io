// TODO:
// + refactor lambda functions in event listeners so only our listener is removed when using $0.off("keydown")
let showCommand;
"use strict";
class KonsoleSettings {
    prefix = "T> ";
    animatePrint = true;
    printLetterInterval = 25;
    registerDefaultKommands = true;
    message = "If you don't know how to use it, please type \"help\" to find out commands "

    konsoleHelpMsg() {
        const msg =`<pre class="KonsoleHelpMsg"><span class="KonsoleHelpMsg">${this.message}</span></pre>`; 
        return msg;
    }
    konsoleLineMarkup() {
        return `<pre class="KonsoleLine"><span class="KonsolePrefix">${this.prefix}</span><span class="KonsoleLineText"></span></pre>`;
    }
    konsoleParaMarkup() {
        return `<pre class="KonsolePara"><span class="KonsoleParaText"></span></pre>`;
    }

    konsoleChoiceMarkup(lis) {
        return `<pre><ul class="KonsoleChoice">${lis}</ul></pre>`;
    }
}

class Kommand {
    name;
    description;
    details;
    func;

    constructor(_name, _description, _details, _func) {
        this.name = _name;
        this.description = _description;
        this.details = _details;
        this.func = _func;
    }
}

class Konsole {
    konsoleSettings = undefined;

    elem = undefined;
    helperMsg = undefined;

    kommands = [];

    validInput = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !@#$%^&*()-_=+~`?.><,|/\\";
    commandHistory = [];
    historyIndex = -1;

    constructor(selector, _konsoleSettings = new KonsoleSettings()) {
        this.konsoleSettings = _konsoleSettings;

        this.elem = $(selector);

        if (!this.elem.length) {
            console.error(`element`, selector, "wasn't found.");
            return;
        }

        this.elem.addClass("Konsole");
        this.elem.attr("tabindex", "0");


        // Prevent browser from scrolling when pressing arrow keys or space bar
        // window.addEventListener("keydown", function (e) {
        //     if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        //         e.preventDefault();
        //     }
        // }, false);

        // Prevent enter key from opening a link after it is focused once by clicking on it
        $(this.elem).on('keydown', "a", function (e) {
            if (e.which === 13) // enter
            {
                $(e.currentTarget).blur();
                e.preventDefault(); //prevent the default behavoir
            }
        });

        // Automatically Scroll to the bottom when new child is added
        const observer = new MutationObserver((mutationsList, observer) => {
            // console.log(mutationsList);
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // console.log('A child node has been added or removed.', mutation.addedNodes.);
                    this.scrollToBottom();
                }
            }
        });

        observer.observe(this.elem[0], { attributes: false, childList: true, subtree: false });

        if (this.konsoleSettings.registerDefaultKommands) this.RegisterDefaultKommands();
    }

    RegisterDefaultKommands() {
        this.kommands.push(new Kommand("clear", "clears the console.", null, () =>
            new Promise((resolve, reject) => {
                this.elem.html("");
                resolve();
            })
        ));

        this.kommands.push(new Kommand("help", "display all valid commands.", null, async (arg) => {

            if (arg) {
                let kommand = this.kommands.find(k => k.name == arg);
                if (kommand) {
                    return this.print(kommand.details || kommand.description);
                }
                else {
                    return this.print(`'${arg}' is not a valid command.`);
                }
            }

            if (this.konsoleSettings.printAnimation)
                await this.print("tip: you can skip text animation by pressing space.")

            let lengthOfLargestKommandName = Math.max(...this.kommands.map(k => k.name.length));

            return this.print(...this.kommands.map(k => k.name + " ".repeat(lengthOfLargestKommandName - k.name.length) + " - " + k.description));
        }));
    }

    RegisterKommand(kommand) {
        if (kommand && kommand.name && kommand.description && kommand.func) this.kommands.push(kommand);
    }

    awaitKommand() {
        this.elem.append(this.konsoleSettings.konsoleLineMarkup());
        $(document).off("keydown.konsole").on("keydown.konsole", (e) => {
            
            // Only capture input if the Console section is currently visible
            const consoleSection = document.getElementById('Console');
            if (!consoleSection || !consoleSection.classList.contains('section-show')) return;
            
            // Do not capture if user is typing in an input field somewhere else
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

            let lastLine = $(".KonsoleLine:last span.KonsoleLineText");
            let cl = lastLine.text();

            if (this.validInput.includes(e.key) && e.key.length === 1) {
                lastLine.text(cl + e.key);
            }
            else if (e.code === "Backspace") {
                lastLine.text(cl.substring(0, cl.length - 1));
            }
            else if (e.code === "Tab") {
                e.preventDefault();
                if (!cl.trim()) return;
                
                let matches = this.kommands.filter(k => k.name.startsWith(cl.trim().toLowerCase()));
                if (matches.length === 1) {
                    lastLine.text(matches[0].name + " ");
                } else if (matches.length > 1) {
                    $(document).off("keydown.konsole");
                    this.print(matches.map(m => m.name).join("    ")).then(() => {
                        this.awaitKommand();
                        // Pre-fill what they typed
                        $(".KonsoleLine:last span.KonsoleLineText").text(cl);
                    });
                }
            }
            else if (e.code === "ArrowUp") {
                e.preventDefault();
                if (this.commandHistory.length > 0 && this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    lastLine.text(this.commandHistory[this.commandHistory.length - 1 - this.historyIndex]);
                }
            }
            else if (e.code === "ArrowDown") {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    lastLine.text(this.commandHistory[this.commandHistory.length - 1 - this.historyIndex]);
                } else if (this.historyIndex === 0) {
                    this.historyIndex = -1;
                    lastLine.text("");
                }
            }
            else if (e.code === "Enter") {
                $(document).off("keydown.konsole");
                
                cl = cl.trim().replace(/  +/g, " ");
                
                if (cl) {
                    // Prevent consecutive duplicates in history
                    if (this.commandHistory[this.commandHistory.length - 1] !== cl) {
                        this.commandHistory.push(cl);
                    }
                    this.historyIndex = -1;
                }
                
                let command = "";
                let arg = "";

                if (cl.indexOf(" ") == -1) {
                    command = cl;
                }
                else {
                    command = cl.substring(0, cl.indexOf(" "));
                    arg = cl.substring(cl.indexOf(" ") + 1);
                }

                let kommand = this.kommands.find(k => k.name.toLowerCase() === command.toLowerCase());

                if (kommand) {
                    kommand.func(arg).then(() => {
                        this.awaitKommand();
                    });
                }
                else if (command === "") {
                    this.awaitKommand();
                }
                else {
                    this.print(`bash: ${command}: command not found`).then(() => {
                        this.awaitKommand();
                    });
                }
            }
        });
    }

    scrollToBottom() {

        // this.elem[0].scrollTop = this.elem[0].scrollHeight;
        document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
    }

    print(...texts) {
        // Disable user input
        $("body").off("keydown");

        return new Promise((resolve, reject) => {

            // if (!texts.join("\n").trim()) {
            //     reject("Empty Text.");
            //     return;
            // }

            // Append new Konsole Para Markup
            this.elem.append(this.konsoleSettings.konsoleParaMarkup());

            const LastKonsolePara = $(".KonsolePara:last .KonsoleParaText");

            // input in HTML
            const htmlToPrint = texts.join("\n");

            // Temporary elem to convert HTML to simple Text
            const tempHtmlElem = document.createElement("div");
            tempHtmlElem.innerHTML = htmlToPrint;

            // input in simple text
            const textToPrint = tempHtmlElem.textContent;

            // if (this.konsoleSettings.animatePrint) {
            //     let i = 0;
            //     const lineInter = setInterval(() => {

            //         LastKonsolePara.text(LastKonsolePara.text() + textToPrint.at(i));
            //         i++;

            //         if (i >= textToPrint.length) {
            //             LastKonsolePara.html(htmlToPrint);
            //             clearInterval(lineInter);
            //             resolve("Printed animately");
            //         }

            //     }, this.konsoleSettings.printLetterInterval);

            //     // Skip the animation if user presses space
            //     $("body").off("keydown").keydown((e) => {
            //         if (e.code === "Space") {
            //             LastKonsolePara.html(htmlToPrint);
            //             clearInterval(lineInter);
            //             resolve("Printed animately (interrupted)");
            //             $("body").off("keydown");
            //         }
            //     });

            // }
            // else {
            //     LastKonsolePara.html(htmlToPrint);
            //     resolve("Printed non-animately");
            // }
            LastKonsolePara.html(htmlToPrint);
            resolve("Printed non-animately");
        });
    }

    // async input(question) {
    //     await this.print(question + "\n");

    //     this.elem.append(this.konsoleSettings.konsoleLineMarkup());

    //     return new Promise((resolve, reject) => {
    //         $("body").off("keydown").keydown((e) => {
    //             // console.log(e);

    //             const lastKonsoleLineText = $(".KonsoleLine:last .KonsoleLineText");

    //             if (this.validInput.includes(e.key)) {
    //                 lastKonsoleLineText.text(lastKonsoleLineText.text() + e.key);
    //             }
    //             else if (e.code === "Enter") {
    //                 $("body").off("keydown");
    //                 resolve(lastKonsoleLineText.text());
    //             }
    //             else if (e.code === "Backspace") {
    //                 lastKonsoleLineText.text(lastKonsoleLineText.text().substr(0, lastKonsoleLineText.text().length - 1));
    //             }

    //         });
    //     });
    // }

    // async choice(question, choices) {
    //     await this.print(question);

    //     let lis = "";
    //     for (let i = 0; i < choices.length; i++) {
    //         const choice = choices[i];

    //         lis += `<li ${i == 0 ? "class='active'" : ""}>${choice}</li>`;
    //     }

    //     this.elem.append(this.konsoleSettings.konsoleChoiceMarkup(lis));


    //     return new Promise((resolve, reject) => {
    //         $("body").off("keydown").keydown((e) => {

    //             const lastChoices = $("ul.KonsoleChoice:last");

    //             if (e.code === "ArrowDown") {
    //                 let nextLiIndex = $(lastChoices).children(".active").index() + 1;

    //                 if (nextLiIndex >= $(lastChoices).children().length) nextLiIndex = 0;

    //                 $(lastChoices).children().removeClass("active");

    //                 $($(lastChoices).children().get(nextLiIndex)).addClass("active");
    //             }
    //             else if (e.code === "ArrowUp") {
    //                 let nextLiIndex = $(lastChoices).children(".active").index() - 1;

    //                 if (nextLiIndex < 0)
    //                     nextLiIndex = $(lastChoices).children().length - 1;

    //                 $(lastChoices).children().removeClass("active");

    //                 $($(lastChoices).children().get(nextLiIndex)).addClass("active");
    //             }
    //             else if (e.code === "Enter") {
    //                 $("body").off("keydown");
    //                 resolve($(lastChoices).children(".active").text());
    //             }
    //         });
    //     });
    // }
}; 