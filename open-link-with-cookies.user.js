// ==UserScript==
// @name         Open link with cookies
// @namespace    https://muakey.com
// @copyright    Muakey
// @version      0.1.0
// @description  Open link with custom cookies in query
// @grant        GM_cookie
// @author       NghiaNB
// @homepage     https://muakey.com
// @match        *://*/*
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/nghianb/muakey-userscripts/master/open-link-with-cookies.user.js
// ==/UserScript==

function parseCookie(str) {
  return str
    .split(";")
    .map((value) => value.split("="))
    .reduce((cookie, value, index) => {
      const start = value[0] ? decodeURIComponent(value[0].trim()) : "";
      const end = value[1] ? decodeURIComponent(value[1].trim()) : "";

      if (index === 0) {
        cookie.name = start;
        cookie.value = end;
      } else {
        cookie[start.toLocaleLowerCase()] = end;
      }

      return cookie;
    }, {});
}

async function sendFormData(url, data) {
  const formData = new FormData();

  for (const name in data) {
    formData.append(name, data[name]);
  }

  return await fetch(url, {
    method: "POST",
    body: formData,
  });
}

async function generateRandomHex() {
  try {
    const array = new Uint8Array(12);
    const randomBytes = window.crypto.getRandomValues(array);
    const hexString = Array.from(randomBytes)
      .map((byte) => ("0" + byte.toString(16)).slice(-2))
      .join("");
    return hexString;
  } catch (error) {
    console.error("Error generating random hex:", error);
    // Handle error appropriately
  }
}

(async function () {
  "use strict";

  let needRedirect = false;
  const search = new URLSearchParams(location.search);

  try {
    const refreshToken = search.get("refreshToken");
    search.delete("refreshToken");
    if (refreshToken) {
      needRedirect = true;
      GM_cookie.delete({ name: "steamLoginSecure" });
      const finalizeloginReponse = await sendFormData(
        "https://login.steampowered.com/jwt/finalizelogin",
        {
          nonce: refreshToken,
          sessionid: await generateRandomHex(),
          redir: "https://steamcommunity.com/login/home/?goto=",
        }
      ).then((response) => response.json());
      await Promise.all(
        finalizeloginReponse.transfer_info.map(({ url, params }) =>
          sendFormData(url, {
            steamID: finalizeloginReponse.steamID,
            ...params,
          })
        )
      );
    }
  } catch (error) {}

  const cookieStrs = search.getAll("with_cookie");
  search.delete("with_cookie");

  if (cookieStrs.length > 0) {
    needRedirect = true;
    for (const cookieStr of cookieStrs) {
      const cookie = parseCookie(cookieStr);
      GM_cookie.set({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: "secure" in cookie,
        httpOnly: "httponly" in cookie,
        expirationDate: cookie.expires
          ? new Date(cookie.expires).getTime() / 1000
          : undefined,
      });
    }
  }

  if (needRedirect) {
    location.search = search.toString();
  }
})();
