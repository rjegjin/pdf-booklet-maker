import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { duplicatePdf } from "./layout.js";
import { imposeBooklet } from "./booklet.js";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PDF Booklet Maker</title>
<style>
  :root { --accent: #2563eb; --border: #d1d5db; --bg: #f9fafb; --text: #111827; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; margin: 0; background: var(--bg); color: var(--text); }
  main { max-width: 640px; margin: 0 auto; padding: 2rem 1rem; }
  h1 { font-size: 1.5rem; }
  #drop { border: 2px dashed var(--border); border-radius: 12px; padding: 3rem 1rem; text-align: center; cursor: pointer; background: white; transition: border-color .15s, background .15s; }
  #drop.over { border-color: var(--accent); background: #eff6ff; }
  #drop.hasfile { border-style: solid; border-color: var(--accent); }
  fieldset { border: 1px solid var(--border); border-radius: 8px; margin: 1rem 0; background: white; }
  legend { font-weight: 600; padding: 0 .4rem; }
  label { display: inline-flex; align-items: center; gap: .35rem; margin: .25rem .75rem .25rem 0; }
  input[type=number], select { padding: .3rem .4rem; border: 1px solid var(--border); border-radius: 6px; width: 6.5rem; }
  button { background: var(--accent); color: white; border: 0; border-radius: 8px; padding: .7rem 1.6rem; font-size: 1rem; cursor: pointer; }
  button:disabled { background: #9ca3af; cursor: not-allowed; }
  #status { margin-top: 1rem; min-height: 1.5rem; }
  .err { color: #b91c1c; }
  .ok { color: #15803d; }
  .row { display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; padding: .6rem .8rem; }
</style>
</head>
<body>
<main>
  <h1>PDF Booklet Maker</h1>
  <p>Drop a PDF, choose a layout, get a printable A4 file. Runs entirely on this machine.</p>

  <div id="drop" tabindex="0">
    <strong id="dropLabel">Drop a PDF here or click to choose</strong>
    <input type="file" id="file" accept="application/pdf" hidden>
  </div>

  <fieldset>
    <legend>Layout</legend>
    <div class="row">
      <label><input type="radio" name="kind" value="grid" checked> Grid</label>
      <label><input type="radio" name="kind" value="booklet"> Saddle-stitch booklet</label>
    </div>
    <div class="row" id="gridOpts">
      <label>Columns <input type="number" id="cols" value="2" min="1" max="12"></label>
      <label>Rows <input type="number" id="rows" value="2" min="1" max="12"></label>
      <label>Margin (pt) <input type="number" id="margin" value="0" min="0"></label>
      <label>Gap (pt) <input type="number" id="gap" value="0" min="0"></label>
      <label>Rotate
        <select id="rotate">
          <option>none</option><option>auto</option><option>90</option><option>180</option><option>270</option>
        </select>
      </label>
      <label>Fit
        <select id="fit"><option>contain</option><option>cover</option><option>stretch</option></select>
      </label>
      <label><input type="checkbox" id="cutLine"> Cut lines</label>
      <label><input type="checkbox" id="cropMark"> Crop marks</label>
    </div>
    <div class="row" id="bookletOpts" style="display:none">
      <label>Signature size
        <select id="signatureSize">
          <option value="">whole document</option><option>4</option><option>8</option><option>16</option><option>32</option>
        </select>
      </label>
      <label>Duplex
        <select id="duplex"><option>short-edge</option><option>long-edge</option></select>
      </label>
    </div>
  </fieldset>

  <fieldset id="coverOpts" style="display:none">
    <legend>Cover (표지)</legend>
    <div class="row">
      <label><input type="radio" name="coverKind" value="none" checked> No cover</label>
      <label><input type="radio" name="coverKind" value="generate"> Generate a cover</label>
      <label><input type="radio" name="coverKind" value="upload"> Use a cover PDF</label>
    </div>
    <div class="row" id="coverGenFields" style="display:none">
      <label>Title <input type="text" id="coverTitle" placeholder="소책자 제목" style="width:14rem"></label>
      <label>Subtitle <input type="text" id="coverSubtitle" placeholder="부제 (선택)" style="width:12rem"></label>
      <label>Author <input type="text" id="coverAuthor" placeholder="작성자 (선택)" style="width:8rem"></label>
      <label>Date <input type="text" id="coverDate" placeholder="2026-07-06 (선택)" style="width:8rem"></label>
    </div>
    <div class="row" id="coverUploadField" style="display:none">
      <label>Cover PDF <input type="file" id="coverFile" accept="application/pdf"></label>
    </div>
  </fieldset>

  <button id="go" disabled>Convert</button>
  <div id="status"></div>
</main>
<script>
const drop = document.getElementById("drop");
const fileInput = document.getElementById("file");
const dropLabel = document.getElementById("dropLabel");
const go = document.getElementById("go");
const status = document.getElementById("status");
let file = null;

function setFile(f) {
  if (!f || f.type !== "application/pdf") {
    status.innerHTML = '<span class="err">Please choose a PDF file.</span>';
    return;
  }
  file = f;
  drop.classList.add("hasfile");
  dropLabel.textContent = f.name + " (" + (f.size / 1024 / 1024).toFixed(1) + " MB)";
  go.disabled = false;
  status.textContent = "";
}

drop.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => setFile(fileInput.files[0]));
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  setFile(e.dataTransfer.files[0]);
});

for (const radio of document.querySelectorAll('input[name=kind]')) {
  radio.addEventListener("change", () => {
    const booklet = document.querySelector('input[name=kind]:checked').value === "booklet";
    document.getElementById("gridOpts").style.display = booklet ? "none" : "";
    document.getElementById("bookletOpts").style.display = booklet ? "" : "none";
    document.getElementById("coverOpts").style.display = booklet ? "" : "none";
  });
}

for (const radio of document.querySelectorAll('input[name=coverKind]')) {
  radio.addEventListener("change", () => {
    const kind = document.querySelector('input[name=coverKind]:checked').value;
    document.getElementById("coverGenFields").style.display = kind === "generate" ? "" : "none";
    document.getElementById("coverUploadField").style.display = kind === "upload" ? "" : "none";
  });
}

function toBase64(f) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });
}

