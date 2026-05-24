"use strict";
let ks = new KonsoleSettings();
ks.ElemSelector = "#Console";
ks.animatePrint = false;
ks.printLetterInterval = 20;
ks.registerDefaultKommands = false;
let konsole = new Konsole("#konsole-body", ks);
function toAnchorTag(text, url) {
  return `<a target='_blank' tabindex="-1" href='${url}'>${text}</a>`;
}

$(async () => {
  //#region cloud call
  //const response = await fetch("https://graph.perspective-v.com/api/resume", {
  //  method: "POST",
  //  headers: {
  //    "Content-Type": "application/json",
  //    Accept: "*/*",
  //  },
  //  body: JSON.stringify({
  //    query: `query getMyResume($token:String!){
  //              getbyaccesstoken(accesToken:$token){
  //                  name,
  //                  jsonData
  //            }
  //          }`,
  //    variables: {
  //      token: "PsoFcktcf0yrQvuYgbIjSA==",
  //    },
  //  }),
  //});
  //const body = await response.json();
  //var data = JSON.parse(body.data.getbyaccesstoken.jsonData);
  //#endregion cloud call

  //#region local call
  $.getJSON("./assets/data/profile.json", function (res) {
    let data = res.profile;

    konsole.RegisterKommand(
      new Kommand("about", "me", null, () => {
        return new Promise((resolve, reject) => {
          konsole.print(data.about).then(resolve);
        });
      })
    );

    konsole.RegisterKommand(
      new Kommand("skills", "list all skills and technologies", null, () => {
        return new Promise(async (resolve, reject) => {
          for (const skillCat of data.skill_categories) {
            await konsole.print(
              `${skillCat.category}\n${"¯".repeat(
                skillCat.category.length
              )}\n    ${skillCat.items.join(", ")}`
            );
          }
          resolve();
        });
      })
    );

    konsole.RegisterKommand(
      new Kommand(
        "projects",
        "projects i've worked or working on.",
        null,
        () => {
          return new Promise(async (resolve, reject) => {
            for (const project of data.projects) {
              await konsole.print(
                `${toAnchorTag(project.name, project.url)} - ${project.tech}`
              );
            }
            resolve();
          });
        }
      )
    );

    konsole.RegisterKommand(
      new Kommand("links", "links to my socials...", null, () => {
        return new Promise(async (resolve, reject) => {
          for (const link of data.links) {
            await konsole.print(toAnchorTag(link.name, link.url));
          }
          resolve();
        });
      })
    );

    konsole.RegisterKommand(
      new Kommand("-".repeat(10), "-".repeat(30), null, null)
    );

    konsole.RegisterDefaultKommands();

    konsole.RegisterKommand(
      new Kommand("neofetch", "Display system information", null, () => {
        return new Promise(async (resolve) => {
          const art = `
   WK    
  /  \\   OS: WebPortfolio v2.0
 / /\\ \\  Host: ${window.location.hostname}
/ /__\\ \\ Kernel: Senior Dev Core
\\  __  / Shell: bash-waqar
 \\/  \\/  Uptime: Infinite Potential
          `;
          await konsole.print(art);
          resolve();
        });
      })
    );

    konsole.RegisterKommand(
      new Kommand("close", "Close Resume.", null, () => {
        return new Promise((resolve, reject) => {
          window.close();
        });
      })
    );

    // konsole.print("If you don't know how to use it, please type \"help\" to find out commands.")
    // konsole.awaitKommand();
  });
  //#endregion local call
});
