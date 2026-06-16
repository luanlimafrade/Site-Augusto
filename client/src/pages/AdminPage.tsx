import {
  Download,
  Edit3,
  LogOut,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { photos, photoUrl } from "../data/photos";
import type { RsvpPayload, RsvpRecord, RsvpStats } from "../types";

const tokenKey = "daiane-augusto-admin-token";

const emptyStats: RsvpStats = {
  totalResponses: 0,
  totalAttending: 0,
  totalNotAttending: 0,
  totalGuests: 0
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`));

type CsvValue = string | number | boolean | null | undefined;

const csvEscape = (value: CsvValue) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [stats, setStats] = useState<RsvpStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [editing, setEditing] = useState<RsvpRecord | null>(null);

  const loadRsvps = async (activeToken = token) => {
    if (!activeToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.listRsvps(activeToken);
      setRsvps(result.rsvps);
      setStats(result.stats);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar as confirmações."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRsvps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    return rsvps.filter((rsvp) => {
      const text = `${rsvp.name} ${rsvp.phone} ${rsvp.inviteeNames}`.toLowerCase();
      const matchesQuery = text.includes(query.trim().toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "yes" && rsvp.attending) ||
        (filter === "no" && !rsvp.attending);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, rsvps]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const result = await api.login(password);
      localStorage.setItem(tokenKey, result.token);
      setToken(result.token);
      setPassword("");
    } catch (loginIssue) {
      setLoginError(
        loginIssue instanceof Error ? loginIssue.message : "Não foi possível entrar."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setRsvps([]);
    setStats(emptyStats);
  };

  const exportCsv = () => {
    const header = [
      "Nome",
      "Telefone",
      "Status",
      "Quantidade",
      "Nomes do convite",
      "Observações",
      "Criado em"
    ];
    const rows = filtered.map((rsvp) => [
      rsvp.name,
      rsvp.phone,
      rsvp.attending ? "Confirmado" : "Não comparecerá",
      rsvp.partySize,
      rsvp.inviteeNames,
      rsvp.notes,
      formatDate(rsvp.createdAt)
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((item) => csvEscape(item)).join(";"))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "confirmacoes-casamento.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (record: RsvpRecord) => {
    if (!token) return;
    const confirmed = window.confirm(`Excluir a confirmação de ${record.name}?`);
    if (!confirmed) return;

    await api.deleteRsvp(record.id, token);
    await loadRsvps(token);
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editing) return;

    const form = new FormData(event.currentTarget);
    const attending = form.get("attending") === "yes";
    const payload: RsvpPayload = {
      name: String(form.get("name") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      attending,
      partySize: attending ? Number(form.get("partySize") || 1) : 0,
      inviteeNames: String(form.get("inviteeNames") || "").trim(),
      notes: String(form.get("notes") || "").trim()
    };

    await api.updateRsvp(editing.id, token, payload);
    setEditing(null);
    await loadRsvps(token);
  };

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-28">
        <div className="absolute inset-0 -z-10">
          <img
            src={photoUrl(photos.admin)}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/55" />
        </div>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[1.5rem] border border-white/35 bg-ivory/92 p-6 shadow-soft backdrop-blur"
        >
          <ShieldCheck className="text-plum" size={30} />
          <h1 className="mt-5 font-display text-5xl font-semibold text-moss">
            Área dos noivos
          </h1>
          <p className="mt-3 text-sm leading-7 text-ink/68">
            Acesse as confirmações de presença do casamento.
          </p>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-moss">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="focus-ring mt-2 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-ink shadow-sm"
            />
          </label>
          {loginError ? (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-800">
              {loginError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="focus-ring mt-6 min-h-12 w-full rounded-full bg-moss px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-ink disabled:opacity-65"
          >
            {isLoggingIn ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="pt-28">
      <section className="page-shell py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-plum">
              Painel administrativo
            </p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-moss">
              Confirmações de presença
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadRsvps()}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-moss/15 bg-white/70 px-4 py-2 text-sm font-semibold text-moss"
            >
              <RefreshCcw size={16} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-moss/15 bg-white/70 px-4 py-2 text-sm font-semibold text-moss"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              type="button"
              onClick={logout}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-ivory"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Respostas", stats.totalResponses],
            ["Confirmados", stats.totalAttending],
            ["Pessoas", stats.totalGuests],
            ["Não poderão ir", stats.totalNotAttending]
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-moss/10 bg-white/72 p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
                {label}
              </p>
              <p className="mt-3 font-display text-4xl font-semibold text-moss">
                {value}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-moss/10 bg-white/70 p-4 shadow-sm md:flex-row">
          <label className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/42"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou telefone"
              className="focus-ring min-h-12 w-full rounded-full border border-moss/12 bg-white pl-11 pr-4 text-sm"
            />
          </label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            className="focus-ring min-h-12 rounded-full border border-moss/12 bg-white px-4 text-sm font-semibold text-moss"
          >
            <option value="all">Todos</option>
            <option value="yes">Confirmados</option>
            <option value="no">Não comparecerão</option>
          </select>
        </div>

        {error ? (
          <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-moss/10 bg-white/76 shadow-sm">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-linen/70 text-xs uppercase tracking-[0.16em] text-moss">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Telefone</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Qtd.</th>
                <th className="px-5 py-4">Pessoas do convite</th>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-moss/10">
              {filtered.map((rsvp) => (
                <tr key={rsvp.id} className="align-top">
                  <td className="px-5 py-4 font-semibold text-ink">{rsvp.name}</td>
                  <td className="px-5 py-4 text-ink/68">{rsvp.phone}</td>
                  <td className="px-5 py-4">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-bold",
                        rsvp.attending
                          ? "bg-sage/18 text-moss"
                          : "bg-lavender/20 text-plum"
                      ].join(" ")}
                    >
                      {rsvp.attending ? "Confirmado" : "Não irá"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ink/68">{rsvp.partySize}</td>
                  <td className="px-5 py-4 text-ink/68">
                    {rsvp.inviteeNames || "-"}
                    {rsvp.notes ? (
                      <p className="mt-2 text-xs text-ink/48">{rsvp.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-ink/68">
                    {formatDate(rsvp.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(rsvp)}
                        className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-moss/15 text-moss"
                        aria-label="Editar confirmação"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(rsvp)}
                        className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-red-200 text-red-700"
                        aria-label="Excluir confirmação"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink/58">
              Nenhuma confirmação encontrada.
            </p>
          ) : null}
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-2xl rounded-[1.5rem] bg-ivory p-5 shadow-soft md:p-7"
          >
            <h2 className="font-display text-4xl font-semibold text-moss">
              Editar confirmação
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input name="name" defaultValue={editing.name} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3" />
              <input name="phone" defaultValue={editing.phone} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3" />
              <select name="attending" defaultValue={editing.attending ? "yes" : "no"} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3">
                <option value="yes">Confirmado</option>
                <option value="no">Não comparecerá</option>
              </select>
              <input name="partySize" type="number" min={0} defaultValue={editing.partySize} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3" />
              <input name="inviteeNames" defaultValue={editing.inviteeNames} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3 md:col-span-2" />
              <textarea name="notes" defaultValue={editing.notes} rows={3} className="focus-ring resize-none rounded-2xl border border-moss/15 bg-white px-4 py-3 md:col-span-2" />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="focus-ring rounded-full border border-moss/15 px-5 py-3 text-sm font-semibold text-moss"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="focus-ring rounded-full bg-moss px-5 py-3 text-sm font-semibold text-ivory"
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
