/* Shared identity and private-age helpers for the app and coach console. */
(function () {
  "use strict";
  const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const b64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
  function age(dob, today) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || "")) return null;
    const d = new Date(dob + "T12:00:00"), t = new Date((today || new Date().toISOString().slice(0, 10)) + "T12:00:00");
    if (!Number.isFinite(+d) || d.toISOString().slice(0, 10) !== dob || d > t) return null;
    const n = t.getFullYear() - d.getFullYear() - (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate()) ? 1 : 0);
    return n >= 0 && n <= 120 ? n : null;
  }
  function username(value) { return String(value || "").trim().replace(/^@/, "").toLowerCase(); }
  function validUsername(value) { return /^[a-z0-9][a-z0-9._-]{2,29}$/.test(username(value)); }
  async function newAgeKey() {
    const key = await crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"]);
    return { publicKey: await crypto.subtle.exportKey("jwk", key.publicKey), privateKey: await crypto.subtle.exportKey("jwk", key.privateKey) };
  }
  async function sealAge(dob, publicKey) {
    const key = await crypto.subtle.importKey("jwk", publicKey, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
    return b64(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, new TextEncoder().encode(dob)));
  }
  async function openAge(encrypted, privateKey) {
    if (!encrypted || !privateKey) return null;
    try {
      const key = await crypto.subtle.importKey("jwk", privateKey, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
      const dob = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "RSA-OAEP" }, key, bytes(encrypted)));
      return age(dob);
    } catch (_) { return null; }
  }
  async function sealPayload(value, publicKeys) {
    const raw = crypto.getRandomValues(new Uint8Array(32)), iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
    const cipher = b64(await crypto.subtle.encrypt({name:"AES-GCM",iv}, key, new TextEncoder().encode(JSON.stringify(value))));
    const keys = {};
    for (const [id,jwk] of Object.entries(publicKeys)) {
      const publicKey = await crypto.subtle.importKey("jwk", jwk, {name:"RSA-OAEP",hash:"SHA-256"}, false, ["encrypt"]);
      keys[id] = b64(await crypto.subtle.encrypt({name:"RSA-OAEP"}, publicKey, raw));
    }
    return {cipher,iv:b64(iv),keys};
  }
  async function openPayload(payload, id, privateKey) {
    if (!payload || !payload.keys || !payload.keys[id] || !privateKey) return null;
    try {
      const rsa = await crypto.subtle.importKey("jwk",privateKey,{name:"RSA-OAEP",hash:"SHA-256"},false,["decrypt"]);
      const raw = await crypto.subtle.decrypt({name:"RSA-OAEP"},rsa,bytes(payload.keys[id]));
      const aes = await crypto.subtle.importKey("raw",raw,"AES-GCM",false,["decrypt"]);
      const data = await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes(payload.iv)},aes,bytes(payload.cipher));
      return JSON.parse(new TextDecoder().decode(data));
    } catch (_) { return null; }
  }
  function periodEnd(start, months) {
    if (!months) return start;
    const source=new Date(start+'T12:00:00'), day=source.getDate();
    const end=new Date(source.getFullYear(),source.getMonth()+months,1,12);
    end.setDate(Math.min(day,new Date(end.getFullYear(),end.getMonth()+1,0).getDate()));
    end.setDate(end.getDate()-1);
    return end.getFullYear()+'-'+String(end.getMonth()+1).padStart(2,'0')+'-'+String(end.getDate()).padStart(2,'0');
  }
  const count = (items) => (items || []).reduce((n, x) => n + (Number(x && x.c) || 1), 0);
  window.ARROW = { age, username, validUsername, newAgeKey, sealAge, openAge, sealPayload, openPayload, periodEnd, count };
})();
