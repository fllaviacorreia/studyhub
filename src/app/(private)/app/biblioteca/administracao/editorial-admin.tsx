"use client";
import { useState } from "react";
export function EditorialAdmin() {
  const [message, setMessage] = useState("");
  const [material, setMaterial] = useState({
    title: "",
    content: "",
    topicIds: "",
  });
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/v1/learning-materials", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: material.title,
        content: material.content,
        topicIds: material.topicIds
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        kind: "ARTICLE",
        provenance: "AUTHORED",
        contentFormat: "MARKDOWN",
        visibility: "SHARED",
      }),
    });
    const payload = await response.json();
    setMessage(
      response.ok ? `Rascunho criado: ${payload.data.id}` : payload.detail,
    );
  }
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold text-teal-700">
        Administração editorial
      </p>
      <h1 className="mt-2 text-3xl font-bold">Novo material</h1>
      <form
        onSubmit={submit}
        className="mt-6 space-y-4 rounded-2xl border bg-white p-6"
      >
        <label className="block text-sm font-semibold">
          Título
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={material.title}
            onChange={(e) =>
              setMaterial({ ...material, title: e.target.value })
            }
          />
        </label>
        <label className="block text-sm font-semibold">
          Conteúdo em Markdown
          <textarea
            rows={12}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-mono"
            value={material.content}
            onChange={(e) =>
              setMaterial({ ...material, content: e.target.value })
            }
          />
        </label>
        <label className="block text-sm font-semibold">
          IDs dos assuntos (separados por vírgula)
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={material.topicIds}
            onChange={(e) =>
              setMaterial({ ...material, topicIds: e.target.value })
            }
          />
        </label>
        <button className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">
          Salvar rascunho
        </button>
        {message && <p role="status">{message}</p>}
      </form>
    </div>
  );
}