go.addEventListener("click", async () => {
  const booklet = document.querySelector('input[name=kind]:checked').value === "booklet";
  const params = new URLSearchParams();
  let coverFileToSend = null;
  if (booklet) {
    params.set("booklet", "1");
    const sig = document.getElementById("signatureSize").value;
    if (sig) params.set("signatureSize", sig);
    params.set("duplex", document.getElementById("duplex").value);

    const coverKind = document.querySelector('input[name=coverKind]:checked').value;
    if (coverKind === "generate") {
      const title = document.getElementById("coverTitle").value.trim();
      if (!title) { status.innerHTML = '<span class="err">Cover title is required to generate a cover.</span>'; return; }
      params.set("coverTitle", title);
      const sub = document.getElementById("coverSubtitle").value.trim();
      const author = document.getElementById("coverAuthor").value.trim();
      const date = document.getElementById("coverDate").value.trim();
      if (sub) params.set("coverSubtitle", sub);
      if (author) params.set("coverAuthor", author);
      if (date) params.set("coverDate", date);
    } else if (coverKind === "upload") {
      coverFileToSend = document.getElementById("coverFile").files[0];
      if (!coverFileToSend) { status.innerHTML = '<span class="err">Choose a cover PDF or switch cover mode.</span>'; return; }
    }
  } else {
    params.set("grid", document.getElementById("cols").value + "x" + document.getElementById("rows").value);
    params.set("margin", document.getElementById("margin").value);
    params.set("gap", document.getElementById("gap").value);
    params.set("rotate", document.getElementById("rotate").value);
    params.set("fit", document.getElementById("fit").value);
    if (document.getElementById("cutLine").checked) params.set("cutLine", "1");
    if (document.getElementById("cropMark").checked) params.set("cropMark", "1");
  }

  go.disabled = true;
  status.textContent = "Converting…";
  try {
    let fetchOptions;
    if (coverFileToSend) {
      fetchOptions = {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pdf: await toBase64(file),
          cover: await toBase64(coverFileToSend)
        })
      };
    } else {
      fetchOptions = {
        method: "POST",
        headers: { "content-type": "application/pdf" },
        body: file
      };
    }
    const res = await fetch("/api/convert?" + params, fetchOptions);
    if (!res.ok) throw new Error(await res.text());
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const suffix = booklet ? "-booklet" : "-" + params.get("grid");
    a.href = url;
    a.download = file.name.replace(/\\.pdf$/i, "") + suffix + ".pdf";
    a.click();
    URL.revokeObjectURL(url);
    status.innerHTML = '<span class="ok">Done — download started.</span>';
  } catch (err) {
    status.innerHTML = '<span class="err">' + err.message + "</span>";
  } finally {
    go.disabled = false;
  }
});
</script>
</body>
</html>`;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        reject(new Error("Upload too large (max 100 MB)."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function handleConvert(req, res, url) {
  const body = await readBody(req);

  if (body.length === 0) {
    throw new Error("Empty request body; POST the PDF bytes.");
  }

  let pdfBytes = body;
  let coverBytes = null;

  if ((req.headers["content-type"] ?? "").includes("application/json")) {
    const parsed = JSON.parse(body.toString("utf8"));

    if (!parsed.pdf) {
      throw new Error("JSON body must include a base64 'pdf' field.");
    }

    pdfBytes = Buffer.from(parsed.pdf, "base64");
    coverBytes = parsed.cover ? Buffer.from(parsed.cover, "base64") : null;
  }

  const q = url.searchParams;
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-booklet-"));
  const inputPath = path.join(workDir, "input.pdf");
  const coverPath = path.join(workDir, "cover.pdf");
  const outputPath = path.join(workDir, "output.pdf");

  try {
    await fs.writeFile(inputPath, pdfBytes);

    if (coverBytes) {
      await fs.writeFile(coverPath, coverBytes);
    }

    if (q.get("booklet")) {
      await imposeBooklet({
        input: inputPath,
        output: outputPath,
        signatureSize: q.get("signatureSize") ?? undefined,
        duplex: q.get("duplex") ?? "short-edge",
        coverPath: coverBytes ? coverPath : undefined,
        coverTitle: q.get("coverTitle") ?? undefined,
        coverSubtitle: q.get("coverSubtitle") ?? undefined,
        coverAuthor: q.get("coverAuthor") ?? undefined,
        coverDate: q.get("coverDate") ?? undefined
      });
    } else {
      await duplicatePdf({
        input: inputPath,
        output: outputPath,
        mode: q.get("mode") ?? undefined,
        grid: q.get("grid") ?? undefined,
        margin: q.get("margin") ?? 0,
        gap: q.get("gap") ?? 0,
        rotate: q.get("rotate") ?? "none",
        fit: q.get("fit") ?? "contain",
        cutLine: Boolean(q.get("cutLine")),
        cropMark: Boolean(q.get("cropMark"))
      });
    }

    const output = await fs.readFile(outputPath);
    res.writeHead(200, {
      "content-type": "application/pdf",
      "content-length": output.length
    });
    res.end(output);
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");

    try {
      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(PAGE);
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/convert") {
        await handleConvert(req, res, url);
        return;
      }

      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not found");
    } catch (error) {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      res.end(error.message);
    }
  });
}

export function openBrowser(url) {
  const candidates = process.platform === "darwin"
    ? [["open", [url]]]
    : process.platform === "win32"
      ? [["cmd", ["/c", "start", "", url]]]
      : [
          // WSL first: open in the Windows host browser.
          ["wslview", [url]],
          ["xdg-open", [url]]
        ];

  for (const [command, args] of candidates) {
    try {
      execFileSync("which", [command], { stdio: "ignore" });
    } catch {
      if (command !== "cmd") continue;
    }

    try {
      spawn(command, args, { detached: true, stdio: "ignore" }).unref();
      return true;
    } catch {
      // try the next candidate
    }
  }

  return false;
}

export function startServer({ port = 8383, host = "127.0.0.1" } = {}) {
  const server = createAppServer();

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve({ server, port: server.address().port, host }));
  });
}
