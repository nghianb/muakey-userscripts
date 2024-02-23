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

(function () {
  "use strict";

  const search = new URLSearchParams(location.search);

  const cookieStrs = search.getAll("with_cookie");

  if (cookieStrs.length > 0) {
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

    search.delete("with_cookie");
    location.search = search.toString();
  }
})();
