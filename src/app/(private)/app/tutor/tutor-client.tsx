"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Conversation = {
  id: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED";
  updatedAt: string | Date;
};
type Source = {
  id?: string;
  title: string;
  sourceUrl?: string;
  location?: string;
};
type Message = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  status: string;
  sources?: Source[];
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.detail ?? "Não foi possível concluir a operação.");
  return body as T;
}

export function TutorClient({
  initialConversations,
}: {
  initialConversations: Conversation[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selected, setSelected] = useState(initialConversations[0]?.id ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!selected) return;
    request<{ data: Message[] }>(`/api/ai/conversations/${selected}/messages`)
      .then((result) => setMessages(result.data))
      .catch((caught) => setError((caught as Error).message));
  }, [selected]);

  async function createConversation() {
    setError("");
    try {
      const result = await request<{ data: Conversation }>(
        "/api/ai/conversations",
        { method: "POST", body: JSON.stringify({ title: "Nova conversa" }) },
      );
      setConversations((current) => [result.data, ...current]);
      setSelected(result.data.id);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const content = String(data.get("content") ?? "").trim();
    if (!content || !selected) return;
    form.reset();
    setPending(true);
    setError("");
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "USER", content, status: "COMPLETED" },
    ]);
    controller.current = new AbortController();
    try {
      const result = await request<{
        data: { message: Message; sources: Source[] };
      }>(`/api/ai/conversations/${selected}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
        signal: controller.current.signal,
      });
      setMessages((current) => [
        ...current,
        {
          ...result.data.message,
          role: "ASSISTANT",
          sources: result.data.sources,
        },
      ]);
    } catch (caught) {
      if ((caught as Error).name !== "AbortError")
        setError((caught as Error).message);
    } finally {
      setPending(false);
      controller.current = null;
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold text-teal-700">
        IA com fontes autorizadas
      </p>
      <h1 className="mt-2 text-3xl font-bold">Tutor inteligente</h1>
      <p className="mt-2 text-sm text-slate-600">
        As respostas podem conter erros. Confira as fontes e não use o tutor
        como substituto de material oficial.
      </p>
      <div className="mt-6 grid min-h-[65vh] gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <button
            onClick={createConversation}
            className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Nova conversa
          </button>
          <div className="mt-4 space-y-2" aria-label="Histórico de conversas">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelected(conversation.id)}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm ${selected === conversation.id ? "bg-teal-50 font-semibold text-teal-900" : "hover:bg-slate-50"}`}
              >
                {conversation.title}
              </button>
            ))}
            {!conversations.length && (
              <p className="p-3 text-sm text-slate-500">
                Crie uma conversa para começar.
              </p>
            )}
          </div>
        </aside>
        <section className="flex min-h-[36rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className="flex-1 space-y-4 overflow-y-auto p-5"
            aria-live="polite"
          >
            {!messages.length && (
              <div className="mx-auto mt-20 max-w-md text-center text-slate-500">
                <p className="font-semibold text-slate-700">
                  Como posso ajudar nos seus estudos?
                </p>
                <p className="mt-2 text-sm">
                  Peça uma explicação, consulte seus materiais ou pergunte o que
                  revisar.
                </p>
              </div>
            )}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-3xl rounded-2xl p-4 ${message.role === "USER" ? "ml-auto bg-teal-700 text-white" : "bg-slate-100 text-slate-900"}`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                </p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 border-t border-slate-300 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      Fontes
                    </p>
                    <ul className="mt-2 space-y-1 text-xs">
                      {message.sources.map((source, index) => (
                        <li key={source.id ?? `${source.title}-${index}`}>
                          {source.sourceUrl ? (
                            <a
                              className="underline"
                              href={source.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.title}
                            </a>
                          ) : (
                            source.title
                          )}
                          {source.location ? ` — ${source.location}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
            {pending && (
              <p className="text-sm text-slate-500" role="status">
                O tutor está preparando a resposta…
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}
          </div>
          <form onSubmit={send} className="border-t border-slate-200 p-4">
            <label className="sr-only" htmlFor="tutor-message">
              Mensagem para o tutor
            </label>
            <div className="flex gap-2">
              <textarea
                id="tutor-message"
                name="content"
                required
                maxLength={8000}
                disabled={!selected || pending}
                rows={2}
                placeholder={
                  selected
                    ? "Digite sua dúvida…"
                    : "Crie uma conversa para começar"
                }
                className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
              <button
                disabled={!selected || pending}
                className="rounded-xl bg-teal-700 px-5 font-semibold text-white disabled:opacity-50"
              >
                Enviar
              </button>
              {pending && (
                <button
                  type="button"
                  onClick={() => controller.current?.abort()}
                  className="rounded-xl border border-slate-300 px-4 text-sm font-semibold"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
